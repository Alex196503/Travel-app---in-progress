import type { INotificationEventEmitter } from "~/events/NotificationEventEmitter"
import { type PrismaClient } from "../../../generated/prisma/client"
import { BadRequestError, NotFoundError } from "../auth/custom-errors"
import type { IEmailService } from "./email-helpers"
//Service dedicated exclusively to handling new resource creation (POST) for the Booking.
export class BookingCreationService {
  private prisma: PrismaClient
  private emailService: IEmailService
  constructor(
    prisma: PrismaClient,
    emailService: IEmailService,
    private readonly notificationEmitter: INotificationEventEmitter
  ) {
    this.prisma = prisma
    this.emailService = emailService
  }
  async performBooking(
    trip_id: string,
    seats_booked: number,
    user_id: string
  ) {
    let tripFound = await this.prisma.trip.findFirst({
      where: { id: Number(trip_id) }
    })
    if (!tripFound) {
      throw new NotFoundError("Trip not found!")
    }
    if (tripFound.available_seats < seats_booked) {
      throw new BadRequestError(
        `Not enough seats left. Only ${tripFound.available_seats} available.`
      )
    }
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        user_id: Number(user_id),
        trip_id: Number(trip_id),
        status: { not: "CANCELLED" }
      }
    })
    if (existingBooking) {
      throw new BadRequestError(
        "You already have a booking for this trip!"
      )
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.updateMany({
        where: {
          id: Number(trip_id),
          available_seats: { gte: seats_booked }
        },
        data: {
          available_seats: { decrement: seats_booked }
        }
      })
      if (updatedTrip.count === 0) {
        throw new Error("Not enough seats available.")
      }
      const newBooking = await tx.booking.create({
        data: {
          user_id: Number(user_id),
          trip_id: Number(trip_id),
          seats_booked: seats_booked,
          total_price: Number(tripFound.price) * seats_booked,
          status: "PENDING"
        },
        include: {
          user: {
            select: { email: true, name: true }
          }
        }
      })
      return newBooking
    })

    const newNotification = await this.prisma.notifications.create({
      data: {
        type: "Booking Created",
        message: `You have created a booking for the trip ${trip_id}. The trip will start on ${tripFound.start_date.toISOString().split("T")[0]} and will end on ${tripFound.end_date.toISOString().split("T")[0]}.`,
        user_id: Number(user_id),
        trip_id: Number(trip_id),
        was_read: false
      }
    })

    this.notificationEmitter.emit("booking.created", newNotification)
    setImmediate(async () => {
      try {
        if (result.user?.email) {
          const paymentLink = `http://localhost:3000/trips`
          const emailSubject = "Booking Confirmation - VoyageFlow"
          const emailBody = `
              Hello ${result.user.name || "Traveler"},
              Your trip booking has been successfully registered!
              Booking details:
              - Seats booked: ${result.seats_booked}
              - Total amount: ${result.total_price} €
              - Status: ${result.status}
              
              To complete your reservation, use the link below and access the section My bookings:
              ${paymentLink}
              
              Thank you for choosing VoyageFlow!
            `
          await this.emailService.sendEmail(
            result.user.email,
            emailSubject,
            emailBody
          )
        }
      } catch (error) {
        console.error(
          "Error while sending the email in background",
          error
        )
      }
    })
    return result
  }
}
