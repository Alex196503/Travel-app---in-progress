import {
  TripCategory,
  type Prisma,
  type PrismaClient
} from "../../generated/prisma/client"
import { NotFoundError } from "./auth/custom-errors"

export class TripsService {
  private prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  async getFilteredTrips(query: {
    categoryParam?: string
    searchParam?: string
    minPriceParam?: string
    maxPriceParam?: string
    page: number
    limit: number
    sortParam?: string
  }) {
    const {
      categoryParam,
      searchParam,
      minPriceParam,
      maxPriceParam,
      page,
      limit,
      sortParam
    } = query
    const isValidCategory =
      categoryParam &&
      Object.values(TripCategory).includes(
        categoryParam.toUpperCase() as TripCategory
      )
    const whereClause: Prisma.TripWhereInput = {}
    if (isValidCategory) {
      whereClause.category =
        categoryParam.toUpperCase() as TripCategory
    }
    whereClause.start_date = {
      gte: new Date()
    }
    if (searchParam) {
      whereClause.country_code = {
        contains: searchParam.toLowerCase()
      }
    }
    if (minPriceParam || maxPriceParam) {
      const min = minPriceParam ? Number(minPriceParam) : NaN
      const max = maxPriceParam ? Number(maxPriceParam) : NaN
      const ABSOLUTE_MAX_PRICE = 100000
      whereClause.price = {}
      if (!isNaN(min) && min >= 0 && min <= ABSOLUTE_MAX_PRICE) {
        whereClause.price.gte = min
      }
      if (!isNaN(max) && max >= 0 && max <= ABSOLUTE_MAX_PRICE) {
        if (isNaN(min) || max >= min) {
          whereClause.price.lte = max
        }
      }
    }
    let orderByClause: Prisma.TripOrderByWithRelationInput = {
      createdAt: "desc"
    }
    if (sortParam === "newest") {
      orderByClause = { createdAt: "desc" }
    } else {
      orderByClause = { price: sortParam as "desc" | "asc" }
    }
    const [trips, total] = await Promise.all([
      this.prisma.trip.findMany({
        where: whereClause,
        include: {
          images: true
        },
        orderBy: orderByClause,
        take: limit,
        skip: (page - 1) * limit
      }),
      this.prisma.trip.count({ where: whereClause })
    ])
    const formattedTrips = trips.map((trip) => ({
      ...trip,
      price: Number(trip.price)
    }))
    return {
      formattedTrips,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }

  async findSpecificTrip(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: Number(tripId) },
      include: {
        images: true
      }
    })
    if (!trip) {
      throw new NotFoundError("Trip not found!")
    }
    return trip
  }
}
