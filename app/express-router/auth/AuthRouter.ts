import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import crypto from "crypto"
import {
  AuthService,
  JwtTokenService
} from "../../server/auth/AuthService"
import {
  BCryptHasher,
  SHA256TokenCrypto
} from "~/server/auth/security-helpers"
import {
  BadRequestError,
  UnauthorizedError
} from "~/server/auth/custom-errors"
import type { RegisterResponse } from "~/types/auth-types"
import express from "express"
import { prisma } from "../../../prisma/prisma"
import {
  FileValidationSchema,
  LoginSchema,
  RegisterSchema
} from "~/utils/validation/zod-validation"
import { uploadMiddleware } from "~/utils/node-utils"
import sendEmailNotification from "~/nodemailer-config"

export const AuthRouter = express.Router()
const bcryptHasher = new BCryptHasher()
const jwtTokenService = new JwtTokenService()
const EmailVerificationService = new SHA256TokenCrypto()
const authService = new AuthService(
  prisma,
  bcryptHasher,
  jwtTokenService,
  EmailVerificationService
)
AuthRouter.post(
  "/register",
  uploadMiddleware("avatars").single("avatar"),
  async (
    req: Request<
      {},
      {},
      {
        name: string
        email: string
        password: string
        confirmPassword: string
        avatar: File
      }
    >,
    res: Response<RegisterResponse>,
    next: NextFunction
  ) => {
    const { name, email, password, confirmPassword } = req.body || {}
    const emailVerificationToken = crypto
      .randomBytes(64)
      .toString("hex")
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Profile picture is required",
          success: false
        })
      }
      const resultRegister = RegisterSchema.safeParse({
        name,
        email,
        password,
        confirmPassword
      })
      if (!resultRegister.success) {
        return res.status(400).json({
          success: false,
          message: resultRegister.error.format()
        })
      }
      const resultFileAvatar = FileValidationSchema.safeParse(
        req.file
      )
      if (!resultFileAvatar.success) {
        return res.status(400).json({
          success: false,
          message: resultFileAvatar.error.format()
        })
      }
      const avatar = req.file.path
      const newUser = await authService.registerUser(
        name,
        email,
        password,
        avatar as string,
        emailVerificationToken
      )
      res.cookie("refreshToken", newUser.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000
      })
      let text = `Hello! Please click the link to validate your email: ${process.env.VALIDATION_LINK}?token=${emailVerificationToken}`
      await sendEmailNotification(
        newUser.email,
        "Email validation",
        text
      )
      const { refreshToken, ...userWithoutSensitiveData } = newUser
      return res.status(201).json({
        success: true,
        message: "User registered successfully!",
        user: userWithoutSensitiveData
      })
    } catch (err) {
      if (err instanceof BadRequestError) {
        return res.status(401).json({
          message: err.message,
          success: false
        })
      }
      return next(err)
    }
  }
)

AuthRouter.post(
  "/login",
  async (
    req: Request<{}, {}, { email: string; password: string }>,
    res: Response<RegisterResponse & { accessToken?: string }>,
    next: NextFunction
  ) => {
    let { email, password } = req.body || {}

    try {
      const resultLogin = LoginSchema.safeParse(req.body)
      if (!resultLogin.success) {
        return res.status(400).json({
          success: false,
          message: resultLogin.error.format()
        })
      }
      const { user, refreshToken } = await authService.loginUser(
        email,
        password
      )
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000
      })
      return res.status(200).json({
        message: "User logged in successfully!",
        success: true,
        user
      })
    } catch (err) {
      if (err instanceof BadRequestError) {
        return res.status(401).json({
          message: err.message,
          success: false
        })
      }
      return next(err)
    }
  }
)

AuthRouter.post(
  "/logout",
  async (
    req: Request<{}, {}, { id: string }>,
    res: Response<RegisterResponse>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.body
      if (id) {
        await prisma.user.update({
          where: { id: Number(id) },
          data: {
            refresh_token: null,
            refresh_token_expires_at: null
          }
        })
      }
    } catch (err) {
      console.error(`Error while updating our database ${err}`)
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    })
    return res
      .status(200)
      .json({ message: "Logged out!", success: true })
  }
)

AuthRouter.post(
  "/refresh",
  async (
    req: Request,
    res: Response<RegisterResponse & { accessToken?: string }>,
    next: NextFunction
  ) => {
    try {
      const token = req.cookies?.refreshToken as string
      if (!token) {
        return res.status(401).json({
          message: "No refresh token provided",
          success: false
        })
      }
      const result = await authService.refreshToken(token)
      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        accessToken: result.accessToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatar: result.user.avatar as string,
          isVerified: result.user.isVerified
        }
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
