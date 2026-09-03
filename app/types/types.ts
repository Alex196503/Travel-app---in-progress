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

export type NotificationItem = {
  id: number
  user_id: number
  trip_id: number | null
  message: string
  type: string
  createdAt: string | Date
  was_read: boolean
}

export interface ThemeContextProps {
  isDark: boolean
  setDark: React.Dispatch<React.SetStateAction<boolean>>
}

export interface ModalContextProps {
  isModalBookingsOpen: boolean
  setModalBookingsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export interface NotificationContextProps {
  notifications: NotificationItem[]
  unreadCount: number
  isOpenNotificationDropdown: boolean
  setNotificationDropdownStatus: React.Dispatch<
    React.SetStateAction<boolean>
  >
  markAsRead: (id: number) => {}
  markAllAsRead: () => void
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
  start_date?: Date | string
  end_date?: Date | string
}

export interface CalendarDay {
  date: Date
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

export interface FormattedBookingForCalendar {
  id: number
  startDate: Date
  title: string
  endDate: Date
}

export interface CreateSessionParams {
  bookingId: number
  userId: number
  totalPrice: number | string
  seatsBooked: number
  tripId: number
  successUrl: string
  cancelUrl: string
  userEmail: string
}

export interface PaymentApiResponse {
  id: number
  user_id: number
  booking_id: number
  stripe_payment_intent_id: string
  amount: number | string
  status: string
  createdAt: string | Date
  updatedAt: string | Date
  booking: UserBookingRow & {
    trip: TripWithImages
  }
}
