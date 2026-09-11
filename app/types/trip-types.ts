type TripImage = {
  id: number
  trip_id: number
  url: string
  is_cover: boolean
}

type TripCategory =
  "Mountain" | "Beach" | "City Break" | "Adventure" | "Cultural"

export type TripWithImages = {
  id: number
  title: string
  country_code: string
  price: number | string
  total_seats: number
  available_seats: number
  category: TripCategory
  description: string
  start_date: Date
  end_date: Date
  createdAt?: Date
  updatedAt?: Date
  images: TripImage[]
}

export type TripsResponse = TripWithImages[]
