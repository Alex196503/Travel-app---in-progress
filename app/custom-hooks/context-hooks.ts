import { useContext } from "react"
import {
  ModalContext,
  NotificationContext,
  ThemeContext
} from "~/react-contexts/context"

// Custom hook to safely consume the reset context.
export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error(
      "Reset context does not exist or was not created properly!"
    )
  }
  return context
}

//Custom hook to consume the modalContext, that stores a boolean value that decides if the modal is open or not
export function useModalBooking() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("Modal context does not exist in your app!")
  }
  return context
}

// Custom hook to safely consume the notifications context.
export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationPrFovider"
    )
  }
  return context
}
