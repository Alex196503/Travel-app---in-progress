import { type PrismaClient } from "../../../generated/prisma/client"
import { NotFoundError } from "../auth/custom-errors"
export class ReviewQueryService {
  private prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  async getReviewsByTrip(tripId: number) {
    const [reviews, averageResult] = await Promise.all([
      this.prisma.review.findMany({
        where: { trip_id: tripId },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          user_id: true,
          trip_id: true,
          booking_id: true,
          created_at: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar_url: true
            }
          }
        }
      }),
      this.prisma.review.aggregate({
        where: { trip_id: tripId },
        _avg: { rating: true }
      })
    ])
    return { reviews, averageRating: averageResult._avg.rating }
  }

  async getReview(reviewId: number, userId: number) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        user_id: Number(userId)
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        trip_id: true,
        booking_id: true,
        created_at: true
      }
    })
    if (!review) {
      throw new NotFoundError("Review not found.")
    }
    return review
  }
}
