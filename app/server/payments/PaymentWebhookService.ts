import {
  notificationEventEmitter,
  type INotificationEventEmitter
} from "~/events/NotificationEventEmitter"
import { PrismaClient } from "../../../generated/prisma/client"
import { Stripe } from "stripe"
export const stripe = new Stripe(process.env.SECRET_STRIPE_KEY || "")

// Service responsible for managing Stripe webhook operations, including cryptographic signature validation and orchestrating event processing through registered strategies.

interface StripeEventHandler {
  handle(event: Stripe.Event): Promise<void>
}

interface PaymentWebhookServiceHandler {
  handleWebhookEvents(event: Stripe.Event): Promise<void>
}

class CheckoutCompletedHandler implements StripeEventHandler {
  private prisma: PrismaClient
  private notificationEmitter: INotificationEventEmitter
  constructor(
    prisma: PrismaClient,
    notificationEmitter: INotificationEventEmitter
  ) {
    this.prisma = prisma
    this.notificationEmitter = notificationEmitter
  }
  async handle(event: Stripe.Event): Promise<void> {
    const session = event?.data.object as Stripe.Checkout.Session
    const bookingId = Number(session.metadata?.booking_id)
    const paymentIntent = session.payment_intent as string
    let result = await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: {
          booking_id: bookingId
        },
        data: {
          status: "SUCCEEDED",
          stripe_payment_intent_id: paymentIntent
        }
      })
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" }
      })
      const newNotification = await tx.notifications.create({
        data: {
          user_id: Number(session.metadata?.user_id),
          message: `Your payment #${bookingId} has been made successfully!`,
          type: "PAYMENT_SUCCEEDED",
          was_read: false
        }
      })
      return newNotification
    })
    this.notificationEmitter.emit("payment.succeeded", result)
  }
}

class PaymentFailedHandler implements StripeEventHandler {
  private prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  async handle(event: Stripe.Event): Promise<void> {
    const session = event?.data.object as Stripe.Checkout.Session
    const bookingId = Number(session.metadata?.booking_id)
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { booking_id: bookingId, status: "PENDING" },
        data: { status: "FAILED" }
      })
    })
  }
}

class CheckoutExpiredHandler implements StripeEventHandler {
  private prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  async handle(event: Stripe.Event): Promise<void> {
    const session = event?.data.object as Stripe.Checkout.Session
    const bookingId = Number(session.metadata?.booking_id)
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId }
    })
    await this.prisma.$transaction(async (tx) => {
      let resultCount = await tx.payment.updateMany({
        where: {
          booking_id: bookingId,
          status: "PENDING"
        },
        data: { status: "CANCELLED" }
      })
      if (resultCount.count === 0) {
        throw new Error(
          "Could not update the status of your payments!"
        )
      }
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" }
      })
      if (booking) {
        await tx.trip.update({
          where: { id: booking.trip_id },
          data: {
            available_seats: {
              increment: booking.seats_booked
            }
          }
        })
      }
    })
  }
}

class ChargeRefundedHandler implements StripeEventHandler {
  private prisma: PrismaClient
  private notificationEmitter: INotificationEventEmitter

  constructor(
    prisma: PrismaClient,
    notificationEmitter: INotificationEventEmitter
  ) {
    this.prisma = prisma
    this.notificationEmitter = notificationEmitter
  }
  async handle(event: Stripe.Event): Promise<void> {
    const charge = event?.data.object as Stripe.Charge
    const paymentIntentId = charge.payment_intent as string
    const payment = await this.prisma.payment.findFirst({
      where: { stripe_payment_intent_id: paymentIntentId },
      include: {
        booking: {
          include: { trip: true }
        }
      }
    })
    if (!payment) {
      console.log(`Payment not found for intent: ${paymentIntentId}`)
      return
    }
    let result = await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: {
          stripe_payment_intent_id: paymentIntentId,
          status: "SUCCEEDED"
        },
        data: { status: "REFUNDED" }
      })

      await tx.booking.update({
        where: { id: payment.booking_id },
        data: { status: "CANCELLED" }
      })

      if (payment.booking) {
        await tx.trip.update({
          where: { id: payment.booking.trip.id },
          data: {
            available_seats: {
              increment: payment.booking.seats_booked
            }
          }
        })
      }
      let newNotification = await tx.notifications.create({
        data: {
          user_id: payment.user_id,
          message: `Your payment #${payment.booking_id} has been refunded successfully!`,
          type: "PAYMENT_REFUNDED",
          was_read: false
        }
      })
      return newNotification
    })
    this.notificationEmitter.emit("payment.refunded", result)
  }
}

export class StripeWebhookService implements PaymentWebhookServiceHandler {
  private handlers: Map<string, StripeEventHandler> = new Map()
  private prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.handlers.set(
      "checkout.session.completed",
      new CheckoutCompletedHandler(prisma, notificationEventEmitter)
    )
    this.handlers.set(
      "payment_intent.payment_failed",
      new PaymentFailedHandler(prisma)
    )
    this.handlers.set(
      "checkout.session.async_payment_failed",
      new PaymentFailedHandler(prisma)
    )
    this.handlers.set(
      "checkout.session.expired",
      new CheckoutExpiredHandler(prisma)
    )
    this.handlers.set(
      "charge.refunded",
      new ChargeRefundedHandler(prisma, notificationEventEmitter)
    )
  }

  async handleWebhookEvents(event: Stripe.Event): Promise<void> {
    const handler = this.handlers.get(event.type)
    if (!handler) {
      console.log(`Unhandled event type! ${event.type}`)
      return
    }
    await handler.handle(event)
  }
}

export class PaymentWebhookService {
  private prisma: PrismaClient
  private paymentWebhookService: PaymentWebhookServiceHandler
  constructor(
    prisma: PrismaClient,
    paymentWebhookService: PaymentWebhookServiceHandler
  ) {
    this.prisma = prisma
    this.paymentWebhookService = paymentWebhookService
  }
  async constructStripeWebhook(
    rawBody: Buffer,
    signature: string | string[]
  ) {
    let event: Stripe.Event
    let endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ""
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature as string,
      endpointSecret
    )
    return event
  }

  async processWebhookEvents(event: Stripe.Event) {
    await this.paymentWebhookService.handleWebhookEvents(event)
  }
}
