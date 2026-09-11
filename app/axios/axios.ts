import axios, { AxiosError } from "axios"
import { accessTokenStorage } from "~/utils/frontend-utils/access-storage"

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

const baseURL =
  typeof window !== "undefined"
    ? import.meta.env.VITE_API_URL || "/api"
    : process.env.VITE_API_URL || "http://localhost:5000/api"

// Create an axios instance with base URL configuration and credential support for authenticated API requests
export const api = axios.create({
  baseURL: baseURL,
  withCredentials: true
})

// Attach the current access token to every outgoing API request when one is available. This keeps the browser session authenticated across API calls without forcing the UI
// to manually pass the Authorization header on each request.
api.interceptors.request.use((config) => {
  const accessToken = accessTokenStorage.getAccessToken()
  if (accessToken && accessToken !== "") {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// This response interceptor is used to recover from expired access-token sessions. When the backend returns 401 Unauthorized for a request, it attempts to refresh the
// access token through the /refresh endpoint and retries the original call once with the new Authorization header.

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config
    if (!originalRequest) {
      return Promise.reject(error)
    }
    if (originalRequest.url?.includes("/auth/refresh")) {
      accessTokenStorage.setAccessToken("")
      return Promise.reject(error)
    }
    if (error?.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true
      try {
        const cookieHeader = originalRequest.headers?.cookie || ""
        const res = await api.post<{
          accessToken: string
          user: {
            id?: number | undefined
            name: string
            email: string
          }
        }>(
          "/auth/refresh",
          {},
          {
            headers: {
              cookie: cookieHeader
            }
          }
        )
        const newAccessToken = res.data.accessToken
        accessTokenStorage.setAccessToken(newAccessToken)
        originalRequest!.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        console.log("Refresh token expired, logging out...")
        accessTokenStorage.setAccessToken("")
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)
