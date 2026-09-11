import axios from "axios"
import { useEffect, useState } from "react"
import { api } from "~/axios/axios"
import type { UserBookingRow } from "~/types/feature-types"

// Custom hook to fetch and manage the current user's bookings. Automatically triggers when the associated modal/drawer opens.
export const useUserBookings = (isOpen: boolean) => {
  const [bookings, setBookings] = useState<UserBookingRow[]>([])
  const updateBookingStatus = (id: number, newStatus: string) => {
    setBookings((prev) => {
      if (!prev) return []
      const updated = prev?.map((booking) =>
        Number(booking.booking_id) === id
          ? { ...booking, status: newStatus }
          : booking
      )
      return updated
    })
  }
  const [bookingsCounter, setBookingsCounter] = useState(0)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!isOpen) return
    const bringBookings = async () => {
      try {
        setLoading(true)
        setError(null)
        let res = await api.get<{
          bookings: UserBookingRow[]
          success: boolean
          count: number
        }>("/bookings")
        if (res.data.success) {
          setBookings(res.data.bookings)
          setBookingsCounter(res.data.count)
        }
      } catch (err) {
        let errorMessage =
          "An unexpected error occurred while fetching bookings"
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || err.message
        }
        setError(errorMessage)
        console.error("Fetching bookings failed:", errorMessage)
      } finally {
        setLoading(false)
      }
    }
    bringBookings()
  }, [isOpen])
  return {
    bookings,
    bookingsCounter,
    updateBookingStatus,
    isLoading,
    error
  }
}
