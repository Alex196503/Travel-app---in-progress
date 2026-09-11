import {
  Form,
  redirect,
  useActionData,
  useNavigation
} from "react-router"
import { TextInput } from "../register/local_components/InputText"
import type { Route } from "./+types"
import axios from "axios"
import { ResetPasswordSchema } from "~/utils/validation/zod-validation"
import { api } from "~/axios/axios"
import { useEffect } from "react"
import { toast, ToastContainer } from "react-toastify"
import { type ExpressErrorResponse } from "~/types/auth-types"

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")
  if (!token) {
    return redirect("/login?token=notFound")
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const url = new URL(request.url)
  const token = url.searchParams.get("token") || ""
  if (!token) {
    return { success: false, message: "Missing verification token." }
  }
  try {
    const payload = Object.fromEntries(formData.entries())
    payload["token"] = token
    const result = ResetPasswordSchema.safeParse(payload)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      return {
        success: false,
        errors: {
          password: fieldErrors.password?.[0],
          confirmPassword: fieldErrors.confirmPassword?.[0]
        },
        message: "Please fix the errors below."
      }
    }
    let req = await api.post<{ success: boolean; message: string }>(
      "/auth/reset-password",
      payload
    )
    if (req.data.success) {
      return {
        success: true,
        message: req.data.message || "Password reset successfully!"
      }
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const serverResponse = error.response
        ?.data as ExpressErrorResponse
      if (serverResponse?.errors) {
        return {
          success: false,
          errors: serverResponse.errors,
          message:
            serverResponse.message || "Validation failed on server"
        }
      }
      return {
        success: false,
        message: serverResponse?.message || error.message
      }
    }

    let errorMessage = "An unexpected error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return { success: false, message: errorMessage }
  }
}

export default function ResetPasswordPage() {
  const resetPasswordFields = [
    {
      label: "password",
      placeholder: "••••••••",
      fieldType: "password"
    },
    {
      label: "confirmPassword",
      placeholder: "••••••••",
      fieldType: "password"
    }
  ]
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isLoading = navigation.state === "submitting"
  useEffect(() => {
    if (!actionData) return
    if (actionData.success) {
      toast.success(actionData?.message)
    } else {
      toast.error(
        typeof actionData.message === "string"
          ? actionData.message
          : "Invalid data provided."
      )
    }
  }, [actionData])
  const errors =
    actionData && !actionData.success && "errors" in actionData
      ? actionData.errors
      : undefined
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12 text-white">
      <div className="w-full max-w-md space-y-6 bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-white">
            Set new password
          </h3>
          <p className="text-slate-400 text-sm">
            Your new password must be different from previously used
            passwords.
          </p>
        </div>
        <Form className="space-y-4" method="post">
          {resetPasswordFields.map((field) => {
            const fieldError =
              errors?.[field.label as keyof typeof errors]
            return (
              <div className="space-y-1" key={field.label}>
                <TextInput
                  key={field.label}
                  label={field.label}
                  fieldType={field.fieldType}
                  placeholder={field.placeholder}
                />
                {fieldError && (
                  <p className="text-xs text-rose-500 font-medium">
                    {fieldError}
                  </p>
                )}
              </div>
            )
          })}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 font-bold uppercase text-xs tracking-wider rounded-lg shadow-lg active:scale-95 transition-all text-center cursor-pointer"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </Form>

        <section className="text-center pt-2 border-t border-gray-800/60">
          <a
            href="/login"
            className="text-xs font-medium text-slate-400 hover:text-amber-500 transition-colors inline-block"
          >
            ← Back to Login
          </a>
        </section>
      </div>
      <ToastContainer
        role="status"
        position="top-right"
        autoClose={5000}
        closeOnClick={true}
      />
    </main>
  )
}
