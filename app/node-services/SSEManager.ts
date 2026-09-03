import type { Response } from "express"
import { notificationEventEmitter } from "~/events/NotificationEventEmitter"
import type { NotificationItem } from "~/types/types"

// Acts as an event listener for application events and pushes updates to connected users, offering encapsulation
class SSEManager {
  private clients = new Map<number, Response>()
  constructor() {
    notificationEventEmitter.on(
      "booking.created",
      (data: NotificationItem) => {
        this.sendToUser(data.user_id, data)
      }
    )
    notificationEventEmitter.on(
      "booking.seats_updated",
      (data: NotificationItem) => {
        this.sendToUser(data.user_id, data)
      }
    )
    notificationEventEmitter.on(
      "booking.cancelled",
      (data: NotificationItem) => {
        this.sendToUser(data.user_id, data)
      }
    )
    notificationEventEmitter.on(
      "payment.succeeded",
      (data: NotificationItem) => {
        this.sendToUser(data.user_id, data)
      }
    )
    notificationEventEmitter.on(
      "payment.refunded",
      (data: NotificationItem) => {
        this.sendToUser(data.user_id, data)
      }
    )
    notificationEventEmitter.on(
      "booking.reminder",
      (data: NotificationItem) => {
        this.sendToUser(data.user_id, data)
      }
    )
  }
  addClient(userId: number, res: Response) {
    this.clients.set(userId, res)
  }
  removeClient(userId: number) {
    this.clients.delete(userId)
  }
  private sendToUser(userId: number, data: NotificationItem) {
    const clientRes = this.clients.get(userId)
    if (clientRes) {
      clientRes.write(`data: ${JSON.stringify(data)}\n\n`)
    }
  }
}
export const sseManager = new SSEManager()
