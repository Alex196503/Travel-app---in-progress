import type { PrismaClient } from "../../../generated/prisma/client"
import { NotFoundError } from "../auth/custom-errors"

export class ReviewManagementService {
  private prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  async updateReview(
    reviewId: number,
    userId: string,
    rating: number,
    comment: string
  ) {
    const updatedReview = await this.prisma.review.updateMany({
      where: {
        id: reviewId,
        user_id: Number(userId)
      },
      data: {
        rating,
        comment
      }
    })

    if (updatedReview.count === 0) {
      throw new NotFoundError("Review not found.")
    }
    return null
  }

  async deleteReview(reviewId: number, userId: number) {
    const result = await this.prisma.review.deleteMany({
      where: { id: reviewId, user_id: userId }
    })
    if (result.count === 0) {
      throw new NotFoundError(
        "Review not found or you are not allowed to delete it."
      )
    }
    return null
  }
}
