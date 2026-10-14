import { WebSocket as WSClient } from "ws"
import type { WSIncomingMessage } from "~/types/feature-types"

export interface MessageFormatter {
  formatMessage(event: string, payload?: unknown): string
}

export class JSONMessageFormatter implements MessageFormatter {
  formatMessage(event: string, payload: unknown): string {
    return JSON.stringify({ event, data: payload })
  }
}

export interface MessageParser {
  parseMessage(raw: unknown): WSIncomingMessage
}

export class JSONMessageParser implements MessageParser {
  parseMessage(raw: unknown): WSIncomingMessage {
    const rawString = typeof raw === "string" ? raw : String(raw)
    return JSON.parse(rawString) as WSIncomingMessage
  }
}

export interface IWSManager {
  addUserToTicketRoom(ticketId: number, ws: WSClient): void
  removeAllUsersFromRoom(ws: WSClient): void
  broadcastToTicketRoom(
    ticketId: number,
    event: string,
    payload: unknown,
    senderWs?: WebSocket
  ): void
}

// Manages WebSocket connections and broadcasts messages to clients based on ticket rooms
class WSManager implements IWSManager {
  private clients = new Map<number, Set<WSClient>>()
  private messageFormatter: MessageFormatter
  constructor(messageFormatter: MessageFormatter) {
    this.messageFormatter = messageFormatter
  }
  addUserToTicketRoom(ticketId: number, ws: WSClient) {
    if (!this.clients.has(ticketId)) {
      this.clients.set(ticketId, new Set<WSClient>())
    }
    this.clients.get(ticketId)?.add(ws)
  }
  removeAllUsersFromRoom(ws: WSClient) {
    {
      for (const [ticketId, clients] of this.clients.entries()) {
        clients.delete(ws)
        if (clients.size === 0) {
          this.clients.delete(ticketId)
        }
      }
    }
  }

  broadcastToTicketRoom(
    ticketId: number,
    event: string,
    payload: unknown,
    senderWs?: WebSocket
  ) {
    const sockets = this.clients.get(ticketId)
    if (!sockets) return

    const messageString = this.messageFormatter.formatMessage(
      event,
      payload
    )

    for (const client of sockets) {
      if (client.readyState === WSClient.OPEN) {
        client.send(messageString)
      }
    }
  }
}

export const wsManager = new WSManager(new JSONMessageFormatter())
