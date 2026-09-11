import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import { prisma } from "../../prisma/prisma"
import express from "express"
import { authentificationMiddleware } from "~/middleware/authMiddleware"
import type { Prisma } from "../../generated/prisma/client"
import {
  createReviewSchema,
  idSchema
} from "~/utils/validation/zod-validation"
import type z from "zod"
import { ReviewCreationService } from "~/server/reviews/ReviewCreationService"
import {
  Conflict,
  ForbiddenError,
  NotFoundError
} from "~/server/auth/custom-errors"
import { ReviewQueryService } from "~/server/reviews/ReviewQueryService"
import { ReviewManagementService } from "~/server/reviews/ReviewManagementService"

const reviewCreationService = new ReviewCreationService(prisma)
const reviewQueryService = new ReviewQueryService(prisma)
const reviewManagementService = new ReviewManagementService(prisma)

const updateReviewSchema = createReviewSchema.omit({ trip_id: true })

type ReviewsResponse = {
  success: boolean
  message?: string
  averageRating?: number | null
  reviews?: Prisma.ReviewGetPayload<{
    include: {
      user: {
        select: {
          id: true
          name: true
          avatar_url: true
        }
      }
    }
  }>[]
}

export const ReviewRouter = express.Router()

ReviewRouter.post(
  "/",
  authentificationMiddleware,
  async (
    req: Request<{}, {}, z.infer<typeof createReviewSchema>>,
    res: Response<{ success: boolean; message: string }>,
    next: NextFunction
  ) => {
    try {
      const userId = idSchema.safeParse(req.user?.id)
      if (!userId.success) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        })
      }

      const result = createReviewSchema.safeParse(req.body)
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "A valid trip ID, rating from 1 to 5, and comment are required."
        })
      }

      const { trip_id, rating, comment } = result.data

      await reviewCreationService.createReview(
        trip_id,
        userId.data,
        rating,
        comment
      )
      return res.status(201).json({
        success: true,
        message: "Review created succesfully"
      })
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return res.status(403).json({
          success: false,
          message: err.message
        })
      } else if (err instanceof Conflict) {
        return res.status(409).json({
          success: false,
          message: err.message
        })
      }
      return next(err)
    }
  }
)

ReviewRouter.get(
  "/trip/:tripId",
  authentificationMiddleware,
  async (
    req: Request<{ tripId: string }>,
    res: Response<ReviewsResponse>,
    next: NextFunction
  ) => {
    try {
      const resultSchema = idSchema.safeParse(req.params.tripId)
      if (!resultSchema.success) {
        return res.status(400).json({
          success: false,
          message: "A valid trip ID is required."
        })
      }
      let tripId = resultSchema.data
      const { reviews, averageRating } =
        await reviewQueryService.getReviewsByTrip(tripId)
      return res.status(200).json({
        success: true,
        reviews,
        averageRating
      })
    } catch (err) {
      return next(err)
    }
  }
)

ReviewRouter.get(
  "/:reviewId",
  authentificationMiddleware,
  async (
    req: Request<{ reviewId: string }>,
    res: Response<{
      success: boolean
      message?: string
      review?: {
        id: number
        rating: number
        comment: string
        trip_id: number
        booking_id: number
        created_at: Date
      }
    }>,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?.id
      const reviewId = idSchema.safeParse(req.params.reviewId)
      if (!reviewId.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID format"
        })
      }

      const review = await reviewQueryService.getReview(
        reviewId.data,
        Number(userId)
      )
      return res.status(200).json({
        success: true,
        review
      })
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: err.message
        })
      }
      return next(err)
    }
  }
)

ReviewRouter.patch(
  "/:reviewId",
  authentificationMiddleware,
  async (
    req: Request<
      { reviewId: string },
      {},
      z.infer<typeof updateReviewSchema>
    >,
    res: Response<{ success: boolean; message: string }>,
    next: NextFunction
  ) => {
    try {
      const reviewId = idSchema.safeParse(req.params.reviewId)
      if (!reviewId.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID format"
        })
      }

      const result = updateReviewSchema.safeParse(req.body)
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            "A valid rating from 1 to 5 and comment are required."
        })
      }

      await reviewManagementService.updateReview(
        reviewId.data,
        req.user?.id as string,
        result.data.rating,
        result.data.comment
      )

      return res.status(200).json({
        success: true,
        message: "Review updated successfully."
      })
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: err.message
        })
      }
      return next(err)
    }
  }
)

ReviewRouter.delete(
  "/:reviewId",
  authentificationMiddleware,
  async (
    req: Request<{ reviewId: string }>,
    res: Response<{ success: boolean; message: string }>,
    next: NextFunction
  ) => {
    try {
      const userId = Number(req.user?.id)
      const parseResult = idSchema.safeParse(req.params.reviewId)
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format"
        })
      }
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        })
      }
      const reviewId = parseResult.data
      await reviewManagementService.deleteReview(reviewId, userId)
      return res.status(200).json({
        success: true,
        message: "Review deleted successfully."
      })
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: err.message
        })
      }
      return next(err)
    }
  }
)
