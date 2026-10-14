import { WebSocket } from "ws"
import { prisma } from "../../prisma/prisma"
import { WSService } from "~/server/WSService"
import { webSocketMessageSchema } from "~/utils/validation/zod-validation"
import {
  JSONMessageFormatter,
  wsManager,
  type IWSManager,
  type MessageFormatter
} from "~/socket-events/WSManager"

const jsonMessageFormatter = new JSONMessageFormatter()

export function createWebSocketHandler(
  messageFormatter: MessageFormatter,
  wsManager: IWSManager
) {
  return async function handleWebSocketMessage(
    ws: WebSocket,
    rawMessage: string,
    userId?: number
  ) {
    let payload: unknown
    try {
      payload = JSON.parse(rawMessage)
    } catch {
      ws.send(
        messageFormatter.formatMessage("error", {
          message: "Invalid JSON message."
        })
      )
      return
    }
    const result = webSocketMessageSchema.safeParse(payload)
    if (!result.success) {
      ws.send(
        JSON.stringify({
          event: "error",
          data: { message: "Invalid WebSocket message payload." }
        })
      )
      return
    }

    if (!userId || !Number.isInteger(userId) || userId <= 0) {
      ws.send(
        JSON.stringify({
          event: "error",
          data: {
            message: "Authenticate before sending WebSocket events."
          }
        })
      )
      return
    }

    const wsService = new WSService(
      prisma,
      ws,
      jsonMessageFormatter,
      wsManager
    )
    const { event, data } = result.data
    try {
      switch (event) {
        case "join_ticket":
          await wsService.handleJoinTicket(data.ticketId, userId)
          break
        case "send_message":
          await wsService.handleSendTicketMessage(data, userId)
          break
      }
    } catch (error) {
      console.error("WebSocket event processing failed:", error)
      ws.send(
        JSON.stringify({
          event: "error",
          data: { message: "Could not process WebSocket event." }
        })
      )
    }
  }
}
