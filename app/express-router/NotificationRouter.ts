import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import express from "express"
import { authentificationMiddleware } from "~/middleware/authMiddleware"
import { prisma } from "../../prisma/prisma"
import type { NotificationItem } from "~/types/feature-types"
import { sseManager } from "~/node-services/SSEManager"
import { NotificationQueryService } from "~/server/notifications/NotificationQueryService"
import { NotFoundError } from "~/server/auth/custom-errors"

const notificationQueryService = new NotificationQueryService(prisma)

export const NotificationRouter = express.Router()
NotificationRouter.get(
  "/",
  authentificationMiddleware,
  async (
    req: Request,
    res: Response<{
      success: boolean
      notifications: NotificationItem[]
      unreadCount: number
    }>,
    next: NextFunction
  ) => {
    let idUser = req.user?.id
    try {
      let notifications =
        await notificationQueryService.findAllNotifications(
          idUser as string
        )
      return res.status(200).json({
        success: true,
        notifications,
        unreadCount: notifications.filter(
          (notification) => !notification.was_read
        ).length
      })
    } catch (err) {
      return next(err)
    }
  }
)

NotificationRouter.get(
  "/stream",
  authentificationMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    const heartBeat = setInterval(() => {
      res.write(":ping\n\n")
    }, 20000)
    const userId = Number(req.user?.id)
    sseManager.addClient(userId, res)
    req.on("close", () => {
      sseManager.removeClient(userId)
      clearInterval(heartBeat)
      res.end()
    })
  }
)

NotificationRouter.patch(
  "/:notificationId/read",
  authentificationMiddleware,
  async (
    req: Request<{ notificationId: string }>,
    res: Response<{
      success: boolean
      message?: string
      notification?: NotificationItem
    }>,
    next: NextFunction
  ) => {
    const notificationId = Number(req.params.notificationId)
    if (!notificationId || isNaN(notificationId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" })
    }
    try {
      const notificationFound =
        await notificationQueryService.updateNotificationAsRead(
          notificationId,
          req.user?.id as string
        )
      return res
        .status(200)
        .json({ success: true, notification: notificationFound })
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: err.message
        })
      }
      return next(err)
    }
  }
)

NotificationRouter.patch(
  "/read-all",
  authentificationMiddleware,
  async (
    req: Request,
    res: Response<{
      success: boolean
      notificationsUpdated?: number
      message?: string
    }>,
    next: NextFunction
  ) => {
    const userId = Number(req.user?.id)
    try {
      let numberOfNotificationsUpdated =
        await notificationQueryService.updateAllUnreadNotifications(
          userId
        )
      return res.status(200).json({
        success: true,
        notificationsUpdated: numberOfNotificationsUpdated
      })
    } catch (err) {
      return next(err)
    }
  }
)
