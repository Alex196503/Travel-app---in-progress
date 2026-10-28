import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import { prisma } from "../../prisma/prisma"
import express from "express"
import { authentificationMiddleware } from "~/middleware/authMiddleware"
import { type Ticket } from "~/types/feature-types"
import { TicketManagementService } from "~/server/TicketManagementService"
import {
  Conflict,
  ForbiddenError,
  NotFoundError
} from "~/server/auth/custom-errors"
import {
  idSchema,
  ticketIdSchema
} from "~/utils/validation/zod-validation"
export const TicketRouter = express.Router()
const ticketManagementService = new TicketManagementService(prisma)

TicketRouter.get(
  "/",
  authentificationMiddleware,
  async (
    req: Request,
    res: Response<{
      success: boolean
      message?: string
      tickets?: Ticket[]
    }>,
    next: NextFunction
  ) => {
    try {
      const userId = Number(req.user?.id)

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        })
      }
      const tickets =
        await ticketManagementService.getAllTicketsForUser(userId)
      return res.status(200).json({
        success: true,
        tickets: tickets.map((ticket) => ({
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt
        }))
      })
    } catch (error) {
      return next(error)
    }
  }
)

TicketRouter.get(
  "/admin",
  authentificationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedUserId = idSchema.safeParse(req.user?.id)
      if (!parsedUserId.success) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        })
      }

      const tickets =
        await ticketManagementService.getTicketsForAdmin(
          parsedUserId.data
        )
      return res.status(200).json({
        success: true,
        tickets
      })
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return res.status(403).json({
          success: false,
          message: error.message
        })
      }
      return next(error)
    }
  }
)

TicketRouter.post(
  "/",
  authentificationMiddleware,
  async (
    req: Request<{}, {}, { subject: string }>,
    res: Response<{
      success: boolean
      message?: string
      ticket?: Ticket
    }>,
    next: NextFunction
  ) => {
    try {
      const userId = Number(req.user?.id)
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" })
      const { subject } = req.body
      if (
        !subject ||
        typeof subject !== "string" ||
        subject.trim() === ""
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Subject is required" })
      }

      let newTicket = await ticketManagementService.createTicket(
        userId,
        subject
      )
      return res.status(201).json({
        success: true,
        message: "Ticket created successfully",
        ticket: {
          id: newTicket.id,
          subject: newTicket.subject,
          status: newTicket.status,
          createdAt: newTicket.createdAt,
          updatedAt: newTicket.updatedAt
        }
      })
    } catch (error) {
      if (error instanceof Conflict) {
        return res.status(409).json({
          success: false,
          message: error.message
        })
      }
      return next(error)
    }
  }
)

TicketRouter.patch(
  "/:id/close",
  authentificationMiddleware,
  async (
    req: Request<{ id: string }, {}, {}>,
    res: Response<{
      success: boolean
      message?: string
      ticket?: Ticket
    }>,
    next: NextFunction
  ) => {
    try {
      const userId = idSchema.safeParse(req.user?.id)
      if (!userId.success) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" })
      }

      const ticketId = ticketIdSchema.safeParse(Number(req.params.id))
      if (!ticketId.success) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid ticket ID" })
      }
      const updatedTicket = await ticketManagementService.closeTicket(
        userId.data,
        ticketId.data
      )
      return res
        .status(200)
        .json({ success: true, ticket: updatedTicket })
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message
        })
      } else if (error instanceof Conflict) {
        return res.status(409).json({
          success: false,
          message: error.message
        })
      }
      return next(error)
    }
  }
)
