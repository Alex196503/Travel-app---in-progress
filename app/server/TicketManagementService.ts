import { type PrismaClient } from "../../generated/prisma/client"
import {
  Conflict,
  ForbiddenError,
  NotFoundError
} from "~/server/auth/custom-errors"
import {
  checkOwnerPermission,
  isTicketAdmin
} from "~/utils/node-utils"

export class TicketManagementService {
  private prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  async getAllTicketsForUser(userId: number) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
    return tickets
  }

  async getTicketsForAdmin(userId: number) {
    const isAdmin = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })
    if (!isAdmin || !isTicketAdmin(isAdmin)) {
      throw new ForbiddenError("Admin access required.")
    }
    const tickets = await this.prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] }
      }
    })
    return tickets
  }

  async createTicket(userId: number, subject: string) {
    const activeTicketCount = await this.prisma.ticket.count({
      where: {
        user_id: userId,
        status: { in: ["OPEN", "IN_PROGRESS"] }
      }
    })

    if (activeTicketCount >= 6) {
      throw new Conflict(
        "You can have at most 6 active tickets. Close an existing ticket before creating another."
      )
    }

    const newTicket = await this.prisma.ticket.create({
      data: {
        user_id: userId,
        subject: subject.trim(),
        status: "OPEN"
      }
    })
    return newTicket
  }

  async closeTicket(userId: number, ticketId: number) {
    const [ticket, user] = await Promise.all([
      this.prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, user_id: true,status: true }
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      })
    ])
    if (!ticket || !user) {
      throw new NotFoundError("Ticket not found")
    }
    if (!checkOwnerPermission(ticket, userId, user)) {
      throw new NotFoundError("Ticket not found")
    }
    if(ticket.status === "RESOLVED")
    {
      throw new Conflict("Ticket already resolved")
    }
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "RESOLVED" }
    })
    return updatedTicket
  }
}
