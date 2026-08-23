import axios from "axios"
import { useState } from "react"
import { api } from "~/axios/axios"
import type { UserBookingRow } from "~/types/types"
import { ToastContainer } from "react-toastify"
import { toast } from "react-toastify"
import { useCountdown } from "~/custom-hooks/react-hooks"

export const BookingModalCard = ({
  booking
}: {
  booking: UserBookingRow
}) => {
  const [isEditing, setEditing] = useState(false)
  const [seats, setSeats] = useState(booking.seats_booked)
  const maxAllowedSeats =
    booking.seats_booked + Number(booking.available_seats)
  const { countdown, setCountdown, formattedTime, isCounting } =
    useCountdown(0)
  const [isLoading, setLoading] = useState(false)
  const [isCancellingLoading, setLoadingForCancelling] =
    useState(false)
  const updateBooking = async (id: number, seats: number) => {
    try {
      setLoading(true)
      let res = await api.patch<{
        success: boolean
        message: string
      }>("/bookings", { booking_id: id, seats_booked: seats })
      if (res.data.success) {
        setCountdown(300)
        toast.success(res.data.message)
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          "Failed to update booking:",
          error.response?.data?.message || error.message
        )
      } else {
        toast.error(
          `An unexpected error occurred during booking! ${error}`
        )
      }
    } finally {
      setLoading(false)
    }
  }

  async function cancelButton(id: number) {
    try {
      setLoadingForCancelling(true)
      let res = await api.patch<{
        success: boolean
        message: string
      }>("/bookings/cancel", { booking_id: id })
      if (res.data.success) {
        toast.success(
          res.data.message ||
            `Your booking with the id ${id} has been cancelled!`
        )
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          "Failed to update booking:",
          error.response?.data?.message || error.message
        )
      } else {
        toast.error(
          `An unexpected error occurred during booking! ${error}`
        )
      }
    } finally {
      setLoadingForCancelling(false)
    }
  }

  return (
    <article
      key={booking.booking_id}
      className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 transition-all hover:shadow-md"
    >
      <div className="w-full sm:w-28 h-28 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-slate-700">
        {booking.cover_image_url ? (
          <img
            src={booking.cover_image_url}
            alt={booking.trip_title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="flex-1 w-full flex flex-col justify-between gap-2">
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {booking.trip_title}
          </h3>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
              booking.status === "CONFIRMED"
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : booking.status === "PENDING"
                  ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}
          >
            {booking.status}
          </span>
        </section>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
          <section>
            <span className="span-modal-booking">Seats booked: </span>
            {isEditing ? (
              <div className="flex items-center gap-1 max-w-[75px] mt-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/20 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setSeats(Math.max(1, seats - 1))}
                  disabled={seats <= 1}
                  className="px-2 py-0.5 text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                >
                  -
                </button>
                <span className="font-medium px-2 text-xs">
                  {seats}
                </span>
                <button
                  type="button"
                  onClick={() => setSeats(seats + 1)}
                  disabled={seats >= maxAllowedSeats}
                  className="px-2 py-0.5 text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                >
                  +
                </button>
              </div>
            ) : (
              <span className="font-medium">{seats}</span>
            )}
          </section>
          <div>
            <span className="span-modal-booking">Total: </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              €{booking.total_price}
            </span>
          </div>
        </div>

        <section className="text-xs flex justify-between items-center pt-1 border-t border-gray-200/50 dark:border-white/5">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Booked on:{" "}
            {new Date(booking.createdAt).toLocaleDateString()}
          </p>
          <div className="flex items-center gap-2">
            {booking.status === "PENDING" && (
              <>
                {isEditing || isLoading ? (
                  <>
                    <button
                      type="button"
                      disabled={isCounting}
                      style={{ opacity: isCounting ? 0.5 : 1 }}
                      onClick={() => {
                        setEditing(false)
                        if (seats === booking.seats_booked) {
                          toast.info("No modification made!")
                          return
                        }
                        updateBooking(booking.booking_id, seats)
                      }}
                      className="px-3 py-1 font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors cursor-pointer text-xs"
                    >
                      {isCounting
                        ? `Update booking in ${formattedTime}`
                        : "Update"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSeats(booking.seats_booked)
                        setEditing(false)
                      }}
                      className="px-3 py-1 font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 rounded-lg transition-colors cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="px-3 py-1 font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 rounded-lg transition-colors cursor-pointer text-xs"
                      onClick={() => cancelButton(booking.booking_id)}
                    >
                      {isCancellingLoading
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        closeOnClick={true}
      />
    </article>
  )
}
