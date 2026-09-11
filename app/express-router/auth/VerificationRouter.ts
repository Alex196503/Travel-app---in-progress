import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import express from "express"
import { prisma } from "../../../prisma/prisma"
import type { RegisterResponse } from "~/types/auth-types"
import { VerificationService } from "~/server/auth/VerificationService"
import {
  SHA256TokenCrypto,
  CryptoRandomTokenGenerator
} from "~/server/auth/security-helpers"
import {
  BadRequestError,
  UnauthorizedError
} from "~/server/auth/custom-errors"
import { authentificationMiddleware } from "~/middleware/authMiddleware"
import sendEmailNotification from "~/nodemailer-config"
import { checkCooldown, setCooldown } from "~/utils/node-utils"

let emailVerificationCryptingToken = new SHA256TokenCrypto()
let emailVerificationGenerator = new CryptoRandomTokenGenerator()
let verificationService = new VerificationService(
  prisma,
  emailVerificationCryptingToken,
  emailVerificationGenerator
)
export const VerificationRouter = express.Router()
VerificationRouter.post(
  "/verify-email",
  async (
    req: Request<{}, {}, { token: string }>,
    res: Response<RegisterResponse>,
    next: NextFunction
  ) => {
    try {
      let { token } = req.body
      if (
        !token ||
        typeof token !== "string" ||
        token.trim() === ""
      ) {
        return res.status(400).json({
          message: "Token is required",
          success: false
        })
      }
      let result =
        await verificationService.validateEmailVerification(token)
      return res.status(200).json({
        message: result.message,
        success: result.success
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

VerificationRouter.post(
  "/resend-verification-email",
  authentificationMiddleware,
  async (
    req: Request,
    res: Response<{ success: boolean; message: string }>,
    next: NextFunction
  ) => {
    try {
      const idUser = req.user?.id
      if (!idUser) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" })
      }
      const cooldownTime = 5 * 60 * 1000
      const { isCooldown, remainingMinutes, remainingSeconds } =
        checkCooldown("verification", idUser, cooldownTime)
      if (isCooldown) {
        return res
          .status(429)
          .set("Retry-After", remainingSeconds?.toString())
          .json({
            success: false,
            message: `Too many requests. Please wait about ${remainingMinutes} minutes before trying again.`
          })
      }

      const { email, newVerificationToken } =
        await verificationService.validateEmailResendVerification(
          idUser
        )
      const text = `Hello! Here is your new verification link: ${process.env.VALIDATION_LINK}?token=${newVerificationToken}`
      await sendEmailNotification(
        email,
        "New Email Validation Link",
        text
      )
      setCooldown("verification", idUser, cooldownTime)
      return res.status(200).json({
        success: true,
        message:
          "A new verification link has been sent to your email!"
      })
    } catch (err) {
      if (err instanceof BadRequestError) {
        return res.status(400).json({
          message: err.message,
          success: false
        })
      }
      return next(err)
    }
  }
)
