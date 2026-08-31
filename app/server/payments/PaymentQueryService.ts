import { PrismaClient } from "../../../generated/prisma/client"
import { Stripe } from "stripe"
import { NotFoundError } from "../auth/custom-errors"
export const stripe = new Stripe(process.env.SECRET_STRIPE_KEY || "")

// Service responsible for handling all read-only operations related to payments, including transaction details, audit logs, financial aggregations, or statistics.
export class PaymentQueryService {
  prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  async showPaymentDetails(userId: string, bookingId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        booking_id: Number(bookingId),
        user_id: Number(userId)
      },
      include: {
        booking: {
          include: {
            trip: true
          }
        }
      }
    })
    if (!payment) {
      throw new NotFoundError(
        "Payment details not found for this booking!"
      )
    }
    return payment
  }
}
