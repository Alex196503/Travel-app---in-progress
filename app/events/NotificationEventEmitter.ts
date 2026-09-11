import { EventEmitter } from "events"
import type { NotificationItem } from "~/types/feature-types"

export interface INotificationEventEmitter {
  emit(
    eventName: string | symbol,
    ...args: NotificationItem[]
  ): boolean
  on(event: string, listener: (...args: unknown[]) => void): this
}
class NotificationEventEmitter
  extends EventEmitter
  implements INotificationEventEmitter {}

//Singleton EventEmitter instance to be used across the application for emitting and listening to notification events.
export const notificationEventEmitter = new NotificationEventEmitter()
