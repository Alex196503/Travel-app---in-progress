import {
  Prisma,
  type PrismaClient
} from "../../../generated/prisma/client"
import { Conflict, ForbiddenError } from "../auth/custom-errors"
export class ReviewCreationService {
  private prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  async createReview(
    tripId: number,
    user_id: number,
    rating: number,
    comment: string
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        user_id,
        trip_id: tripId,
        status: "CONFIRMED"
      },
      select: { id: true }
    })
    if (!booking) {
      throw new ForbiddenError(
        "You can only review a confirmed booking for this trip."
      )
    }
    const existingReview = await this.prisma.review.findUnique({
      where: { booking_id: booking.id },
      select: { id: true }
    })
    if (existingReview) {
      throw new Conflict("You have already reviewed this trip")
    }
    try {
      await this.prisma.review.create({
        data: {
          trip_id: tripId,
          user_id,
          booking_id: booking.id,
          rating,
          comment
        }
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Conflict("You have already reviewed this trip")
      }

      throw error
    }
    return null
  }
}
