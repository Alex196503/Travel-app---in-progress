import axios from "axios"
import { useEffect, useState } from "react"
import {
  useNavigate,
  useSearchParams,
  type LoaderFunctionArgs
} from "react-router"
import { toast } from "react-toastify"
import { api } from "~/axios/axios"
import { ToastContainer } from "react-toastify"
import { getMeta } from "~/helpers/helpers"
import { requireAuthOnServer } from "~/utils/frontend-utils/auth-guards"

export const meta = () => getMeta("Cancelled payment page")

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuthOnServer(request)
  return null
}

export default function CancelPage() {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get("booking_id")
  const [isLoading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  let navigate = useNavigate()
  useEffect(() => {
    if (!bookingId) return
    const cancelPayment = async () => {
      try {
        let res = await api.patch<{
          success: boolean
          message: string
        }>(`/payments/cancel-booking/${bookingId}`)
        if (res.data.success) {
          toast.success(res.data.message)
        }
      } catch (err) {
        let errorMessage = "Your payment could not be cancelled!"
        if (axios.isAxiosError(err)) {
          errorMessage =
            err.response?.data?.message || "Something bad occured!"
        }
        setErrorMessage(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    setLoading(true)
    // Delay the cancellation request slightly to allow the browser to stabilize and attach cookies after the Stripe redirect.
    const timer = setTimeout(() => cancelPayment(), 500)
    return () => clearTimeout(timer)
  }, [bookingId])
  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">
        {isLoading
          ? "Cancelling payment..."
          : errorMessage.trim() !== ""
            ? errorMessage
            : "Your payment has been cancelled"}
      </h1>
      {!isLoading && errorMessage.trim() === "" && (
        <p className="text-gray-600 mb-6">
          Your checkout session has been cancelled! No money has left
          your credit card account!
        </p>
      )}

      {errorMessage.trim() !== "" && (
        <p className="text-gray-600 mb-6 max-w-md">
          We encountered an issue while processing your request.
          Please try again or contact support.
        </p>
      )}
      <div className="flex gap-4">
        <button
          onClick={() => navigate("/trips")}
          className=" cursor-pointer bg-gray-200 text-gray-800 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Back to trips
        </button>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        closeOnClick={true}
      />
    </section>
  )
}
