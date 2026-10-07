import type { TripWithImages } from "./trip-types"

export type NotificationItem = {
  id: number
  user_id: number
  trip_id: number | null
  message: string
  type: string
  createdAt: string | Date
  was_read: boolean
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

export type ReviewsResponse = {
  success: boolean
  message?: string
  reviews: Array<{
    id: number
    rating: number
    comment: string
    created_at: string | Date
    user: {
      id: number
      name: string
      avatar_url: string | null
    }
  }>
  averageRating?: number | null
}

export type ReviewApiResponse = {
  success: boolean
  message: string
}

export interface Review {
  id: number
  userId: number
  name: string
  date: string
  rating: number
  comment: string
  replies?: ReviewReply[]
}

export interface ReviewReply {
  id: number
  userId: number
  name: string
  date: string
  comment: string
  replies?: ReviewReply[]
}
