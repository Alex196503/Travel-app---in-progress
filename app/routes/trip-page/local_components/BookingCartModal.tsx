import { type UserBookingRow } from "~/types/types"
import { BookingModalCard } from "./BookingModalCard"
import { useState } from "react"

export default function BookingCartModal({
  setModalBookingsOpen,
  bookings,
  isLoading,
  bookingCounter,
  updateBookingStatus
}: {
  setModalBookingsOpen: React.Dispatch<React.SetStateAction<boolean>>
  bookings: UserBookingRow[] | undefined
  isLoading: boolean
  bookingCounter: number
  updateBookingStatus: (id: number, newStatus: string) => void
}) {
  const [statusFilter, setStatusFilter] = useState("ALL")
  let selectOptions = [
    { label: "All Statuses", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Cancelled", value: "CANCELLED" }
  ]
  const filteredBookings = bookings?.filter((booking) => {
    if (statusFilter === "ALL") return true
    return booking.status === statusFilter
  })
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
        <section className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-brand-blue-900 p-6 shadow-2xl border border-gray-100 dark:border-white/10 max-h-[90vh] flex flex-col">
          <section className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                My Bookings Cart
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your {bookingCounter} trip reservations and
                complete payments
              </p>
            </div>
            <section className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {selectOptions.map((option) => {
                  return (
                    <option value={option.value} key={option.label}>
                      {option.label}
                    </option>
                  )
                })}
              </select>
              <button
                onClick={() => setModalBookingsOpen(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-semibold p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </section>
          </section>
          <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading your bookings...
              </div>
            ) : bookings?.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                You have no bookings yet.
              </div>
            ) : (
              filteredBookings?.map((booking) => (
                <BookingModalCard
                  key={booking.booking_id}
                  booking={booking}
                  updateBookingStatus={updateBookingStatus}
                />
              ))
            )}
          </div>

          <section className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
            <button
              onClick={() => setModalBookingsOpen(false)}
              className="cursor-pointer rounded-xl bg-gray-100 dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </section>
        </section>
      </div>
    </>
  )
}
