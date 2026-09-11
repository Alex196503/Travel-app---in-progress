import { useEffect, useState } from "react"
import { toast } from "react-toastify"

// Custom hook to debounce a fast-changing value. It delays updating the returned value until the user stops typing for the specified delay.
export function useDebouncer(value: string, delay: number) {
  const [debounceValue, setDebounceValue] = useState(value)
  useEffect(() => {
    let timeout = setTimeout(() => {
      setDebounceValue(value)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])
  return debounceValue
}

//Custom hook that provides a simple second-based countdown state and a formatted `MM:SS` string.
export function useCountdown(initialTime = 0) {
  const [countdown, setCountdown] = useState(initialTime)
  useEffect(() => {
    if (countdown <= 0) return
    let timerId = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timerId)
  }, [countdown])
  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  return {
    countdown,
    setCountdown,
    formattedTime,
    isCounting: countdown > 0
  }
}

//Custom hook to handle React Router fetcher responses, automatically triggering toast notifications or form error updates.
export function useFormToast<
  T extends {
    success: boolean
    message?: string
    errors?: Record<string, string[]> | undefined
  }
>(
  fetcherData: T | undefined,
  setErrors?: (errors: Record<string, string[] | undefined>) => void
) {
  useEffect(() => {
    if (!fetcherData) return
    if (fetcherData.success) {
      toast.success(fetcherData.message || "Operation successful!")
    } else {
      if (fetcherData.errors && setErrors) {
        setErrors(fetcherData?.errors)
      } else if (fetcherData.message) {
        toast.error(fetcherData.message)
      }
    }
  }, [fetcherData])
}
