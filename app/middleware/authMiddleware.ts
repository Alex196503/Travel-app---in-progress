import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import "dotenv/config"
import { JwtTokenService } from "../server/auth/AuthService"
import type { RegisterResponse } from "~/types/auth-types"
let tokenService = new JwtTokenService()

// Middleware to protect private routes. It extracts the JWT from the secure cookie, verifies it, and attaches the payload to req.user before moving to the next handler.
export const authentificationMiddleware = (
  req: Request,
  res: Response<RegisterResponse>,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization as string
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    })
  }
  const token = authHeader.split(" ")[1]
  try {
    const decoded = tokenService.verifyToken(token)
    req.user = { id: decoded.id }
    return next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    })
  }
}
