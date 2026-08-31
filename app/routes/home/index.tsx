import { useAuth, useCountdown } from "~/custom-hooks/react-hooks"
import { getMeta } from "~/helpers/helpers"
import { useLoaderData, type LoaderFunctionArgs } from "react-router"
import { requireAuthOnServer } from "~/utils/frontend-utils"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import { api } from "~/axios/axios"
import { useState } from "react"
import { CalendarContainer } from "./local_components/CalendarContainer"
import { type UserBookingRow } from "~/types/types"
export const meta = () => getMeta("Home")

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuthOnServer(request)

  try {
    const cookieHeader = request.headers.get("cookie")
    const res = await api.get<{ bookings: UserBookingRow[] }>(
      "/bookings/",
      {
        headers: {
          cookie: cookieHeader || ""
        }
      }
    )
    return { bookingsApiResponse: res.data.bookings }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500
      const message =
        error.response?.data?.message || "Failed to fetch bookings"
      throw new Response(message, { status })
    }

    throw new Response("An unexpected error occurred", {
      status: 500
    })
  }
}

export default function Home() {
  let bookings = useLoaderData<typeof loader>().bookingsApiResponse
  const [isLoading, setLoading] = useState(false)
  const { countdown, setCountdown, formattedTime, isCounting } =
    useCountdown(0)
  const filteredBookings = bookings.filter(
    (booking) => booking.status !== "CANCELLED"
  )
  const handleResendVerification = async () => {
    setLoading(true)
    try {
      let response = await api.post<{
        success: boolean
        message: string
      }>("/auth/resend-verification-email")
      if (response.data.success) {
        setCountdown(300)
        toast.success(
          response.data.message ||
            "Verification email sent! Check your inbox."
        )
      }
    } catch (error) {
      let errorMessage = "An unexpected error occurred"
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  const { user } = useAuth()
  return (
    <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome to VoyageFlow
          </h1>
          <p className="text-sm text-slate-400">
            Manage your routes, authenticate securely, and explore the
            world.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/trips"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
          >
            View trips
          </a>
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col items-center text-center gap-4 shadow-xl">
          <div className="relative">
            <img
              src={user?.avatar}
              alt="User profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/50 shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">
              {user?.name}
            </h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{user?.name}</h1>
            {user?.isVerified ? (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Verified ✓
              </span>
            ) : (
              <span className="bg-red-700 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {" "}
                Not verified X{" "}
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full">
            Active Explorer
          </span>
          <div className="w-full flex flex-col gap-2 mt-2">
            <a
              href="/edit-profile"
              className="w-full cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs py-2.5 px-4 rounded-xl transition-colors border border-slate-700/50"
            >
              Edit profile
            </a>

            {!user?.isVerified && (
              <button
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs py-2.5 px-4 rounded-xl transition-colors border border-amber-500/50 cursor-pointer disabled:cursor-not-allowed"
                disabled={isCounting || isLoading}
                style={{ opacity: isCounting ? 0.5 : 1 }}
                onClick={handleResendVerification}
              >
                {isLoading
                  ? "Sending..."
                  : isCounting
                    ? `Resend email in ${formattedTime}`
                    : "Resend Verification Email"}
              </button>
            )}
          </div>
        </div>
        <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white">
              Your Next Adventures
            </h3>
          </div>
          <CalendarContainer bookings={filteredBookings} />
        </div>
      </section>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        closeOnClick={true}
      />
    </main>
  )
}
