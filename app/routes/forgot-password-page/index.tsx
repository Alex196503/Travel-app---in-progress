import {
  data,
  Form,
  useActionData,
  useNavigation,
  type LoaderFunctionArgs
} from "react-router"
import { TextInput } from "../register/local_components/InputText"
import { toast, ToastContainer } from "react-toastify"
import type { Route } from "./+types"
import { api } from "~/axios/axios"
import axios from "axios"
import { useEffect } from "react"
import { useCountdown } from "~/custom-hooks/utility-hooks"
import { redirectIfAuthenticated } from "~/utils/frontend-utils/auth-guards"

export async function loader({ request }: LoaderFunctionArgs) {
  return redirectIfAuthenticated(request) || null
}
export async function action({ request }: Route.ActionArgs) {
  try {
    let formData = await request.formData()
    let emailSent = formData.get("email")
    const result = await api.post<{
      success: boolean
      message: string
    }>("/auth/forgot-password", {
      email: emailSent
    })
    if (result.data.success) {
      return data({
        success: true,
        message:
          result.data.message ||
          "Reset password mail sent to your email!"
      })
    }
  } catch (error) {
    let errorMessage = "An unexpected error occurred"
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    return data({ success: false, message: errorMessage })
  }
}

export default function ForgotPasswordPage() {
  let navigate = useNavigation()
  let actionData = useActionData<typeof action>()
  const { countdown, setCountdown, formattedTime, isCounting } =
    useCountdown(0)
  useEffect(() => {
    if (!actionData) return
    if (actionData.success) {
      setCountdown(300)
      toast.success(actionData.message)
    } else {
      toast.error(actionData.message)
    }
  }, [actionData])
  let isLoading = navigate.state === "submitting"

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md space-y-3 bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl text-white">
        <h3 className="text-xl font-semibold tracking-tight text-white">
          Find your account
        </h3>
        <p className="text-slate-400 text-sm">
          Introduce your email or the username to reset your password
        </p>
        <Form className="space-y-5" method="post">
          <div className="flex flex-col gap-y-2">
            <TextInput
              label="email"
              fieldType="email"
              placeholder="Introduce your email"
            />
          </div>

          <button
            type="submit"
            disabled={isCounting || isLoading}
            style={{ opacity: isCounting ? 0.5 : 1 }}
            className="mt-1 w-full px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 font-bold uppercase text-xs tracking-wider rounded-lg shadow-lg active:scale-95 transition-all text-center disabled:cursor-not-allowed cursor-pointer"
          >
            {isCounting || isLoading
              ? `Resend email in ${formattedTime}`
              : "Resend Verification Email"}
          </button>
        </Form>
        <div className="text-center border-t border-gray-800/60">
          <a
            href="/login"
            className="text-xs font-medium text-slate-400 hover:text-amber-500 transition-colors"
          >
            ← Back to Login
          </a>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        closeOnClick={true}
      />
    </main>
  )
}
