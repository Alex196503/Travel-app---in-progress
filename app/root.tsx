import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "react-router"

import type { Route } from "./+types/root"
import "./app.css"
import {
  AuthContext,
  ModalContext,
  NotificationContext,
  ThemeContext
} from "./react-contexts/context"
import { useEffect, useState } from "react"
import type {
  AuthContextProps,
  RegisterResponse
} from "./types/types"
import axios from "axios"
import { api } from "./axios/axios"
import { accessTokenStorage } from "./utils/frontend-utils"
import ApiNav from "./routes/api/local_components/ApiNav"
import { IoMoon, IoSunny } from "react-icons/io5"
import { NotificationProvider } from "./context-providers/NotificationContext"

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  }
]

export function Layout({ children }: { children: React.ReactNode }) {
  const [isDark, setDark] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isModalBookingsOpen, setModalBookingsOpen] = useState(false)
  const [user, setUser] = useState<AuthContextProps["user"] | null>(
    null
  )

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    if (savedTheme === "dark") {
      setDark(true)
    }
  }, [])

  useEffect(() => {
    const getNewRefreshToken = async () => {
      try {
        let res = await api.post<{
          accessToken: string
          user: {
            id: number
            email: string
            name: string
            avatar: string
            isVerified?: boolean
          }
        }>("/auth/refresh")
        setAccessToken(res.data.accessToken)
        setUser(res.data.user)
        accessTokenStorage.setAccessToken(res.data.accessToken)
      } catch (error) {
        if (
          axios.isAxiosError<Omit<RegisterResponse, "user">>(error)
        ) {
          let errorMessage = error.response?.data?.message
          console.log(`Could not refresh the token! ${errorMessage}`)
          setUser(null)
          setAccessToken("")
        } else {
          console.log(`An unexpected error occured! ${error}`)
        }
      }
    }
    getNewRefreshToken()
  }, [])

  useEffect(() => {
    accessTokenStorage.setAccessToken(accessToken as string)
  }, [accessToken])

  useEffect(() => {
    if (isDark) {
      localStorage.setItem("theme", "dark")
    } else {
      localStorage.setItem("theme", "light")
    }
  }, [isDark])
  return (
    <ThemeContext.Provider value={{ isDark, setDark }}>
      <AuthContext.Provider
        value={{ accessToken, setAccessToken, user, setUser }}
      >
        <NotificationProvider>
          <ModalContext.Provider
            value={{ setModalBookingsOpen, isModalBookingsOpen }}
          >
            <html lang="en" className={isDark ? "dark" : ""}>
              <head>
                <meta charSet="utf-8" />
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1"
                />
                <Meta />
                <Links />
              </head>
              <body className="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-200">
                <ApiNav
                  navTitle="Visit a new country"
                  user={user}
                  isDark={isDark}
                  setDark={setDark}
                  bgColor={isDark ? "Dark" : "Light"}
                >
                  {" "}
                  {isDark ? <IoMoon /> : <IoSunny />}{" "}
                </ApiNav>
                {children}
                <ScrollRestoration />
                <Scripts />
              </body>
            </html>
          </ModalContext.Provider>
        </NotificationProvider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error"
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
