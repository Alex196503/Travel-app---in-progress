import axios from "axios"
import { type ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { api } from "~/axios/axios"
import {
  useModalBooking,
  useNotifications
} from "~/custom-hooks/context-hooks"
import { useAuth } from "~/custom-hooks/auth-hooks"
import NotificationDropdown from "~/routes/home/local_components/NotificationDropdown"

export default function ApiNav({
  navTitle,
  children,
  bgColor,
  isDark,
  setDark,
  user
}: {
  navTitle: string
  children: ReactNode
  isDark: boolean
  bgColor: string
  setDark: React.Dispatch<React.SetStateAction<boolean>>
  user?:
    | {
        id?: number | undefined
        name?: string | undefined
        avatar?: string | undefined
      }
    | null
    | undefined
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    unreadCount,
    setNotificationDropdownStatus,
    isOpenNotificationDropdown
  } = useNotifications()
  const { setModalBookingsOpen, isModalBookingsOpen } =
    useModalBooking()
  const isCountriesApiPage = location.pathname === "/countries"
  const isOnTripsPage = location.pathname.startsWith("/trips")
  const { setUser, setAccessToken } = useAuth()
  const logOutUser = async () => {
    try {
      let res = await api.post<{ success: boolean; message: string }>(
        "/auth/logout",
        { id: user?.id },
        { withCredentials: true }
      )
      if (res.data.success) {
        setUser(null)
        setAccessToken("")
        return navigate("/login")
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Logout failed from server:",
          error.response?.data?.message || error.message
        )
      } else {
        console.error(
          "An unexpected error occurred during logout",
          error
        )
      }
      setUser(null)
      setAccessToken("")
      navigate("/login")
    }
  }
  return (
    <>
      <nav className="w-full flex flex-col md:flex-row justify-between items-center gap-4 px-6 md:px-16 py-4 bg-white dark:bg-brand-blue-900 transition-colors border-b border-brand-grey-400/20 dark:border-white/10">
        <h3 className="text-2xl font-bold py-2 md:py-5">
          {navTitle}
        </h3>
        <Link
          to={isCountriesApiPage ? "/trips" : "countries"}
          className="text-sm md:text-base font-medium text-blue-600 hover:underline hover:text-blue-900 flex items-center gap-1 group"
        >
          <span>
            {isCountriesApiPage
              ? "View our offer for you traveller"
              : "View information about countries in our API"}
          </span>
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-brand-grey-400/10 dark:border-white/10">
          {user && isOnTripsPage && (
            <button
              onClick={() => {
                setModalBookingsOpen((prev) => !prev)
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-[0.98]"
            >
              <span>🛒 My Bookings</span>
            </button>
          )}
          {user && !isCountriesApiPage && (
            <section className="relative">
              <button
                onClick={() =>
                  setNotificationDropdownStatus((prev) => !prev)
                }
                className="relative p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                title="Notifications"
              >
                <span className="text-base">✉️</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              </button>
              {isOpenNotificationDropdown && <NotificationDropdown />}
            </section>
          )}
          <div
            className={`w-full sm:w-auto grid grid-cols-2 gap-2 ${isOpenNotificationDropdown ? "pointer-events-none opacity-60" : ""}`}
          >
            {" "}
            {user ? (
              <section className="w-full sm:w-auto flex items-center gap-3">
                <a
                  href="/edit-profile"
                  className="flex-col md:flex-row flex items-center gap-3 px-2 py-1.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                >
                  <img
                    src={user?.avatar}
                    alt={`Image with the user: ${user?.name}`}
                    className="w-7 h-7 rounded-full object-cover border border-indigo-500"
                  />
                  <span className="text-sm font-medium text-white">
                    {user.name || "Alex"}
                  </span>
                </a>
                <button
                  onClick={logOutUser}
                  className="flex cursor-pointer items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-[0.98]"
                >
                  <span>Logout</span>
                </button>
              </section>
            ) : (
              <div className="w-full sm:w-auto grid grid-cols-2 gap-2">
                <a
                  href="/login"
                  className={`text-center text-sm font-medium px-4 py-2.5 rounded-xl transition-colors ${
                    isDark
                      ? "text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="text-center text-sm font-medium px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  Register
                </a>
              </div>
            )}
          </div>
          <section
            className={`w-full sm:w-auto flex items-center justify-center gap-x-3 py-2 sm:py-0 select-none ${
              isOpenNotificationDropdown
                ? "cursor-not-allowed opacity-60 pointer-events-none"
                : "cursor-pointer"
            }`}
            onClick={() => setDark(!isDark)}
          >
            {children}
            <h3 className="text-base sm:text-[10px] font-medium">
              {bgColor} Mode
            </h3>
          </section>
        </div>
      </nav>
    </>
  )
}
