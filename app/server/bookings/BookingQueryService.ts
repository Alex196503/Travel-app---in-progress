import type { UserBookingRow } from "~/types/feature-types"
import { type PrismaClient } from "../../../generated/prisma/client"

// Service dedicated exclusively to read operations (GET) and queries for the Booking entity. It also deals with retrieving statistics (e.g., total bookings count, status distribution, total spent)
export class BookingQueryService {
  private prisma: PrismaClient
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async getBookingsByUserId(userId: number) {
    const bookings = await this.prisma.$queryRaw<
      UserBookingRow[]
    >`SELECT 
                b.id AS booking_id,
                b.seats_booked,
                b.total_price,
                b.status,
                b.createdAt,
                t.available_seats AS available_seats,
                t.id AS trip_id,
                t.title AS trip_title,
                t.price AS trip_price,
                t.start_date,
                t.end_date,
                i.url AS cover_image_url
              FROM bookings b 
              LEFT JOIN trips t ON b.trip_id = t.id 
              LEFT JOIN images i ON t.id = i.trip_id AND i.is_cover = true
              WHERE b.user_id = ${Number(userId)}
              ORDER BY b.createdAt DESC;
          `
    return bookings
  }
}
