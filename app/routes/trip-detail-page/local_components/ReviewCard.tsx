import { Link } from "react-router"

export interface Review {
  id: number
  userId: number
  name: string
  date: string
  rating: number
  comment: string
}

export const ReviewCard = ({
  review,
  canDelete,
  onDelete,
  setReviews,
  avatar,
  canEdit,
  tripId
}: {
  review: Review
  canDelete: boolean
  canEdit: boolean
  avatar: string | undefined
  tripId?: number
  onDelete: <
    T extends {
      id: number
    }
  >(
    id: number,
    setReviews: React.Dispatch<React.SetStateAction<T[]>>
  ) => Promise<void>
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>
}) => {
  return (
    <article
      key={review.id}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-4">
        <section className="flex items-center gap-3">
          <img
            src={avatar || "https://placehold.co/40x40"}
            alt={review.name}
            className="h-10 w-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
          />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {review.name}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {review.date}
          </p>
        </section>
        <span
          className="shrink-0 text-sm tracking-wide text-amber-500"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {"★".repeat(review.rating)}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        {review.comment}
      </p>
      <section className="flex items-center justify-between mt-2">
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(review.id, setReviews)}
            className="cursor-pointer mt-4 text-xs font-semibold text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Delete review
          </button>
        )}
        {canEdit && (
          <Link
            to={`/trips/${tripId}/reviews/form?edit=true&reviewId=${review.id}`}
            type="button"
            className="cursor-pointer mt-4 text-xs font-bold text-orange-400 transition-colors hover:text-orange-200 dark:text-orange-100"
          >
            Edit review
          </Link>
        )}
      </section>
    </article>
  )
}
