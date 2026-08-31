import axios from "axios"
import { useState } from "react"
import { redirect } from "react-router"
import { api } from "~/axios/axios"

export default function StripePaymentButton({
  bookingId
}: {
  bookingId: number
}) {
  const [loading, setLoading] = useState(false)
  const handleCheckout = async () => {
    try {
      setLoading(true)
      const response = await api.post<{
        success: boolean
        message?: string
        url: string
      }>("/payments/create-checkout-session", {
        booking_id: bookingId
      })
      if (response.data.success && response.data.url) {
        window.location.href = response.data.url
      }
    } catch (error) {
      let errorMessage =
        "An unexpected error occurred while fetching bookings"
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message
      }
      console.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  return (
    <button
      onClick={handleCheckout}
      className="inline-flex items-center w-full justify-center gap-2.5 bg-gradient-to-br from-[#635bff] to-[#4f46e5] text-white font-semibold text-base px-2 py-1.5 rounded-lg shadow-[0_4px_12px_rgba(99,91,255,0.25)] hover:from-[#4f46e5] hover:to-[#4338ca] hover:shadow-[0_6px_16px_rgba(99,91,255,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_8px_rgba(99,91,255,0.2)] transition-all duration-200 cursor-pointer"
    >
      <svg
        className="opacity-85 hover:opacity-100 transition-opacity"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect
          x="3"
          y="11"
          width="18"
          height="11"
          rx="2"
          ry="2"
        ></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <span>{loading ? "Processing..." : "Pay now!"}</span>
    </button>
  )
}
