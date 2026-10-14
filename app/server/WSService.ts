import { WebSocket } from "ws"
import { PrismaClient } from "../../generated/prisma/client"
import { wsManager, type IWSManager } from "~/socket-events/WSManager"
import { type MessageFormatter } from "~/socket-events/WSManager"

export class WSService {
  private prisma: PrismaClient
  private ws: WebSocket
  private messageFormatter: MessageFormatter
  private wsManager: IWSManager
  constructor(
    prisma: PrismaClient,
    ws: WebSocket,
    messageFormatter: MessageFormatter,
    wsManager: IWSManager
  ) {
    this.prisma = prisma
    this.ws = ws
    this.messageFormatter = messageFormatter
    this.wsManager = wsManager
  }

  async handleJoinTicket(ticketId: number, userId: number) {
    try {
      const ticket = await this.findAccessibleTicket(ticketId, userId)
      if (!ticket) {
        this.ws.send(
          this.messageFormatter.formatMessage("error", {
            message: "Ticket not found or access denied."
          })
        )
        return
      }

      const messages = await this.prisma.ticketMessage.findMany({
        where: { ticket_id: ticketId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      this.wsManager.addUserToTicketRoom(ticketId, this.ws)
      this.ws.send(
        this.messageFormatter.formatMessage("ticket_history", {
          ticketId,
          messages: messages.map((message) => ({
            id: message.id,
            ticket_id: message.ticket_id,
            user: message.user,
            content: message.content,
            createdAt: message.createdAt.toISOString()
          }))
        })
      )
      this.ws.send(
        this.messageFormatter.formatMessage("joined_ticket", {
          message: `Successfully joined room for ticket ${ticketId}`
        })
      )
    } catch (error) {
      this.ws.send(
        this.messageFormatter.formatMessage("error", {
          message: "Failed to join ticket room."
        })
      )
    }
  }

  async handleSendTicketMessage(
    data: { ticketId: number; content: string },
    userId: number
  ) {
    try {
      const ticket = await this.findAccessibleTicket(
        data.ticketId,
        userId
      )
      if (!ticket) {
        this.ws.send(
          this.messageFormatter.formatMessage("error", {
            message: "Ticket not found!"
          })
        )
        return
      }
      if (ticket.status === "RESOLVED") {
        this.ws.send(
          this.messageFormatter.formatMessage("error", {
            message: "Ticket already resolved"
          })
        )
        return
      }
      const savedMessage = await this.prisma.ticketMessage.create({
        data: {
          ticket_id: data.ticketId,
          user_id: userId,
          content: data.content
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })
      this.wsManager.broadcastToTicketRoom(
        data.ticketId,
        "receive_message",
        {
          id: savedMessage.id,
          ticket_id: savedMessage.ticket_id,
          user: savedMessage.user,
          content: savedMessage.content,
          createdAt: savedMessage.createdAt
        }
      )
    } catch (error) {
      console.error("Error sending ticket message:", error)
      this.ws.send(
        this.messageFormatter.formatMessage("error", {
          message: "Internal server error while sending message."
        })
      )
    }
  }

  private async findAccessibleTicket(
    ticketId: number,
    userId: number
  ) {
    const [ticket, user] = await Promise.all([
      this.prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, user_id: true, status: true }
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      })
    ])
    if (!ticket || !user) return null

    const adminEmails = (process.env.TICKET_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
    const isOwner = ticket.user_id === userId
    const isAdmin = adminEmails.includes(
      user.email.trim().toLowerCase()
    )

    return isOwner || isAdmin ? ticket : null
  }
}
