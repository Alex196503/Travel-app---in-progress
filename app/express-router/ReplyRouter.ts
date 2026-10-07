import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import { prisma } from "../../prisma/prisma"
import { ReplyManagementService } from "~/server/reviews/ReplyManagementService"
import express from "express"
import { authentificationMiddleware } from "~/middleware/authMiddleware"
import {
  idSchema,
  replySchema,
  replyUpdateSchema
} from "~/utils/validation/zod-validation"
import type z from "zod"
import {
  BadRequestError,
  NotFoundError
} from "~/server/auth/custom-errors"
export const ReplyRouter = express.Router()
const replyManagementService = new ReplyManagementService(prisma)
ReplyRouter.post(
  "/create/trips/:tripId",
  authentificationMiddleware,
  async (
    req: Request<{ tripId: string }, {}, z.infer<typeof replySchema>>,
    res: Response<{ success: boolean; message: string }>,
    next: NextFunction
  ) => {
    const tripId = idSchema.safeParse(req.params.tripId)
    const userId = idSchema.safeParse(req.user?.id)
    const result = replySchema.safeParse(req.body)

    if (!tripId.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip ID."
      })
    }
    if (!userId.success) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
    }
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message:
          "A valid review ID and non-empty comment are required."
      })
    }

    try {
      await replyManagementService.createReply(
        tripId.data,
        result.data.reviewId,
        userId.data,
        result.data.comment,
        result.data.replyToId ?? null
      )
      return res.status(201).json({
        success: true,
        message: "Reply created successfully."
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message
        })
      }
      if (error instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          message: error.message
        })
      }
      return next(error)
    }
  }
)

ReplyRouter.put(
  "/:replyId",
  authentificationMiddleware,
  async (
    req: Request<
      { replyId: string },
      {},
      z.infer<typeof replyUpdateSchema>
    >,
    res: Response<{ success: boolean; message: string }>,
    next: NextFunction
  ) => {
    const replyId = idSchema.safeParse(req.params.replyId)
    const userId = idSchema.safeParse(req.user?.id)
    const result = replyUpdateSchema.safeParse(req.body)

    if (!replyId.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid reply ID."
      })
    }
    if (!userId.success) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
    }
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message:
          "A non-empty comment of at most 5000 characters is required."
      })
    }

    try {
      await replyManagementService.updateReply(
        replyId.data,
        userId.data,
        result.data.comment
      )
      return res.status(200).json({
        success: true,
        message: "Reply updated successfully."
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message
        })
      }
      return next(error)
    }
  }
)

ReplyRouter.delete(
  "/:replyId",
  authentificationMiddleware,
  async (
    req: Request<{ replyId: string }>,
    res: Response<{ success: boolean; message: string }>,
    next: NextFunction
  ) => {
    const replyId = idSchema.safeParse(req.params.replyId)
    const userId = idSchema.safeParse(req.user?.id)

    if (!replyId.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid reply ID."
      })
    }
    if (!userId.success) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
    }

    try {
      await replyManagementService.deleteReply(
        replyId.data,
        userId.data
      )
      return res.status(200).json({
        success: true,
        message: "Reply and its nested replies deleted successfully."
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message
        })
      }
      return next(error)
    }
  }
)
