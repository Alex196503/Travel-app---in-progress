//Service responsible for handling state-mutating operations related to payments, such as creating Stripe Checkout sessions, cancelling payments and refunds.

import Stripe from "stripe"
import type { CreateSessionParams } from "~/types/types"
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError
} from "../auth/custom-errors"
import type { PrismaClient } from "../../../generated/prisma/client"
import type { INotificationEventEmitter } from "~/events/NotificationEventEmitter"
export const stripe = new Stripe(process.env.SECRET_STRIPE_KEY || "")

export const formatAmountForGateway = (
  price: number | string
): number => {
  return Math.round(Number(price) * 100)
}

interface IPaymentProcessor {
  createCheckoutSession(params: CreateSessionParams): Promise<{
    checkoutUrl: string
  }>
}

interface IPaymentRefundProvider {
  refund(paymentIntentId: string): Promise<void>
}

export class StripeProcessor implements IPaymentProcessor {
  async createCheckoutSession(params: CreateSessionParams): Promise<{
    checkoutUrl: string
  }> {
    const unitAmountInCents = formatAmountForGateway(
      Number(params.totalPrice)
    )
    if (unitAmountInCents <= 0) {
      throw new BadRequestError(
        "Invalid total amount for your transaction!"
      )
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${params.bookingId}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel?booking_id=${params.bookingId}`,
      customer_email: params.userEmail,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Trip reservation #${params.tripId}`,
              description: `Reserved seats: ${params.seatsBooked}`
            },
            unit_amount: unitAmountInCents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      invoice_creation: {
        enabled: true
      },
      metadata: {
        booking_id: params.bookingId.toString(),
        user_id: params.userId.toString()
      }
    })
    return {
      checkoutUrl: session.url || ""
    }
  }
}

export class StripeRefundProvider implements IPaymentRefundProvider {
  async refund(paymentIntentId: string): Promise<void> {
    await stripe.refunds.create({
      payment_intent: paymentIntentId
    })
  }
}

export class PaymentActionService {
  private prisma: PrismaClient
  private paymentProcessor: IPaymentProcessor
  private paymentRefundProvider: IPaymentRefundProvider
  private readonly notificationEmitter: INotificationEventEmitter
  constructor(
    prisma: PrismaClient,
    paymentProcessor: IPaymentProcessor,
    stripeRefundProvider: IPaymentRefundProvider,
    notificationEmitter: INotificationEventEmitter
  ) {
    this.prisma = prisma
    this.paymentProcessor = paymentProcessor
    this.paymentRefundProvider = stripeRefundProvider
    this.notificationEmitter = notificationEmitter
  }
  async processBookingPayment(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: Number(bookingId),
        user_id: Number(userId)
      },
      include: {
        trip: true,
        user: true
      }
    })
    if (!booking) {
      throw new NotFoundError("Booking not found!")
    }
    if (
      booking?.status === "CONFIRMED" ||
      booking?.status === "CANCELLED"
    ) {
      throw new BadRequestError(
        "Booking has already been paid or cancelled!"
      )
    }

    const { checkoutUrl } =
      await this.paymentProcessor.createCheckoutSession({
        bookingId: booking.id,
        userId: booking.user_id,
        totalPrice: Number(booking.total_price),
        seatsBooked: booking.seats_booked,
        tripId: booking.trip_id,
        userEmail: booking.user.email,
        successUrl: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
        cancelUrl: `${process.env.FRONTEND_URL}/checkout/cancel?booking_id=${booking.id}`
      })

    await this.prisma.payment.create({
      data: {
        booking_id: booking.id,
        user_id: booking.user_id,
        amount: booking.total_price,
        status: "PENDING"
      }
    })
    return { url: checkoutUrl }
  }

  async cancelPayment(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: Number(bookingId), user_id: Number(userId) }
    })
    if (!booking) {
      throw new ForbiddenError(
        "You are not authorized to cancel this booking!"
      )
    }
    if (
      booking.status === "CANCELLED" ||
      booking.status === "CONFIRMED"
    ) {
      throw new BadRequestError(
        "Booking was already cancelled or confirmed."
      )
    }

    let result = await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: Number(bookingId) },
        data: { status: "CANCELLED" }
      })
      let bookingsUpdated = await tx.payment.updateMany({
        where: { booking_id: Number(bookingId), status: "PENDING" },
        data: { status: "CANCELLED" }
      })
      if (bookingsUpdated.count === 0) {
        throw new Error(
          "Could not update payment status to cancelled!"
        )
      }
      await tx.trip.update({
        where: { id: booking.trip_id },
        data: {
          available_seats: { increment: booking.seats_booked }
        }
      })
      let newNotification = await tx.notifications.create({
        data: {
          user_id: Number(userId),
          message: `Your booking #${bookingId} has been cancelled successfully!`,
          type: "BOOKING_CANCELLED",
          was_read: false
        }
      })
      return newNotification
    })
    this.notificationEmitter.emit("booking.cancelled", result)
    return { message: "Booking cancelled succesfully!" }
  }

  async refundPayment(bookingId: string, userId: string) {
    const bookingDetails = await this.prisma.payment.findFirst({
      where: {
        booking_id: Number(bookingId),
        user_id: Number(userId),
        status: "SUCCEEDED"
      },
      include: {
        booking: {
          include: {
            trip: true
          }
        }
      }
    })
    if (!bookingDetails) {
      throw new NotFoundError("Booking not found!")
    }
    if (bookingDetails.booking.status === "CANCELLED") {
      throw new BadRequestError("Booking is already cancelled!")
    }

    let paymentIntent = bookingDetails.stripe_payment_intent_id
    if (!paymentIntent) {
      throw new BadRequestError(
        "This booking does not have a valid successful payment to refund!"
      )
    }
    await this.paymentRefundProvider.refund(paymentIntent)
  }
}
