import { getMeta } from "~/helpers/helpers"
import { useThemeContext } from "~/custom-hooks/context-hooks"
import { useFormToast } from "~/custom-hooks/utility-hooks"
import { useAuth } from "~/custom-hooks/auth-hooks"
import { TextInput } from "../register/local_components/InputText"
import { FileInput } from "../register/local_components/FileInput"
import {
  Link,
  useFetcher,
  type LoaderFunctionArgs
} from "react-router"
import type { Route } from "./+types"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { ToastContainer } from "react-toastify"
import { EditProfileSchema } from "~/utils/validation/zod-validation"
import axios from "axios"
import { api } from "~/axios/axios"
import type { ProfileRouteResponse } from "~/types/auth-types"
import { type AuthenticatedUser } from "~/types/auth-types"
import { requireAuthOnServer } from "~/utils/frontend-utils/auth-guards"
import { hasNoProfileChanges } from "~/utils/frontend-utils/profile-utils"
export const meta = () => getMeta("Edit Profile page")

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuthOnServer(request)
  try {
    const cookieHeaders = request.headers.get("cookie") || ""
    const response = await api.get<ProfileRouteResponse>(
      "/profile/",
      {
        headers: {
          cookie: cookieHeaders
        }
      }
    )
    return {
      success: response.data.success,
      user: response.data.user
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const serverResponse = error.response?.data
      if (serverResponse?.errors) {
        return {
          success: false,
          message: serverResponse?.message || error.message
        }
      }
      return {
        success: false,
        message: serverResponse?.message || error.message
      }
    }
    return {
      success: false,
      message: "An unexpected error occurred while loading profile"
    }
  }
}

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData()
  try {
    const cookieHeader = request.headers.get("cookie") || ""
    const response = await api.patch<{
      success: boolean
      message: string
      user: AuthenticatedUser
    }>("/profile/update", formData, {
      headers: {
        cookie: cookieHeader
      },
      signal: request.signal
    })
    return {
      success: true,
      message: response.data.message,
      user: response.data.user
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return {
        success: false,
        message:
          (err.response?.data?.message as string) ||
          "Failed to update profile"
      }
    } else if (axios.isCancel(err)) {
      return {
        success: false,
        message: "Request cancelled!"
      }
    }
    return {
      success: false,
      message: "An unexpected error occurred"
    }
  }
}

export default function EditProfilePage() {
  const { isDark, setDark } = useThemeContext()
  const fetcher = useFetcher<ProfileRouteResponse>()
  const { user } = useAuth()
  const [defaultName, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [avatar, setAvatar] = useState(user?.avatar || "")
  const [formKey, setFormKey] = useState(0)
  const resetChanges = () => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setAvatar((user.avatar as string) || "")
      setSelectedFile(null)
      setErrors(null)
      setFormKey((prev) => prev + 1)
    }
  }

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<{
    username?: string
    email?: string
    password?: string
  } | null>(null)
  useFormToast(fetcher.data, setErrors)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setAvatar((user.avatar as string) || "")
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const { shouldStop, message } = hasNoProfileChanges(
      user?.name || "",
      username,
      user?.email || "",
      email,
      password,
      selectedFile
    )
    if (shouldStop) {
      toast.info(message)
      return
    }
    const result = EditProfileSchema.safeParse({
      username,
      email,
      password: password || undefined
    })
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        username: fieldErrors.username?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0]
      })
      return
    }
    setErrors(null)
    fetcher.submit(formData, {
      method: "POST",
      encType: "multipart/form-data"
    })
  }

  const editingFields = [
    {
      label: "username",
      placeholder: "e.g: alex_traveler",
      fieldType: "text"
    },
    {
      label: "email",
      placeholder: "name@example.com",
      fieldType: "email"
    },
    { label: "avatar", fieldType: "file", accept: "image/*" },
    {
      label: "password",
      placeholder: "••••••••",
      fieldType: "password"
    }
  ]

  return (
    <main className="w-full py-3">
      <div className="flex justify-center items-center min-h-screen bg-gray-50 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="mb-2 text-gray-900 text-2xl font-bold">
            Update your profile
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Edit your personal information
          </p>
          <form
            className="flex flex-col gap-5"
            method="POST"
            onSubmit={handleSubmit}
            encType="multipart/form-data"
            key={formKey}
          >
            {errors && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {typeof errors === "string" ? (
                  <p>{errors}</p>
                ) : (
                  <ul className="list-disc pl-4 flex flex-col gap-1">
                    {Object.entries(errors).map(
                      ([field, message]) => {
                        if (!message) return null
                        return (
                          <li key={field}>
                            <span className="font-semibold capitalize">
                              {field}:
                            </span>{" "}
                            {message}
                          </li>
                        )
                      }
                    )}
                  </ul>
                )}
              </div>
            )}
            {editingFields.map((field) => {
              if (field.fieldType === "file") {
                return (
                  <FileInput
                    key={field.label}
                    label={field.label}
                    fieldType={field.fieldType}
                    accept={field.accept as string}
                    onFileSelect={(file) => setSelectedFile(file)}
                    existingImageUrl={avatar}
                  />
                )
              }

              const initialValue =
                field.label === "username"
                  ? defaultName
                  : field.label === "email"
                    ? email
                    : ""

              return (
                <TextInput
                  key={field.label}
                  label={field.label}
                  fieldType={field.fieldType}
                  placeholder={field.placeholder}
                  defaultValue={initialValue || ""}
                />
              )
            })}
            <button
              type="submit"
              className="mt-2.5 mb-4 py-3 bg-indigo-600 text-white rounded-lg text-base font-semibold cursor-pointer transition hover:bg-indigo-700 active:scale-[0.99]"
            >
              {fetcher.state === "submitting"
                ? "Saving..."
                : "Save your changes"}
            </button>
          </form>
          <button
            type="button"
            className="mt-2.5 mb-4 py-3 block w-full bg-orange-300 text-white rounded-lg text-base font-semibold cursor-pointer transition hover:bg-orange-500 active:scale-[0.99]"
            onClick={resetChanges}
          >
            Reset changes
          </button>
          {fetcher.state === "submitting" && (
            <button
              type="button"
              className="mt-2.5 mb-4 py-3 block w-full bg-red-300 text-white rounded-lg text-base font-semibold cursor-pointer transition hover:bg-red-500 active:scale-[0.99]"
              onClick={() => {
                fetcher.reset()
                toast?.info("Request cancelled!")
              }}
            >
              Cancel changes
            </button>
          )}
          <Link
            to="/"
            className="mt-4 text-center block px-10 py-2.5 bg-gray-400 hover:bg-gray-500 font-bold uppercase text-xs tracking-wider rounded-lg border border-slate-700 transition-all"
          >
            Go back
          </Link>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        closeOnClick={true}
      />
    </main>
  )
}
