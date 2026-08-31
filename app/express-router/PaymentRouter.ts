import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import express from "express"
import { prisma } from "../../prisma/prisma"
import { authentificationMiddleware } from "~/middleware/authMiddleware"
import {
  PaymentWebhookService,
  StripeWebhookService
} from "~/server/payments/PaymentWebhookService"
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError
} from "~/server/auth/custom-errors"
import type Stripe from "stripe"
import type { Prisma } from "../../generated/prisma/client"
import { PaymentQueryService } from "~/server/payments/PaymentQueryService"
import {
  PaymentActionService,
  StripeProcessor,
  StripeRefundProvider
} from "~/server/payments/PaymentActionService"

export type PaymentDetailsResponse = Prisma.PaymentGetPayload<{
  include: {
    booking: {
      include: {
        trip: true
      }
    }
  }
}>

export const PaymentRouter = express.Router()
const stripeProcessor = new StripeProcessor()
const stripeProvider = new StripeRefundProvider()
const stripeWebhookService = new StripeWebhookService(prisma)
const paymentQueryService = new PaymentQueryService(prisma)
const paymentActionService = new PaymentActionService(
  prisma,
  stripeProcessor,
  stripeProvider
)
const paymentWebhookService = new PaymentWebhookService(
  prisma,
  stripeWebhookService
)

PaymentRouter.post(
  "/create-checkout-session",
  authentificationMiddleware,
  async (
    req: Request<{}, {}, { booking_id: string }>,
    res: Response<{
      url?: string | null
      success: boolean
      message: string
    }>,
    next: NextFunction
  ) => {
    const bookingId = req.body.booking_id
    const userId = req?.user?.id as string
    if (!bookingId) {
      return res.status(400).json({
        message:
          "BookingID is mandatory for the transaction to keep on going!",
        success: false
      })
    }
    try {
      const { url } =
        await paymentActionService.processBookingPayment(
          bookingId,
          userId
        )
      return res.status(200).json({
        url,
        success: true,
        message: "Payment request processed!"
      })
    } catch (err) {
      if (err instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          message: err.message
        })
      } else if (err instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: err.message
        })
      } else return next(err)
    }
  }
)

PaymentRouter.patch(
  "/cancel-booking/:bookingId",
  authentificationMiddleware,
  async (
    req: Request<{ bookingId: string }, {}, {}>,
    res: Response<{ success: boolean; message: string }>,
    next: NextFunction
  ) => {
    try {
      const bookingId = req.params.bookingId
      const userId = req.user?.id
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "Booking ID is required!"
        })
      }
      const result = await paymentActionService.cancelPayment(
        bookingId,
        userId as string
      )
      return res.status(200).json({
        success: true,
        message: result.message
      })
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
          success: false,
          message: error.message
        })
      } else if (error instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          message: error.message
        })
      }
      return next(error)
    }
  }
)

PaymentRouter.get(
  "/payment-details/:bookingId",
  authentificationMiddleware,
  async (
    req: Request<{ bookingId: string }, {}, {}>,
    res: Response<{
      success: boolean
      message: string
      paymentApiResponse?: PaymentDetailsResponse
    }>,
    next: NextFunction
  ) => {
    try {
      const bookingId = req.params.bookingId
      const userId = req.user?.id
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "Booking ID is required!"
        })
      }
      const payment = await paymentQueryService.showPaymentDetails(
        userId as string,
        bookingId
      )
      return res.status(200).json({
        success: true,
        paymentApiResponse: payment,
        message: "Payment details fetched succesfully!"
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          message: error.message,
          success: false
        })
      }
      return next(error)
    }
  }
)

export const webhookHandler = PaymentRouter.post(
  "/webhook",
  async (
    req: Request,
    res: Response<{ success: boolean; message: string }>,
    next: NextFunction
  ) => {
    const signature = req.headers["stripe-signature"]
    if (!signature || typeof signature !== "string") {
      return res.status(400).json({
        success: false,
        message: "Missing stripe-signature header"
      })
    }
    let event: Stripe.Event | null = null
    try {
      event = await paymentWebhookService.constructStripeWebhook(
        req.body as Buffer,
        signature as string | string[]
      )
    } catch (err) {
      console.log(`Error recieved from webhook ${err}`)
      return next(err)
    }
    try {
      await paymentWebhookService.processWebhookEvents(event)
      return res.status(200).json({
        success: true,
        message: "Webhook was recieved succesfully!"
      })
    } catch (error) {
      return next(error)
    }
  }
)

PaymentRouter.post(
  "/refund-booking/:bookingId",
  authentificationMiddleware,
  async (
    req: Request<{ bookingId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    let bookingId = req?.params?.bookingId
    let userId = req?.user?.id
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required!"
      })
    }
    try {
      await paymentActionService.refundPayment(
        bookingId,
        userId as string
      )
      return res.status(200).json({
        success: true,
        message:
          "Refund processed and booking cancelled successfully!"
      })
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({
          message: err.message,
          success: false
        })
      } else if (err instanceof BadRequestError) {
        return res.status(404).json({
          message: err.message,
          success: false
        })
      }
      return next(err)
    }
  }
)
