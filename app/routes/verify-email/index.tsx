import axios from "axios"
import { useEffect } from "react"
import { Link, useLoaderData } from "react-router"
import { api } from "~/axios/axios"
import { useAuth } from "~/custom-hooks/auth-hooks"
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token") || ""
  if (!token) {
    return { success: false, message: "Missing verification token." }
  }
  try {
    await api.post<{
      success: boolean
      message: string
    }>("/auth/verify-email", { token })
    return { success: true, message: "Email verified successfully!" }
  } catch (error) {
    let errorMessage = "An unexpected error occurred"
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    return { success: false, message: errorMessage }
  }
}
export default function VerifyEmail() {
  let { success, message } = useLoaderData<typeof loader>()
  let { user, setUser } = useAuth()
  useEffect(() => {
    if (success && user) {
      setUser({
        ...user,
        isVerified: true
      })
    }
  }, [success])
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 px-4">
      <section className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-center flex flex-col items-center gap-y-5">
        {success ? (
          <>
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl text-emerald-400 animate-bounce">
              ✅
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Email Verified!
            </h1>
            <p className="text-slate-400 text-sm">{message}</p>
            {!user?.isVerified ? (
              <Link
                to="/login"
                className="mt-2 w-full px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold uppercase text-xs tracking-wider rounded-lg shadow-lg active:scale-95 transition-all"
              >
                Go to Login
              </Link>
            ) : (
              <Link
                to="/"
                className="mt-2 w-full px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold uppercase text-xs tracking-wider rounded-lg shadow-lg active:scale-95 transition-all"
              >
                Go to Dashboard / Home
              </Link>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center text-3xl text-rose-400">
              ❌
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Verification Failed
            </h1>
            <p className="text-rose-400 text-sm bg-rose-950/30 border border-rose-900/40 px-3 py-2 rounded-lg w-full">
              {message || "The link is invalid or has expired."}
            </p>
            <Link
              to="/register"
              className="mt-2 w-full px-5 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold uppercase text-xs tracking-wider rounded-lg border border-slate-700 transition-all"
            >
              Go back
            </Link>
          </>
        )}
      </section>
    </main>
  )
}
