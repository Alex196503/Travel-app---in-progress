import axios from "axios"
import { api } from "~/axios/axios"

export type Booking = {
  id: number
  user_id: number
  trip_id: number
  total_price: number
  seats_booked: number
  status: "PENDING" | "CONFIRMED" | "CANCELLED"
  createdAt: string
}

//Handler function that sanitizes the seats value introduced by the user in the number input
export const sanitizeSeatsValue = (
  value: string,
  available_seats: number
) => {
  if (!value) return "1"
  const numericOnly = value.replace(/[^0-9]/g, "")
  if (!numericOnly) return "1"
  const num = Number(numericOnly)
  const MIN_SEATS = 1
  const MAX_ALLOWED_SEATS = Math.min(available_seats, 10)
  if (num < MIN_SEATS) return MIN_SEATS.toString()
  if (num >= MAX_ALLOWED_SEATS) return MAX_ALLOWED_SEATS.toString()
  return num.toString()
}

//Function that sends the request to the server after the user books the trip
export const bookingTripFetcher = async (
  tripId: string,
  seats: number = 1
) => {
  try {
    let res = await api.post<{
      bookingCreated: Booking
      success: boolean
      message: string
    }>("/bookings", {
      trip_id: tripId,
      seats_booked: seats
    })
    return {
      success: true,
      message: "Booking succesfully created!",
      data: res.data.bookingCreated
    }
  } catch (error) {
    let errorMessage = "An unexpected error occurred"
    if (axios.isAxiosError(error)) {
      errorMessage = error?.response?.data?.message || error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    return { success: false, message: errorMessage }
  }
}
