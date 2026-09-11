import type { ZodFormattedError } from "zod"
import type { RegisterSchema } from "~/utils/validation/zod-validation"

export interface UserRegisterProps {
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
  success: boolean
  message: string | ZodFormattedError<typeof RegisterSchema>
  accessToken?: string
  user?: {
    id?: number | undefined
    name: string
    email: string
    avatar?: string
    isVerified?: boolean
  }
}

export interface AuthenticatedUser {
  id: string
}

export interface AuthContextProps {
  accessToken: string | null
  setAccessToken: (token: string) => void
  user?: {
    id?: number
    name?: string
    avatar?: string
    email: string
    isVerified?: boolean
  } | null
  setUser: (user: AuthContextProps["user"]) => void
}

export type ExpressErrorResponse = {
  success?: boolean
  message?: string
  errors?: {
    password?: string
    confirmPassword?: string
  }
}

export type ProfileRouteResponse = {
  success: boolean
  message: string
  user?: {
    name: string
    email: string
    avatar: string
  }
  errors?: {
    username?: string[]
    email?: string[]
    password?: string[]
  }
}

export type UpdateProfileInput = {
  username?: string
  email?: string
  password?: string
  avatarFile?: string
}
