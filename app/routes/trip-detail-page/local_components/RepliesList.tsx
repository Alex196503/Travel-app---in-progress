import { type ReviewReply } from "~/types/feature-types"
import { useState } from "react"
import axios from "axios"
import { api } from "~/axios/axios"
import { replyUpdateSchema } from "~/utils/validation/zod-validation"

const ReplyItem = ({
  reply,
  onReply,
  onReplyUpdated,
  onReplyDeleted,
  currentUserId,
  depth
}: {
  reply: ReviewReply
  onReply: (reply: ReviewReply) => void
  onReplyUpdated: (replyId: number, comment: string) => void
  onReplyDeleted: (replyId: number) => void
  currentUserId: number | null
  depth: number
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [comment, setComment] = useState(reply.comment)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const saveReply = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setError(null)
    const result = replyUpdateSchema.safeParse({ comment })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid reply.")
      return
    }

    setIsSaving(true)
    try {
      await api.put(`/replies/${reply.id}`, result.data)
      onReplyUpdated(reply.id, result.data.comment)
      setComment(result.data.comment)
      setIsEditing(false)
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError)
          ? (requestError.response?.data?.message ??
              "Could not update reply.")
          : "An unexpected error occurred."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const deleteReply = async () => {
    const confirmed = window.confirm(
      "Delete this reply? Any replies beneath it will also be deleted."
    )
    if (!confirmed) return

    setError(null)
    setIsDeleting(true)
    try {
      await api.delete(`/replies/${reply.id}`)
      onReplyDeleted(reply.id)
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError)
          ? (requestError.response?.data?.message ??
              "Could not delete reply.")
          : "An unexpected error occurred."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <article className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/60">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {reply.name}
        </p>
        <time className="text-xs text-zinc-500 dark:text-zinc-400">
          {reply.date}
        </time>
      </div>

      {isEditing ? (
        <form onSubmit={saveReply} className="mt-2 space-y-2">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={5000}
            required
            className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            aria-label="Edit reply"
          />
          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setComment(reply.comment)
                setError(null)
                setIsEditing(false)
              }}
              className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-emerald-700 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {comment}
          </p>
          <div className="flex gap-3">
            {currentUserId === reply.userId && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-2 text-xs font-semibold text-zinc-600 hover:underline dark:text-zinc-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={deleteReply}
                  disabled={isDeleting}
                  className="mt-2 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </>
            )}
            {depth < 2 && (
              <button
                type="button"
                onClick={() => onReply(reply)}
                className="mt-2 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
              >
                Reply to {reply.name}
              </button>
            )}
          </div>
        </>
      )}

      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-3 border-l-2 border-emerald-200 pl-3 dark:border-emerald-800">
          <ReplyList
            replies={reply.replies}
            onReply={onReply}
            onReplyUpdated={onReplyUpdated}
            onReplyDeleted={onReplyDeleted}
            currentUserId={currentUserId}
            depth={depth + 1}
          />
        </div>
      )}
    </article>
  )
}

export const ReplyList = ({
  replies,
  onReply,
  onReplyUpdated,
  onReplyDeleted,
  currentUserId,
  depth = 0
}: {
  replies: ReviewReply[]
  onReply: (reply: ReviewReply) => void
  onReplyUpdated: (replyId: number, comment: string) => void
  onReplyDeleted: (replyId: number) => void
  currentUserId: number | null
  depth?: number
}) => (
  <div className="space-y-3">
    {replies.map((reply) => (
      <ReplyItem
        key={reply.id}
        reply={reply}
        onReply={onReply}
        onReplyUpdated={onReplyUpdated}
        onReplyDeleted={onReplyDeleted}
        currentUserId={currentUserId}
        depth={depth}
      />
    ))}
  </div>
)
