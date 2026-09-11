import { useEffect, useState } from "react"
import { api } from "~/axios/axios"
import { useAuth } from "~/custom-hooks/auth-hooks"
import { NotificationContext } from "~/react-contexts/context"
import type { NotificationItem } from "~/types/feature-types"
import { EventSourcePolyfill } from "event-source-polyfill"

export const NotificationProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { user, accessToken } = useAuth()
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpenNotificationDropdown, setNotificationDropdownStatus] =
    useState<boolean>(false)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    const fetchNotification = async () => {
      try {
        const res = await api.get<{
          notifications: NotificationItem[]
          unreadCount: number
          success: boolean
        }>("/notifications")
        if (res.data.success) {
          setNotifications(res.data.notifications)
          setUnreadCount(res.data.unreadCount)
        }
      } catch (err) {
        console.error(`Something bad happened! ${err}`)
      }
    }
    fetchNotification()
  }, [user])

  useEffect(() => {
    if (!user) return

    //Using event source polyfill beacause the native EventSource does not support custom headers, which are needed for authentication.
    const eventSource = new EventSourcePolyfill(
      `${import.meta.env.VITE_SERVER_URL || "http://localhost:5000"}/api/notifications/stream`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
    eventSource.onmessage = (event) => {
      try {
        const newNotification: NotificationItem = JSON.parse(
          event.data
        )
        setNotifications((prev) => [newNotification, ...prev])
        setUnreadCount((prev) => prev + 1)
      } catch (err) {
        console.error("Failed to parse SSE event data:", err)
      }
    }
    eventSource.onerror = (error) => {
      console.error("EventSource connection issue:", error)
    }
    return () => eventSource.close()
  }, [user])

  const markAsRead = async (id: number) => {
    try {
      let res = await api.patch<{
        notification: NotificationItem
        success: boolean
      }>(`/notifications/${id}/read`)
      if (res.data.success) {
        setNotifications((prev) => {
          return prev.map((notif) =>
            notif.id === id ? { ...notif, was_read: true } : notif
          )
        })
        setUnreadCount((prev) => Math.max(prev - 1, 0))
      }
    } catch (err) {
      console.error(`Failed to mark notification as read: ${err}`)
    }
  }

  const markAllAsRead = async () => {
    try {
      let res = await api.patch<{
        success: boolean
        notificationsUpdated: number
      }>("/notifications/read-all")
      if (res.data.success && res.data.notificationsUpdated > 0) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, was_read: true }))
        )
        setUnreadCount(0)
      }
    } catch (err) {
      console.error(
        `Failed to mark all notifications as read: ${err}`
      )
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpenNotificationDropdown,
        setNotificationDropdownStatus,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
