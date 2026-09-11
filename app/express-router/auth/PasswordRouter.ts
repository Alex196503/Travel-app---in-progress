import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import express from "express"
import { prisma } from "../../../prisma/prisma"
import sendEmailNotification from "~/nodemailer-config"
import type { RegisterResponse } from "~/types/auth-types"
import { ResetPasswordSchema } from "~/utils/validation/zod-validation"
import {
  BCryptHasher,
  CryptoRandomTokenGenerator,
  SHA256TokenCrypto
} from "~/server/auth/security-helpers"
import { checkCooldown, setCooldown } from "~/utils/node-utils"
import { PasswordService } from "~/server/auth/PasswordService"
import { BadRequestError } from "~/server/auth/custom-errors"
export const PasswordRouter = express.Router()
let passwordResetCryptingToken = new SHA256TokenCrypto()
let passwordResetGeneratingToken = new CryptoRandomTokenGenerator()
let passwordHasher = new BCryptHasher()
const passwordService = new PasswordService(
  prisma,
  passwordResetCryptingToken,
  passwordResetGeneratingToken,
  passwordHasher
)

PasswordRouter.post(
  "/forgot-password",
  async (
    req: Request<{}, {}, { email: string }>,
    res: Response<RegisterResponse>,
    next: NextFunction
  ) => {
    let { email } = req.body
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Empty field! You must introduce your email!"
      })
    }
    const cooldownTime = 5 * 60 * 1000
    const normalizedEmail = email.trim().toLowerCase()
    const { isCooldown, remainingMinutes, remainingSeconds } =
      checkCooldown("passwordReset", normalizedEmail, cooldownTime)
    if (isCooldown) {
      return res
        .status(429)
        .set("Retry-After", remainingSeconds?.toString())
        .json({
          success: false,
          message: `Too many requests. Please wait about ${remainingMinutes} minutes before trying again.`
        })
    }
    try {
      let result = await passwordService.forgotPassword(email)
      if (result) {
        const resetLink = process.env.RESET_LINK || ""
        const text = `Hello! You requested a password reset. Use this link to reset your password: ${resetLink}?token=${result.passwordResetToken}`
        await sendEmailNotification(
          result.emailFound,
          "Password Reset",
          text
        )
      }
      setCooldown("passwordReset", email, cooldownTime)
      return res.status(200).json({
        success: true,
        message:
          "If an account with this email exists, a reset link has been sent!"
      })
    } catch (err) {
      return next(err)
    }
  }
)

PasswordRouter.post(
  "/reset-password",
  async (
    req: Request<
      {},
      {},
      { password: string; confirmPassword: string; token: string }
    >,
    res: Response<{
      success: boolean
      message: string
      errors?: {
        password: string | undefined
        confirmPassword: string | undefined
      }
    }>,
    next: NextFunction
  ) => {
    try {
      let { password, confirmPassword, token } = req.body
      let passwordObject = { password, confirmPassword }
      const result = ResetPasswordSchema.safeParse(passwordObject)
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: {
            password: fieldErrors.password?.[0],
            confirmPassword: fieldErrors.confirmPassword?.[0]
          }
        })
      }
      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Reset token is required"
        })
      }
      await passwordService.resetPassword(token, password)
      return res.status(200).json({
        success: true,
        message:
          "Password updated successfully! You can now log in with your new credentials."
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
