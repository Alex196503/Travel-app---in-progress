import {
  PrismaClient,
  TripCategory
} from "../generated/prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: "",
  database: process.env.DB_NAME
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  const notificationsData = [
    {
      user_id: 1,
      message:
        "We are thrilled to have you here. Start by planning your very first trip!",
      type: "WELCOME",
      was_read: false,
      trip_id: null
    },
    {
      user_id: 1,
      message:
        "You can add trips, check out the interface, and receive live notifications via SSE.",
      type: "INFO",
      was_read: false,
      trip_id: null
    }
  ]

  const tripsData = [
    {
      title: "Apuseni Mountains Hiking Adventure",
      country_code: "RO",
      price: 1200.5,
      total_seats: 15,
      available_seats: 10,
      category: TripCategory.MOUNTAIN,
      description:
        "Explore breathtaking caves, dense forests, and scenic mountain trails during a week-long unforgettable outdoor expedition.",
      start_date: new Date("2026-09-01T09:00:00Z"),
      end_date: new Date("2026-09-07T18:00:00Z"),
      images: [
        {
          url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
          is_cover: true
        },
        {
          url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
          is_cover: false
        },
        {
          url: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
          is_cover: false
        },
        {
          url: "https://images.unsplash.com/photo-1426604966848-d7adac902bff",
          is_cover: false
        }
      ]
    },
    {
      title: "Alpine Adventure in Austria",
      category: TripCategory.MOUNTAIN,
      country_code: "AT",
      total_seats: 12,
      available_seats: 5,
      description:
        "An unforgettable experience on the scenic mountain trails of the Alps, featuring breathtaking landscapes and traditional cozy accommodation.",
      start_date: new Date("2026-09-01"),
      end_date: new Date("2026-09-07"),
      price: 850.0,
      images: [
        {
          url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
          is_cover: true
        },
        {
          url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
          is_cover: false
        }
      ]
    },
    {
      title: "Roman Holiday City Break",
      country_code: "IT",
      price: 2450.0,
      total_seats: 20,
      available_seats: 4,
      category: TripCategory.CITY_BREAK,
      description:
        "Discover ancient history, walk through the magnificent Colosseum, and taste authentic Italian cuisine in the heart of Rome.",
      start_date: new Date("2026-10-10T10:00:00Z"),
      end_date: new Date("2026-10-13T20:00:00Z"),
      images: [
        {
          url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5",
          is_cover: true
        },
        {
          url: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b",
          is_cover: false
        },
        {
          url: "https://images.unsplash.com/photo-1525874684015-58379d421a52",
          is_cover: false
        },
        {
          url: "https://images.unsplash.com/photo-1531572753322-ad063cecc140",
          is_cover: false
        }
      ]
    },
    {
      title: "Greek Island Beach Paradise",
      country_code: "GR",
      price: 3100.0,
      total_seats: 30,
      available_seats: 12,
      category: TripCategory.BEACH,
      description:
        "Enjoy golden sand beaches, crystal clear turquoise waters, and relaxing sunny days in Lefkada.",
      start_date: new Date("2026-07-01T08:00:00Z"),
      end_date: new Date("2026-07-08T18:00:00Z"),
      images: [
        {
          url: "https://images.unsplash.com/photo-1533105079780-92b9be482077",
          is_cover: true
        },
        {
          url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
          is_cover: false
        },
        {
          url: "https://images.unsplash.com/photo-1519046904884-53103b34b206",
          is_cover: false
        },
        {
          url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62",
          is_cover: false
        }
      ]
    }
  ]

  await Promise.all([
    ...tripsData.map((trip) =>
      prisma.trip.create({
        data: {
          title: trip.title,
          country_code: trip.country_code,
          price: trip.price,
          total_seats: trip.total_seats,
          available_seats: trip.available_seats,
          category: trip.category,
          description: trip.description,
          start_date: trip.start_date,
          end_date: trip.end_date,
          images: {
            create: trip.images
          }
        }
      })
    ),

    ...notificationsData.map((notification) =>
      prisma.notifications.create({
        data: {
          type: notification.type,
          trip_id: notification.trip_id,
          user_id: notification.user_id,
          message: notification.message,
          was_read: notification.was_read
        }
      })
    )
  ])
}
main()
  .catch((err) => {
    if (err instanceof Error) {
      console.error(
        `Something bad happened while data was seeding... ${err}`
      )
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
