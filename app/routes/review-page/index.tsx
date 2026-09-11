import { getMeta } from "~/helpers/helpers"
import type { Route } from "./+types"
import { api } from "~/axios/axios"
import {
  Form,
  redirect,
  useLoaderData,
  useNavigation,
  useSearchParams
} from "react-router"
import axios, { type AxiosResponse } from "axios"
import { useState } from "react"
import { StarComponent } from "./local_components/StarComponent"
import { MultiLineComment } from "./local_components/MultiLineComment"
import type { ReviewApiResponse } from "~/types/feature-types"
import { requireAuthOnServer } from "~/utils/frontend-utils/auth-guards"

export const meta = () =>
  getMeta(
    "Review page",
    "Create a new review for your booking to a specific trip"
  )

export async function action({ request, params }: Route.ActionArgs) {
  const tripId = params.id
  const url = new URL(request.url)
  const isEditing = url.searchParams.get("edit") === "true"
  const reviewId = url.searchParams.get("reviewId")
  const formData = await request.formData()
  const rating = formData.get("rating")
  const comment = formData.get("comment")

  try {
    let res: AxiosResponse<ReviewApiResponse>
    if (isEditing) {
      res = await api.patch<{ success: boolean; message: string }>(
        `/reviews/${reviewId}`,
        {
          rating: Number(rating),
          comment: String(comment)
        }
      )
    } else {
      res = await api.post<{ success: boolean; message: string }>(
        `/reviews`,
        {
          trip_id: Number(tripId),
          rating: Number(rating),
          comment: String(comment)
        }
      )
    }
    if (res.data.success) {
      return redirect(`/trips/${tripId}`)
    }
    return { error: "Failed to create review!" }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        error:
          error.response?.data?.message || "Failed to create review"
      }
    }
    return { error: "An unexpected error occurred" }
  }
}

export async function loader({ params, request }: Route.LoaderArgs) {
  requireAuthOnServer(request)
  const url = new URL(request.url)
  const isEditing = url.searchParams.get("edit") === "true"
  const reviewId = url.searchParams.get("reviewId")
  if (!isEditing || !reviewId) {
    return { review: null }
  }
  try {
    const cookieHeader = request.headers.get("cookie")
    const response = await api.get<{
      success: boolean
      message?: string
      review?: {
        id: number
        rating: number
        comment: string
        trip_id: number
        booking_id: number
        created_at: Date
      }
    }>(`/reviews/${reviewId}`, {
      headers: {
        cookie: cookieHeader || ""
      }
    })

    return {
      review: response.data.review
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Response(
        error.response?.data?.message || "Failed to fetch reviews",
        { status: error.response?.status || 500 }
      )
    }

    throw new Response("Failed to fetch reviews", { status: 500 })
  }
}

export default function ReviewPage({
  actionData
}: Route.ComponentProps) {
  const { review } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  const data = actionData as { error?: string } | undefined
  const [rating, setRating] = useState(review?.rating || 0)
  const [hover, setHover] = useState(0)
  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      {data?.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">
          {data.error}
        </div>
      )}
      <Form method="post" className="space-y-4">
        <section className="flex items-center gap-4">
          <label className="block text-sm font-medium mb-1">
            Rating
          </label>
          <input
            type="hidden"
            value={rating}
            name="rating"
            id="rating"
          />
          {[1, 2, 3, 4, 5].map((star) => (
            <StarComponent
              key={star}
              star={star}
              rating={rating}
              hover={hover}
              setRating={setRating}
              setHover={setHover}
            />
          ))}
        </section>
        <section className="flex flex-col gap-1">
          <label
            htmlFor="comment"
            className="block text-sm font-medium mb-1"
          >
            Comment
          </label>
          <MultiLineComment
            name="comment"
            rows={4}
            defaultValue={review?.comment || ""}
          />
        </section>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </Form>
    </main>
  )
}
