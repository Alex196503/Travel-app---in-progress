import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import express from "express"
import { authentificationMiddleware } from "~/middleware/authMiddleware"
import type { Booking } from "../../generated/prisma/client"
import { prisma } from "../../prisma/prisma"
import {
  BadRequestError,
  NotFoundError
} from "~/server/auth/custom-errors"
import { checkCooldown, setCooldown } from "~/utils/node-utils"
import { BookingQueryService } from "~/server/bookings/BookingQueryService"
import { NodemailerService } from "~/server/bookings/email-helpers"
import { BookingCreationService } from "~/server/bookings/BookingCreationService"
import { BookingManagementService } from "~/server/bookings/BookingManagementService"

const nodemailerService = new NodemailerService()
const bookingGetRequestsService = new BookingQueryService(prisma)
const bookingPostRequestsService = new BookingCreationService(
  prisma,
  nodemailerService
)
const bookingPatchRequestsService = new BookingManagementService(
  prisma
)

export const BookingRouter = express.Router()
BookingRouter.post(
  "/",
  authentificationMiddleware,
  async (
    req: Request<{}, {}, { trip_id: string; seats_booked: number }>,
    res: Response<{
      success: boolean
      message: string
      bookingCreated?: Booking
    }>,
    next: NextFunction
  ) => {
    try {
      let tripId = Number(req.body.trip_id)
      let seats_booked = req.body.seats_booked
      if (!tripId || isNaN(tripId) || tripId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid trip ID provided."
        })
      }
      if (
        !seats_booked ||
        isNaN(seats_booked) ||
        !Number.isInteger(seats_booked) ||
        seats_booked < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please specify a valid number of seats (at least 1)."
        })
      }
      const userId = req.user?.id as string
      const newBooking =
        await bookingPostRequestsService.performBooking(
          tripId.toString(),
          seats_booked,
          userId
        )
      return res.status(201).json({
        message: "Your booking was created!",
        success: true,
        bookingCreated: newBooking
      })
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: err.message
        })
      } else if (err instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          message: err.message
        })
      }
      return next(err)
    }
  }
)

BookingRouter.get(
  "/",
  authentificationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        })
      }
      const bookings =
        await bookingGetRequestsService.getBookingsByUserId(
          Number(userId)
        )
      return res.status(200).json({
        success: true,
        count: bookings.length,
        bookings
      })
    } catch (error) {
      return next(error)
    }
  }
)

BookingRouter.patch(
  "/",
  authentificationMiddleware,
  async (
    req: Request<
      {},
      {},
      { seats_booked: string; booking_id: string }
    >,
    res: Response<{ success: boolean; message: string }>,
    next: NextFunction
  ) => {
    let userId = req.user?.id
    const cooldownTime = 5 * 60 * 1000
    //regex to eliminate leading zeros - e.g. 0000001
    if (!/^[1-9]\d*$/.test(req.body.seats_booked)) {
      return res.status(400).json({
        message: "Invalid format for seats_booked",
        success: false
      })
    }
    let seats_booked = req.body.seats_booked
      ? Number(req.body.seats_booked)
      : NaN
    let id_booking = Number(req.body.booking_id)
    if (
      !req.body.booking_id ||
      isNaN(id_booking) ||
      id_booking <= 0
    ) {
      return res.status(400).json({
        message: "Invalid booking ID",
        success: false
      })
    }
    if (
      isNaN(seats_booked) ||
      seats_booked <= 0 ||
      !Number.isInteger(seats_booked)
    ) {
      return res.status(400).json({
        message: "Invalid number of seats",
        success: false
      })
    }
    const { isCooldown, remainingMinutes, remainingSeconds } =
      checkCooldown(
        "editBooking",
        id_booking.toString(),
        cooldownTime
      )
    if (isCooldown) {
      return res
        .status(429)
        .set("Retry-After", remainingSeconds?.toString())
        .json({
          success: false,
          message: `Too many requests. Please wait about ${remainingMinutes} minutes before trying again.`
        })
    }
    try {
      let result =
        await bookingPatchRequestsService.changeNumberOfSeats(
          Number(userId),
          id_booking,
          seats_booked
        )
      setCooldown("editBooking", id_booking.toString(), cooldownTime)
      return res.status(200).json({
        message: result.message,
        success: result.success
      })
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: err.message
        })
      } else if (err instanceof BadRequestError) {
        return res.status(400).json({
          success: false,
          message: err.message
        })
      }
      return next(err)
    }
  }
)

BookingRouter.patch(
  "/cancel",
  authentificationMiddleware,
  async (
    req: Request<{}, {}, { booking_id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    let user_id = req?.user?.id
    let id_booking = Number(req.body.booking_id)
    if (
      !req.body.booking_id ||
      isNaN(id_booking) ||
      id_booking <= 0
    ) {
      return res.status(400).json({
        message: "Invalid booking ID",
        success: false
      })
    }
    try {
      let result = await bookingPatchRequestsService.cancelBooking(
        id_booking,
        user_id as string
      )
      return res.status(200).json({
        message: result.message,
        success: result.success
      })
    } catch (error) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({
          message: error.message
        })
      } else if (error instanceof NotFoundError) {
        return res.status(404).json({
          message: error.message
        })
      }
      return next(error)
    }
  }
)
