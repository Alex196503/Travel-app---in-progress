import { Link } from "react-router"
import { MultiLineComment } from "~/routes/review-page/local_components/MultiLineComment"
import { useState } from "react"
import axios from "axios"
import { api } from "~/axios/axios"
import { replySchema } from "~/utils/validation/zod-validation"
import { type Review, type ReviewReply } from "~/types/feature-types"
import { ReplyList } from "./RepliesList"

const updateReplyTree = (
  replies: ReviewReply[],
  replyId: number,
  comment: string
): ReviewReply[] =>
  replies.map((reply) =>
    reply.id === replyId
      ? { ...reply, comment }
      : {
          ...reply,
          replies: updateReplyTree(
            reply.replies ?? [],
            replyId,
            comment
          )
        }
  )

const removeReplyTree = (
  replies: ReviewReply[],
  replyId: number
): ReviewReply[] =>
  replies
    .filter((reply) => reply.id !== replyId)
    .map((reply) => ({
      ...reply,
      replies: removeReplyTree(reply.replies ?? [], replyId)
    }))

export const ReviewCard = ({
  review,
  canDelete,
  onDelete,
  setReviews,
  avatar,
  canEdit,
  tripId,
  currentUserId,
  setOpenReplyForm,
  openReplyForm
}: {
  review: Review
  canDelete: boolean
  canEdit: boolean
  avatar: string | undefined
  tripId?: number
  currentUserId: number | null
  onDelete: <
    T extends {
      id: number
    }
  >(
    id: number,
    setReviews: React.Dispatch<React.SetStateAction<T[]>>
  ) => Promise<void>
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>
  openReplyForm: number | null
  setOpenReplyForm: React.Dispatch<
    React.SetStateAction<number | null>
  >
}) => {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeReplyToId, setActiveReplyToId] = useState<
    number | null
  >(null)
  const [activeReplyToName, setActiveReplyToName] = useState<
    string | null
  >(null)
  const handleReplySubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const form = event.currentTarget
    const formData = new FormData(event.currentTarget)
    const result = replySchema.safeParse({
      reviewId: formData.get("reviewId"),
      comment: formData.get(`reply-${review.id}`),
      replyToId: activeReplyToId
    })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid reply.")
      return
    }
    setIsSubmitting(true)
    try {
      const response = await api.post<{
        success: boolean
        message: string
      }>(`replies/create/trips/${tripId}`, {
        ...result.data
      })
      form.reset()
      setSuccess(response.data.message)
      setOpenReplyForm(null)
      setActiveReplyToId(null)
      setActiveReplyToName(null)
    } catch (error) {
      setError(
        axios.isAxiosError(error)
          ? (error.response?.data?.message ?? "Could not send reply.")
          : "An unexpected error occurred."
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="flex flex-col gap-4">
      {" "}
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
            className="shrink-0 mt-2.5 text-sm tracking-wide text-amber-500"
            aria-label={`${review.rating} out of 5 stars`}
          >
            {"★".repeat(review.rating)}
          </span>
        </div>
        <section className="mt-4 flex flex-col items-center gap-2">
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {review.comment}
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setSuccess(null)
              setActiveReplyToId(null)
              setActiveReplyToName(null)
              setOpenReplyForm(
                openReplyForm === review.id ? null : review.id
              )
            }}
            className="mt-3 cursor-pointer rounded-md border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            {openReplyForm === review.id ? "Close reply" : "Reply"}
          </button>
        </section>
        {review.replies && review.replies.length > 0 && (
          <section
            aria-label={`Replies to ${review.name}'s review`}
            className="mt-4 border-l-2 border-emerald-200 pl-4 dark:border-emerald-800"
          >
            <ReplyList
              replies={review.replies}
              currentUserId={currentUserId}
              onReplyUpdated={(replyId, comment) => {
                setReviews((currentReviews) =>
                  currentReviews.map((currentReview) =>
                    currentReview.id === review.id
                      ? {
                          ...currentReview,
                          replies: updateReplyTree(
                            currentReview.replies ?? [],
                            replyId,
                            comment
                          )
                        }
                      : currentReview
                  )
                )
              }}
              onReplyDeleted={(replyId) => {
                setReviews((currentReviews) =>
                  currentReviews.map((currentReview) =>
                    currentReview.id === review.id
                      ? {
                          ...currentReview,
                          replies: removeReplyTree(
                            currentReview.replies ?? [],
                            replyId
                          )
                        }
                      : currentReview
                  )
                )
              }}
              onReply={(reply) => {
                setError(null)
                setSuccess(null)
                setActiveReplyToId(reply.id)
                setActiveReplyToName(reply.name)
                setOpenReplyForm(review.id)
              }}
            />
          </section>
        )}
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
      {success && (
        <p
          role="status"
          className="text-sm font-medium text-emerald-700 dark:text-emerald-300"
        >
          {success}
        </p>
      )}
      {openReplyForm === review.id && (
        <form
          method="post"
          onSubmit={handleReplySubmit}
          className="mt-4 w-full space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700"
        >
          <input type="hidden" name="reviewId" value={review.id} />
          <label
            htmlFor={`reply-${review.id}`}
            className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200"
          >
            {activeReplyToName
              ? `Reply to ${activeReplyToName}`
              : `Reply to ${review.name}`}
          </label>

          <MultiLineComment
            name={`reply-${review.id}`}
            rows={3}
            minLength={1}
            maxLength={1000}
            placeholder="Write your reply here..."
          />

          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setOpenReplyForm(null)
                setError(null)
                setSuccess(null)
                setActiveReplyToId(null)
                setActiveReplyToName(null)
              }}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Submit Reply"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
