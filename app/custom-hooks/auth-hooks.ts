import { type ZodTypeAny } from "zod"
import { useNavigate } from "react-router"
import { type ZodFormattedError } from "zod"
import { useContext, useState } from "react"
import { api } from "~/axios/axios"
import { type RegisterResponse } from "~/types/auth-types"
import axios from "axios"
import { AuthContext } from "~/react-contexts/context"

//Custom hook to consume the authContext, that stores our short-lived access token.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("Auth context does not exist in your app!")
  }
  return context
}

// Custom hook to perform an authentification request to the server, that can be used in our register or login page
export function useAuthSubmit<AuthSchema extends ZodTypeAny>(
  url: string,
  redirectTo: string,
  schema: AuthSchema
) {
  const { setAccessToken, setUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<
    string | ZodFormattedError<unknown> | null
  >(null)
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const payload = Object.fromEntries(formData.entries())
    const result = schema.safeParse(payload)
    if (!result.success) {
      setError(result?.error.format())
      setLoading(false)
      return
    }
    if (formData.has("avatar")) {
      const avatarFile = formData.get("avatar") as File
      if (!avatarFile || avatarFile.size === 0) {
        setError({
          _errors: [],
          avatar: { _errors: ["Profile picture is required"] }
        })
        setLoading(false)
        return
      }
    }
    try {
      const dataToSend = url.includes("/login") ? payload : formData
      const res = await api.post<
        RegisterResponse & { accessToken: string }
      >(url, dataToSend, {})
      setAccessToken(res.data.accessToken as string)
      setUser(res.data.user)
      navigate(redirectTo)
    } catch (err: unknown) {
      if (axios.isAxiosError<Omit<RegisterResponse, "user">>(err)) {
        setError(
          err.response?.data?.message ||
            "Communication error with the server!"
        )
      } else {
        setError("An unexpected error ocurred!" + err)
      }
    } finally {
      setLoading(false)
    }
  }
  return { error, loading, handleSubmit }
}
