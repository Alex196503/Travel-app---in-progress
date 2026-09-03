import { createContext, useState } from "react"
import {
  type AuthContextProps,
  type ModalContextProps,
  type NotificationContextProps,
  type ThemeContextProps
} from "~/types/types"
//Global context to manage the theme of the app to avoid prop drilling through multiple components
export const ThemeContext = createContext<ThemeContextProps | null>(
  null
)

// Creates the authentication context with an initial undefined value
export const AuthContext = createContext<
  AuthContextProps | undefined
>(undefined)

// Creates the modal bookings context that stores display modal value across the entire app
export const ModalContext = createContext<
  ModalContextProps | undefined
>(undefined)

// Creates the notification context that stores all the information about the recieved notification across the entire app
export const NotificationContext = createContext<NotificationContextProps | undefined>(undefined)