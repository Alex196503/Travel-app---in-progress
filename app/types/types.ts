import type { ZodFormattedError } from "zod"
import type { RegisterSchema } from "~/utils/validation/zod-validation"

export interface RawCountry {
  name: string
  nativeName?: string
  population?: number
  region?: string
  subregion?: string
  capital?: string
  flag: string
  alpha3Code?: string
  topLevelDomain?: string[]
  currencies?: Currency[]
  languages?: { name: string }[]
  borders?: string[]
}

export interface Currency {
  name: string
  symbol: string
}

export interface ThemeContextProps {
  isDark: boolean
  setDark: React.Dispatch<React.SetStateAction<boolean>>
}

export interface ModalContextProps {
  isModalBookingsOpen: boolean
  setModalBookingsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export type InputProps = {
  label: string
  fieldType: string
  placeholder?: string
  minLength?: number
  maxLength?: number
  defaultValue?: string
  existingImageUrl?: string
}

export type InputFile = InputProps & {
  accept: string
}

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

type TripImage = {
  id: number
  trip_id: number
  url: string
  is_cover: boolean
}

type TripCategory =
  "Mountain" | "Beach" | "City Break" | "Adventure" | "Cultural"

export type TripWithImages = {
  id: number
  title: string
  country_code: string
  price: number | string
  total_seats: number
  available_seats: number
  category: TripCategory
  description: string
  start_date: Date
  end_date: Date
  createdAt?: Date
  updatedAt?: Date
  images: TripImage[]
}

export type TripsResponse = TripWithImages[]

export interface UserBookingRow {
  booking_id: number
  seats_booked: number
  total_price: number | string
  status: string
  createdAt: Date
  trip_id: number
  trip_title: string
  trip_price: number | string
  available_seats?: number | string
  cover_image_url: string | null
}
