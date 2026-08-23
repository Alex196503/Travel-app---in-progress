import { toast } from "react-toastify"
import {
  bookingTripFetcher,
  sanitizeSeatsValue
} from "~/utils/frontend-utils"

export const BookingConfirmationModal = ({
  setModalOpen,
  available_seats,
  currentNumberOfSeats,
  price,
  setCurrentNumberOfSeats,
  id
}: {
  setModalOpen: (value: React.SetStateAction<boolean>) => void
  available_seats: number
  currentNumberOfSeats: number
  setCurrentNumberOfSeats: React.Dispatch<
    React.SetStateAction<number>
  >
  price: number | string
  id: number
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          onClick={() => setModalOpen(false)}
          className="absolute right-4 cursor-pointer top-4 text-gray-400 hover:text-gray-600 text-xl font-semibold"
        >
          X
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Confirm your reservation
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Choose the number of seats wanted for this trip
        </p>
        <div className="space-y-4">
          <article className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {available_seats} available seats
            </span>
            <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => {
                  if (currentNumberOfSeats <= 1) return
                  setCurrentNumberOfSeats(currentNumberOfSeats - 1)
                }}
                className="bg-gray-50 px-3 py-1.5 cursor-pointer text-gray-600 hover:bg-gray-100 font-bold transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={currentNumberOfSeats}
                onChange={(e) => {
                  let sanitizedValue = sanitizeSeatsValue(
                    e.target.value,
                    available_seats
                  )
                  setCurrentNumberOfSeats(Number(sanitizedValue))
                }}
                className="w-12 text-center text-sm font-medium text-gray-800 focus:outline-none"
              />
              <button
                onClick={() => {
                  if (
                    currentNumberOfSeats >=
                    Math.min(available_seats, 10)
                  )
                    return
                  setCurrentNumberOfSeats(currentNumberOfSeats + 1)
                }}
                className="bg-gray-50 px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </article>
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-semibold text-gray-900">
            <span>Amount due</span>
            <span className="text-lg font-bold text-blue-600">
              {Number(price) * currentNumberOfSeats} €
            </span>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setModalOpen(false)}
            className="flex-1 cursor-pointer rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              const result = await bookingTripFetcher(
                id.toString(),
                currentNumberOfSeats
              )
              if (result.success) {
                toast.success(result.message)
                setModalOpen(false)
              } else {
                toast.error(result.message)
                setModalOpen(false)
              }
            }}
            className="flex-1 cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Confirm now
          </button>
        </div>
      </div>
    </div>
  )
}
