import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import { prisma } from "../../prisma/prisma"
import express from "express"
import { authentificationMiddleware } from "~/middleware/authMiddleware"
import type { ProfileRouteResponse } from "~/types/auth-types"
import {
  EditProfileSchema,
  FileValidationSchema
} from "~/utils/validation/zod-validation"
import { uploadMiddleware } from "~/utils/node-utils"
import { ProfileService } from "~/server/ProfileService"
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError
} from "~/server/auth/custom-errors"
import { BCryptHasher } from "~/server/auth/security-helpers"
import { ReplyManagementService } from "~/server/reviews/ReplyManagementService"
import {
  idSchema,
  replySchema,
  replyUpdateSchema
} from "~/utils/validation/zod-validation"
import type z from "zod"
export const ProfileRouter = express.Router()
let bcryptHasher = new BCryptHasher()
let profileService = new ProfileService(prisma, bcryptHasher)
const replyManagementService = new ReplyManagementService(prisma)

type ReplyResponseNode = {
  id: number
  comment: string
  createdAt: Date
  user: { id: number; name: string }
  replies: ReplyResponseNode[]
}

ProfileRouter.get(
  "/reply/trips/:tripId/reviews/:reviewId",
  authentificationMiddleware,
  async (
    req: Request<{ tripId: string; reviewId: string }>,
    res: Response<{
      success: boolean
      message?: string
      replies?: ReplyResponseNode[]
    }>,
    next: NextFunction
  ) => {
    const tripId = idSchema.safeParse(req.params.tripId)
    const reviewId = idSchema.safeParse(req.params.reviewId)

    if (!tripId.success || !reviewId.success) {
      return res.status(400).json({
        success: false,
        message: "Valid trip and review IDs are required."
      })
    }

    try {
      const replies =
        await replyManagementService.getRepliesForReview(
          tripId.data,
          reviewId.data
        )
      return res.status(200).json({
        success: true,
        replies
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

ProfileRouter.get(
  "/",
  authentificationMiddleware,
  async (
    req: Request,
    res: Response<ProfileRouteResponse>,
    next: NextFunction
  ) => {
    try {
      let userId = Number(req.user?.id)
      let existingUserData = await profileService.findUserInfo(userId)
      return res.status(200).json({
        user: existingUserData,
        message:
          "If a user was found, the data was sent to the client!",
        success: true
      })
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return res.status(401).json({
          message: err.message,
          success: false
        })
      }
      return next(err)
    }
  }
)

ProfileRouter.patch(
  "/update",
  authentificationMiddleware,
  uploadMiddleware("avatars").single("avatar"),
  async (
    req: Request<
      {},
      {},
      {
        username?: string
        email?: string
        password?: string
        avatar?: string
      }
    >,
    res: Response,
    next: NextFunction
  ) => {
    let userId = req?.user?.id
    const avatarFile = req?.file ? req.file.path : undefined
    const { username, email, password } = req.body
    const resultEditProfile = EditProfileSchema.safeParse({
      username,
      email,
      password
    })
    const resultEditImage = FileValidationSchema.safeParse(req?.file)
    if (!resultEditProfile.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: resultEditProfile.error.flatten().fieldErrors
      })
    }
    if (!resultEditImage.success && req.file) {
      return res.status(400).json({
        success: false,
        message: "Invalid image",
        errors: resultEditImage.error.flatten().fieldErrors
      })
    }
    try {
      if (req.aborted || req.socket.destroyed) {
        console.log(
          "Request cancelled by client, no longer saving into DB!"
        )
        return res
          .status(499)
          .json({ message: "Request cancelled by client" })
      }
      let userFound = await prisma.user.findUnique({
        where: { id: Number(userId) }
      })
      if (!userFound) {
        return res.status(401).json({
          success: false,
          message: "Invalid request!"
        })
      }
      let updatedUser = await profileService.updateProfile(
        userId as string,
        {
          username,
          email,
          password,
          avatarFile
        }
      )
      return res.status(200).json({
        message: "Profile updated successfully!",
        success: true,
        user: updatedUser
      })
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return res.status(401).json({
          message: err.message,
          success: false
        })
      }
      return next(err)
    }
  }
)
