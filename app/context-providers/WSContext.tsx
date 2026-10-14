import { useEffect, useRef, useState, type ReactNode } from "react"
import { WebSocketContext } from "~/react-contexts/context"
import { useAuth } from "~/custom-hooks/auth-hooks"
import type { WebSocketContextType } from "~/types/feature-types"
import { webSocketServerMessageSchema } from "~/utils/validation/zod-validation"

export const WebSocketProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const { accessToken } = useAuth()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [lastMessage, setLastMessage] =
    useState<WebSocketContextType["lastMessage"]>(null)
  const socketRef = useRef<WebSocket | null>(null)
  useEffect(() => {
    if (!accessToken) {
      setIsConnected(false)
      setLastMessage(null)
      return
    }

    const serverUrl = new URL(
      import.meta.env.VITE_SERVER_URL || "http://localhost:5000"
    )
    serverUrl.protocol =
      serverUrl.protocol === "https:" ? "wss:" : "ws:"
    const ws = new WebSocket(serverUrl)
    socketRef.current = ws
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          event: "authenticate",
          data: { token: accessToken }
        })
      )
    }
    ws.onmessage = (event) => {
      try {
        if (typeof event.data !== "string") return
        const result = webSocketServerMessageSchema.safeParse(
          JSON.parse(event.data) as unknown
        )
        if (!result.success) {
          console.error(
            "Received invalid WebSocket message:",
            result.error
          )
          return
        }
        setLastMessage(result.data)
        if (result.data.event === "authenticated") {
          setIsConnected(true)
        }
      } catch (error) {
        console.error("Failed to parse incoming WS message:", error)
      }
    }
    ws.onclose = () => {
      if (socketRef.current === ws) {
        socketRef.current = null
        setIsConnected(false)
      }
    }
    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
    return () => {
      if (socketRef.current === ws) {
        socketRef.current = null
      }
      ws.close()
    }
  }, [accessToken])

  const sendMessage: WebSocketContextType["sendMessage"] = (
    message
  ) => {
    if (
      isConnected &&
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN
    ) {
      socketRef.current.send(JSON.stringify(message))
    } else {
      console.warn(
        "WebSocket is not authenticated. Message not sent."
      )
    }
  }
  const joinTicket = (ticketId: number) => {
    sendMessage({ event: "join_ticket", data: { ticketId } })
  }
  const sendTicketMessage = (ticketId: number, content: string) => {
    sendMessage({
      event: "send_message",
      data: { ticketId, content }
    })
  }
  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        joinTicket,
        sendTicketMessage,
        lastMessage
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
