import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import { prisma } from "../../prisma/prisma"
import express from "express"
import { TripsService } from "~/server/TripsService"
import type {
  Image,
  Trip,
  TripCategory
} from "../../generated/prisma/client"
import { authentificationMiddleware } from "~/middleware/authMiddleware"
export const TripRouter = express.Router()
export const tripService = new TripsService(prisma)
export type TripWithImages = Trip & {
  images: Image[]
  category: TripCategory
}

TripRouter.get(
  "/",
  authentificationMiddleware,
  async (
    req: Request<
      {},
      {},
      {},
      {
        category?: string
        search?: string
        minPrice?: string
        maxPrice?: string
        page?: string
        sort?: string
      }
    >,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = Number(req.query.page) || 1
      const limit = 3
      let categoryParam = req.query.category
      let searchParam = req.query.search
      const minPriceParam = req.query.minPrice
      const maxPriceParam = req.query.maxPrice
      const sortParam = req.query.sort
      const result = await tripService.getFilteredTrips({
        categoryParam,
        searchParam,
        minPriceParam,
        maxPriceParam,
        page,
        limit,
        sortParam
      })
      return res.status(200).json({
        success: true,
        count: result.formattedTrips.length,
        totalPages: result.totalPages,
        formattedTrips: result.formattedTrips
      })
    } catch (err) {
      return next(err)
    }
  }
)
TripRouter.get(
  "/:id",
  async (
    req: Request<{ id: string }>,
    res: Response<{ trip: TripWithImages; message: string }>,
    next: NextFunction
  ) => {
    try {
      const tripId = req.params.id
      let trip = await tripService.findSpecificTrip(tripId)
      return res.status(200).json({ trip, message: "Trip found!" })
    } catch (error) {
      return next(error)
    }
  }
)
