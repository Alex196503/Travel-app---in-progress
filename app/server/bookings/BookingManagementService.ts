import type { INotificationEventEmitter } from "~/events/NotificationEventEmitter"
import { type PrismaClient } from "../../../generated/prisma/client"
import { BadRequestError, NotFoundError } from "../auth/custom-errors"
// Service dedicated exclusively to modification, update, and cancellation operations (PATCH) for the Booking entity.
export class BookingManagementService {
  private prisma: PrismaClient
  private readonly notificationEmitter: INotificationEventEmitter
  constructor(
    prisma: PrismaClient,
    notificationEmitter: INotificationEventEmitter
  ) {
    this.prisma = prisma
    this.notificationEmitter = notificationEmitter
  }

  async changeNumberOfSeats(
    user_id: number,
    id_booking: number,
    seats_booked: number
  ) {
    let bookingFound = await this.prisma.booking.findUnique({
      where: { id: id_booking, user_id: user_id },
      include: { trip: true }
    })
    if (!bookingFound) {
      throw new NotFoundError("Booking not found!")
    }
    if (bookingFound.status === "CANCELLED") {
      throw new BadRequestError("Booking is cancelled!")
    }
    const oldSeats = bookingFound.seats_booked
    const seatDifference = seats_booked - oldSeats
    if (seatDifference === 0) {
      return {
        success: false,
        message:
          "You didn't change anything related to the seats counter!"
      }
    }
    let available_seats = bookingFound.trip.available_seats
    if (seatDifference > 0 && seatDifference > available_seats) {
      throw new BadRequestError(
        "Not enough available seats left for this trip"
      )
    }
    let result = await this.prisma.$transaction(async (tx) => {
      let updatedBook = await tx.booking.update({
        where: { id: id_booking },
        data: {
          seats_booked: seats_booked,
          total_price:
            bookingFound.trip.price.toNumber() * seats_booked
        }
      })
      let updatedTrip = null
      if (seatDifference > 0) {
        updatedTrip = await tx.trip.updateMany({
          where: {
            id: bookingFound.trip_id,
            available_seats: { gte: seatDifference }
          },
          data: { available_seats: { decrement: seatDifference } }
        })
      } else {
        await tx.trip.update({
          where: { id: bookingFound.trip_id },
          data: {
            available_seats: { increment: Math.abs(seatDifference) }
          }
        })
      }
      if (updatedTrip?.count === 0) {
        throw new Error(
          "Not enough available seats left due to concurrent bookings."
        )
      }
      const newNotification = await tx.notifications.create({
        data: {
          user_id: bookingFound.user_id,
          message: `Your booking seats have been updated to ${seats_booked}.`,
          was_read: false,
          trip_id: bookingFound.trip_id,
          type: "Booking updated"
        }
      })
      return { totalPrice: updatedBook.total_price, newNotification }
    })
    this.notificationEmitter.emit(
      "booking.seats_updated",
      result.newNotification
    )
    return { message: "Booking updated succesfully", success: true }
  }

  async cancelBooking(id_booking: number, user_id: string) {
    let bookingFound = await this.prisma.booking.findUnique({
      where: {
        id: id_booking,
        user_id: Number(user_id)
      }
    })
    if (!bookingFound || bookingFound.status === "CANCELLED") {
      throw new BadRequestError(
        "Booking not found or booking is already cancelled!"
      )
    }
    let tripId = bookingFound.trip_id
    const trip = await this.prisma.trip.findUnique({
      where: { id: bookingFound.trip_id }
    })
    if (!trip) {
      throw new NotFoundError("Trip not found")
    }
    const startDate = new Date(trip.start_date).getTime()
    if (Date.now() > startDate) {
      throw new BadRequestError("You trip has already begun!")
    }
    let result = await this.prisma.$transaction(async (tx) => {
      let bookingResult = await tx.booking.updateMany({
        where: {
          id: id_booking
        },
        data: {
          status: "CANCELLED"
        }
      })
      if (bookingResult.count === 0) {
        throw new Error("Could not update booking due to some error!")
      }
      await tx.trip.update({
        where: {
          id: Number(tripId)
        },
        data: {
          available_seats: {
            increment: bookingFound.seats_booked
          }
        }
      })
      const newNotification = await tx.notifications.create({
        data: {
          user_id: bookingFound.user_id,
          message: `Your booking ${bookingFound.id} has been cancelled!`,
          was_read: false,
          trip_id: bookingFound.trip_id,
          type: "Booking cancelled"
        }
      })
      return newNotification
    })
    this.notificationEmitter.emit("booking.cancelled", result)
    return {
      success: true,
      message: "Booking cancelled succesfully!"
    }
  }
}
