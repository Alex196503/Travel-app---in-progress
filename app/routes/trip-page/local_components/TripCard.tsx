import { useState } from "react"
import { Link } from "react-router"
import type { TripWithImages } from "~/types/trip-types"
import { BookingConfirmationModal } from "./BookingConfirmationModal"
export const TripCard = ({
  title,
  category,
  country_code,
  total_seats,
  description,
  start_date,
  end_date,
  available_seats,
  price,
  id,
  images
}: TripWithImages) => {
  const [isModalOpen, setModalOpen] = useState(false)
  const [currentNumberOfSeats, setCurrentNumberOfSeats] = useState(1)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md">
      <section className="relative h-52 w-full bg-slate-200 dark:bg-slate-800">
        {images.map((image) => {
          if (image.is_cover)
            return (
              <img
                key={image.id}
                src={`${image.url}`}
                alt="Trip cover"
                className="w-full h-full object-cover"
                fetchPriority="high"
                loading="eager"
              />
            )
        })}
        <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          {category}
        </span>
        <span className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-lg">
          {country_code}
        </span>
      </section>
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <section>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">
            {title} {`#${id}`}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
            {description}
          </p>
        </section>
        <article className="border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>{`${new Date(start_date).toLocaleDateString("ro-RO")} - ${new Date(end_date).toLocaleDateString("ro-RO")}`}</span>
            <span>
              Available seats : <strong>{available_seats}</strong>
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total seats: {total_seats}</span>
            <span
              className={`${available_seats > 0 ? `text-emerald-600 dark:text-emerald-400` : `text-red-500 dark:text-red-700`}`}
            >
              {available_seats > 0 ? "Available" : "Unavailable"}
            </span>
          </div>
        </article>
        <article className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
          <section className="flex flex-col gap-y-1">
            <span className="text-xs text-slate-400 block">
              Price
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {price.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR"
              })}
            </span>
          </section>

          <section className="flex items-center gap-2">
            <Link
              to={`${id}`}
              className="px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              View Details
            </Link>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={available_seats <= 0}
              className={`px-4 py-2 text-xs font-medium rounded-xl transition-all shadow-sm ${
                available_seats <= 0
                  ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none line-through"
                  : "text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/20 active:scale-95 cursor-pointer"
              }`}
            >
              {available_seats <= 0 ? "Sold Out" : "Book Now"}
            </button>
          </section>
        </article>
      </div>
      {isModalOpen && (
        <BookingConfirmationModal
          id={id}
          price={price}
          setCurrentNumberOfSeats={setCurrentNumberOfSeats}
          setModalOpen={setModalOpen}
          available_seats={available_seats}
          currentNumberOfSeats={currentNumberOfSeats}
        />
      )}
    </div>
  )
}
