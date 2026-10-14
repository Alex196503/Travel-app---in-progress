import { type PrismaClient } from "../../../generated/prisma/client"
import jwt, { type SignOptions } from "jsonwebtoken"
import process from "process"
import crypto from "crypto"
import { BadRequestError, UnauthorizedError } from "./custom-errors"
import type { PasswordHasher, TokenCrypto } from "./security-helpers"

//Interface for generating access and refresh tokens
export interface TokenService {
  generateToken(
    userId: string,
    expiresIn: SignOptions["expiresIn"]
  ): string
  verifyToken(token: string): { id: string }
}

//Class useful for generating the token using jwt library
export class JwtTokenService implements TokenService {
  generateToken(userId: string, expiresIn: SignOptions["expiresIn"]) {
    return jwt.sign(
      { id: userId },
      process.env.SECRET_KEY || "secret_key",
      {
        expiresIn,
        algorithm: "HS256"
      }
    )
  }
  verifyToken(token: string): { id: string } {
    return jwt.verify(
      token,
      process.env.SECRET_KEY || "secret_key"
    ) as { id: string }
  }
}

// AuthService class for handling user registration and authentication
export class AuthService {
  private prisma: PrismaClient
  private hasher: PasswordHasher
  private tokenService: TokenService
  private emailVerificationCrypting: TokenCrypto
  constructor(
    prisma: PrismaClient,
    hasher: PasswordHasher,
    tokenService: TokenService,
    emailVerificationCrypting: TokenCrypto
  ) {
    this.prisma = prisma
    this.hasher = hasher
    this.tokenService = tokenService
    this.emailVerificationCrypting = emailVerificationCrypting
  }
  registerUser = async (
    name: string,
    email: string,
    password: string,
    avatar: string,
    emailVerificationToken: string
  ) => {
    let existingUser = await this.prisma.user.findUnique({
      where: { email }
    })
    if (existingUser) {
      throw new BadRequestError("User already exists")
    }
    const saltedPassword = await this.hasher.hash(password)
    let hashedVerifToken = this.emailVerificationCrypting.hashToken(
      emailVerificationToken
    )

    const newUser = await this.prisma.user.create({
      data: {
        name,
        email,
        password: saltedPassword,
        avatar_url: avatar,
        email_verification_token: hashedVerifToken,
        email_verification_token_expires_at: new Date(
          Date.now() + 90 * 60 * 1000
        )
      }
    })
    let accessToken = this.tokenService.generateToken(
      newUser.id.toString(),
      "15m"
    )
    let refreshToken = this.tokenService.generateToken(
      newUser.id.toString(),
      "30d"
    )
    const refreshTokenHashed = await this.hasher.hash(refreshToken)
    await this.prisma.user.update({
      where: { id: newUser.id },
      data: {
        refresh_token: refreshTokenHashed,
        refresh_token_expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        )
      }
    })
    return {
      name: newUser.name,
      email: newUser.email,
      accessToken,
      refreshToken
    }
  }

  loginUser = async (email: string, password: string) => {
    const userFound = await this.prisma.user.findUnique({
      where: { email },
      select: {
        password: true,
        name: true,
        email: true,
        id: true
      }
    })
    if (!userFound) {
      throw new BadRequestError("Invalid email or password!")
    }
    const result1 = await this.hasher.compare(
      password,
      userFound?.password as string
    )
    if (!result1) {
      throw new BadRequestError("Invalid email or password!")
    }
    let accessToken = this.tokenService.generateToken(
      userFound?.id.toString(),
      "15m"
    )
    let refreshToken = this.tokenService.generateToken(
      userFound.id.toString(),
      "30d"
    )
    const refreshTokenHashed = await this.hasher.hash(refreshToken)
    await this.prisma.user.update({
      where: { id: userFound.id },
      data: {
        refresh_token: refreshTokenHashed,
        refresh_token_expires_at: new Date(
          Date.now() + +30 * 24 * 60 * 60 * 1000
        )
      }
    })
    return {
      user: {
        id: userFound.id,
        email: userFound.email,
        name: userFound.name,
        accessToken
      },
      refreshToken
    }
  }

  refreshToken = async (token: string) => {
    const decoded = this.tokenService.verifyToken(token)
    const user = await this.prisma.user.findUnique({
      where: { id: Number(decoded.id) },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        is_verified: true,
        refresh_token: true
      }
    })
    if (!user || !user.refresh_token) {
      throw new UnauthorizedError("Invalid refresh token")
    }
    const isRefreshTokenValid = await this.hasher.compare(
      token,
      user.refresh_token
    )
    if (!isRefreshTokenValid) {
      throw new UnauthorizedError("Invalid refresh token")
    }
    const newAccessToken = this.tokenService.generateToken(
      user.id.toString(),
      "15m"
    )
    return {
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        isVerified: user.is_verified
      }
    }
  }
}
