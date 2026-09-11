import axios from "axios"
import { useEffect, useState } from "react"
import {
  useNavigate,
  useSearchParams,
  type LoaderFunctionArgs
} from "react-router"
import { api } from "~/axios/axios"
import { getMeta } from "~/helpers/helpers"
import type { PaymentApiResponse } from "~/types/feature-types"
import { requireAuthOnServer } from "~/utils/frontend-utils/auth-guards"

export const meta = () => getMeta("Success payment page")

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuthOnServer(request)
  return null
}

export default function SuccessPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentResponse, setPaymentResponse] =
    useState<PaymentApiResponse | null>(null)
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get("booking_id")
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!bookingId) return
    const fetchPaymentDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.get<{
          success: boolean
          message: string
          paymentApiResponse: PaymentApiResponse
        }>(`/payments/payment-details/${bookingId}`)
        setPaymentResponse(response.data.paymentApiResponse)
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError(
            error?.response?.data?.message ||
              "Something bad occured while fetching the payment details!"
          )
        }
        setError(error as string)
      } finally {
        setIsLoading(false)
      }
    }

    // Delay the cancellation request slightly to allow the browser to stabilize and attach cookies after the Stripe redirect.
    const timer = setTimeout(() => fetchPaymentDetails(), 500)
    return () => clearTimeout(timer)
  }, [bookingId])
  const navigate = useNavigate()
  return (
    <section className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl text-center border border-gray-100">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
        ✓
      </div>
      {!error && (
        <section className="flex flex-col gap-y-3 mb-3">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Payment succeded
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Thank you for your reservation!
          </p>
        </section>
      )}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500 font-medium">
            Details loading...
          </span>
        </div>
      )}
      {!isLoading && !error && paymentResponse && (
        <section className="space-y-6">
          <article className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="payment-table-row">
                  <td className="payment-table-cell">
                    Reservation ID
                  </td>
                  <td className="payment-table-cell">
                    #{paymentResponse.booking_id}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="payment-table-cell">
                    Total amount paid
                  </td>
                  <td className="payment-table-cell">
                    {paymentResponse.amount} €
                  </td>
                </tr>
                <tr className="payment-table-row">
                  <td className="payment-table-cell">
                    Payment status
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2.5 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">
                      {paymentResponse.status}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="payment-table-cell">Seats booked</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                    {paymentResponse.booking.seats_booked}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="payment-table-cell">
                    ID Payment Intent
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-gray-600 text-right truncate max-w-[200px]">
                    {paymentResponse.stripe_payment_intent_id}
                  </td>
                </tr>
              </tbody>
            </table>
          </article>
        </section>
      )}
      <section className="flex gap-4 py-3 justify-center">
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition cursor-pointer"
        >
          Go back to home page
        </button>
      </section>
    </section>
  )
}
