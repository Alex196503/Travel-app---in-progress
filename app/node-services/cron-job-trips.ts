import cron from "node-cron"
import { prisma } from "../../prisma/prisma"
import { notificationEventEmitter } from "~/events/NotificationEventEmitter"
// Schedule a cron job to run every day at 9 AM to find upcoming trips in 2 days and send notifications to users about their trips.
cron.schedule("0 9 * * *", async () => {
  console.log("Checking upcomming trips")
  const targetStartDate = new Date()
  targetStartDate.setDate(targetStartDate.getDate() + 2)
  targetStartDate.setHours(0, 0, 0, 0)
  const targetEndDate = new Date(targetStartDate)
  targetEndDate.setHours(23, 59, 59, 999)
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      trip: {
        start_date: {
          gte: targetStartDate,
          lte: targetEndDate
        }
      }
    },
    include: {
      trip: true
    }
  })
  for (const booking of upcomingBookings) {
    const message = `Reminder: Your trip to ${booking.trip.country_code} is scheduled for ${booking.trip.start_date.toLocaleString()}.`
    let notificationCreated = await prisma.notifications.create({
      data: {
        message,
        user_id: booking.user_id,
        trip_id: booking.trip_id,
        was_read: false,
        type: "TRIP_REMINDER"
      }
    })
    notificationEventEmitter.emit(
      "booking.reminder",
      notificationCreated
    )
  }
})
