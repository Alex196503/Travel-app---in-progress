import type { PrismaClient } from "../../../generated/prisma/client"
import { BadRequestError, NotFoundError } from "../auth/custom-errors"

export class ReplyManagementService {
  constructor(private readonly prisma: PrismaClient) {}

  async getRepliesForReview(tripId: number, reviewId: number) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        trip_id: tripId
      },
      select: { id: true }
    })

    if (!review) {
      throw new NotFoundError("Review not found for this trip.")
    }

    const replies = await this.prisma.replies.findMany({
      where: { review_id: review.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        comment: true,
        createdAt: true,
        reply_to_id: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    type ReplyTreeNode = {
      id: number
      comment: string
      createdAt: Date
      user: { id: number; name: string }
      replies: ReplyTreeNode[]
    }

    const nodes = new Map<number, ReplyTreeNode>()
    for (const reply of replies) {
      nodes.set(reply.id, {
        id: reply.id,
        comment: reply.comment,
        createdAt: reply.createdAt,
        user: reply.user,
        replies: []
      })
    }

    const rootReplies: ReplyTreeNode[] = []
    for (const reply of replies) {
      const node = nodes.get(reply.id)!
      const parent = reply.reply_to_id
        ? nodes.get(reply.reply_to_id)
        : undefined

      if (parent) {
        parent.replies.push(node)
      } else {
        rootReplies.push(node)
      }
    }

    return rootReplies
  }

  async createReply(
    tripId: number,
    reviewId: number,
    userId: number,
    comment: string,
    replyToId: number | null = null
  ) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        trip_id: tripId
      },
      select: { id: true }
    })

    if (!review) {
      throw new NotFoundError("Review not found for this trip.")
    }

    if (replyToId !== null) {
      const parentReply = await this.prisma.replies.findFirst({
        where: {
          id: replyToId,
          review_id: review.id
        },
        select: {
          id: true,
          reply_to_id: true
        }
      })

      if (!parentReply) {
        throw new NotFoundError("Reply not found for this review.")
      }

      if (parentReply.reply_to_id !== null) {
        throw new BadRequestError(
          "Replies can only be nested two levels deep."
        )
      }
    }

    return this.prisma.replies.create({
      data: {
        review_id: review.id,
        user_id: userId,
        comment,
        reply_to_id: replyToId
      }
    })
  }

  async updateReply(
    replyId: number,
    userId: number,
    comment: string
  ) {
    const result = await this.prisma.replies.updateMany({
      where: {
        id: replyId,
        user_id: userId
      },
      data: { comment }
    })

    if (result.count === 0) {
      throw new NotFoundError("Reply not found.")
    }
  }

  async deleteReply(replyId: number, userId: number) {
    const result = await this.prisma.replies.deleteMany({
      where: {
        id: replyId,
        user_id: userId
      }
    })

    if (result.count === 0) {
      throw new NotFoundError("Reply not found.")
    }
  }
}
