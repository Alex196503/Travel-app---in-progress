import { redirect } from "react-router"
import { api } from "~/axios/axios"

// Server-side auth gate for protected routes. We inspect the incoming request cookies, require a refreshToken cookie to exist, then call the refresh endpoint with those same cookies attached.
export const requireAuthOnServer = async (request: Request) => {
  const cookieHeaders = request.headers.get("cookie") || ""
  const cookies = Object.fromEntries(
    cookieHeaders.split("; ").map((cookie) => {
      const [key, ...v] = cookie.split("=")
      return [key, v.join("=")]
    })
  )
  if (!cookies["refreshToken"]) {
    throw redirect("/login?token=notFound")
  }
  try {
    await api.post<{
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
          cookie: cookieHeaders
        }
      }
    )
  } catch (error) {
    throw redirect("/login?token=invalid")
  }
}

// Loader helper: redirect authenticated users away from public auth pages, reads `refreshToken` from incoming request cookies and returns a `redirect` to `/` when present.
export const redirectIfAuthenticated = (request: Request) => {
  const cookieHeaders = request.headers.get("cookie") || ""
  const cookies = Object.fromEntries(
    cookieHeaders.split("; ").map((cookie) => {
      const [key, ...v] = cookie.split("=")
      return [key, v.join("=")]
    })
  )
  if (cookies["refreshToken"]) {
    return redirect("/?message=alreadyLoggedIn")
  }
  return null
}
