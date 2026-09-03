import type { PrismaClient } from "../../../generated/prisma/client"
import { NotFoundError } from "../auth/custom-errors"
// Service responsible for handling all database queries and business logic related to user notifications, including fetching, reading, and updating states.

export class NotificationQueryService {
  private prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async findAllNotifications(idUser: string) {
    let notifications = await this.prisma.notifications.findMany({
      where: {
        user_id: Number(idUser)
      },
      orderBy: {
        createdAt: "desc"
      }
    })
    return notifications
  }

  async updateNotificationAsRead(
    notificationId: number,
    userId: string
  ) {
    const notificationFound =
      await this.prisma.notifications.findUnique({
        where: { id: notificationId, user_id: Number(userId) }
      })
    if (!notificationFound || notificationFound.was_read) {
      throw new NotFoundError(
        "Notification not found or already read!"
      )
    }
    const updatedNotification =
      await this.prisma.notifications.update({
        where: { id: notificationId },
        data: { was_read: true }
      })
    return updatedNotification
  }

  async updateAllUnreadNotifications(userId: number) {
    const updateResult = await this.prisma.notifications.updateMany({
      where: {
        user_id: userId,
        was_read: false
      },
      data: { was_read: true }
    })
    return updateResult.count
  }
}
