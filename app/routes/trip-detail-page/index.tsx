import { getMeta } from "~/helpers/helpers"
import type { Route } from "./+types"
import {
  calculateDuration,
  getCountryName
} from "~/utils/frontend-utils/trip-utils"
import { requireAuthOnServer } from "~/utils/frontend-utils/auth-guards"
import { api } from "~/axios/axios"
import axios from "axios"
import { Link, useLoaderData, useParams } from "react-router"
import type {
  ReviewsResponse,
  UserBookingRow
} from "~/types/feature-types"
import { type TripWithImages } from "~/types/trip-types"
import React, { useEffect, useState } from "react"
import { LightboxContainer } from "./local_components/LightboxContainer"
import { BookingConfirmationModal } from "../trip-page/local_components/BookingConfirmationModal"
import { toast, ToastContainer } from "react-toastify"
import { useModalBooking } from "~/custom-hooks/context-hooks"
import { useUserBookings } from "~/custom-hooks/user-hooks"
import { useAuth } from "~/custom-hooks/auth-hooks"
import BookingCartModal from "../trip-page/local_components/BookingCartModal"
import { ReviewCard } from "./local_components/ReviewCard"
import {
  type Review,
  type ReviewReply
} from "~/types/feature-types"
import { onDeleteReview } from "~/utils/frontend-utils/review-utils"

type ReplyApiNode = {
  id: number
  comment: string
  createdAt: string | Date
  user: { id: number; name: string }
  replies: ReplyApiNode[]
}

const mapReplyNodes = (replies: ReplyApiNode[]): ReviewReply[] =>
  replies.map((reply) => ({
    id: reply.id,
    userId: reply.user.id,
    name: reply.user.name,
    date: new Date(reply.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }),
    comment: reply.comment,
    replies: mapReplyNodes(reply.replies)
  }))

export const meta = () =>
  getMeta(
    "Trip details page",
    "Check some information about a specific trip"
  )

export async function loader({ params, request }: Route.LoaderArgs) {
  requireAuthOnServer(request)
  try {
    const tripID = params.id || ""
    if (!tripID) {
      throw new Response("Trip ID not provided", { status: 400 })
    }
    const cookieHeaders = request.headers.get("cookie") || ""
    const [tripResponse, reviewsResponse] = await Promise.all([
      api.get<{
        trip: TripWithImages
        message: string
      }>(`/trips/${tripID}`, {
        headers: { cookie: cookieHeaders }
      }),
      api.get<ReviewsResponse>(`/reviews/trip/${tripID}`, {
        headers: { cookie: cookieHeaders }
      })
    ])

    const reviews: Review[] = await Promise.all(
      reviewsResponse.data.reviews.map(async (review) => {
        const repliesResponse = await api.get<{
          success: boolean
          replies: ReplyApiNode[]
        }>(`/profile/reply/trips/${tripID}/reviews/${review.id}`, {
          headers: { cookie: cookieHeaders }
        })

        return {
          id: review.id,
          userId: review.user.id,
          name: review.user.name,
          date: new Date(review.created_at).toLocaleDateString(
            "en-US",
            { year: "numeric", month: "long", day: "numeric" }
          ),
          rating: review.rating,
          comment: review.comment,
          replies: mapReplyNodes(repliesResponse.data.replies)
        }
      })
    )

    return {
      trip: tripResponse.data.trip,
      reviews,
      averageRating: reviewsResponse.data.averageRating
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500
      const message =
        error.response?.data?.message ||
        "Failed to fetch sepcific trip"
      throw new Response(message, { status })
    }
    throw new Response("An unexpected error occurred", {
      status: 500
    })
  }
}

export default function TripDetailPage() {
  let { trip, reviews, averageRating } =
    useLoaderData<typeof loader>()

  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [existingReviews, setReviews] = useState(reviews)
  const [isModalOpen, setModalOpen] = useState(false)
  const [previewUrl, setPreviewURL] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false)
  const [currentNumberOfSeats, setCurrentNumberOfSeats] = useState(1)
  const [openReplyForm, setOpenReplyForm] = useState<number | null>(
    null
  )

  const { isModalBookingsOpen, setModalBookingsOpen } =
    useModalBooking()
  const { user } = useAuth()

  const openLightbox = (url: string, index: number) => {
    setActiveImage(url)
    setCurrentIndex(index)
    setIsLightBoxOpen(true)
  }

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!trip.images || trip.images.length === 0) return
    let nextIndex = (currentIndex + 1) % trip.images.length
    setCurrentIndex(nextIndex)
    setPreviewURL(trip?.images[nextIndex].url)
    setActiveImage(trip?.images[nextIndex].url)
  }

  const {
    bookingsCounter,
    bookings,
    isLoading,
    updateBookingStatus
  } = useUserBookings(isModalBookingsOpen)

  const hasAlreadyReviewed = reviews.some(
    (review) => review.userId === user?.id
  )
  const canCreateReview = Boolean(user?.id && !hasAlreadyReviewed)

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!trip.images || trip.images.length <= 0) return
    let prevIndex =
      (currentIndex - 1 + trip.images.length) % trip.images.length
    setCurrentIndex(prevIndex)
    setPreviewURL(trip?.images[prevIndex].url)
    setActiveImage(trip?.images[prevIndex].url)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        {trip.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div
            className="w-full h-[400px] overflow-hidden rounded-2xl shadow-md"
            onClick={() =>
              openLightbox(previewUrl || trip.images[0].url, 0)
            }
          >
            <img
              src={previewUrl || trip.images?.[0].url}
              alt={trip.title}
              className="w-full cursor-pointer h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <section className="grid grid-cols-3 gap-4">
            {trip.images
              ?.slice(0, trip.images.length)
              .map((image, index) => {
                const isCurrentActive =
                  (previewUrl || trip.images[0].url) === image.url
                return (
                  <div
                    key={image.id}
                    className="h-28 rounded-xl shadow-sm"
                  >
                    <img
                      src={image.url}
                      onClick={() => {
                        setActiveImage(image.url)
                        setPreviewURL(image.url)
                        setCurrentIndex(index)
                      }}
                      alt={`Secondary ${image.id + 1}`}
                      className={`w-full h-full cursor-pointer object-cover rounded-xl transition-all duration-200 ${
                        isCurrentActive
                          ? "ring-4 ring-emerald-400"
                          : "hover:opacity-90"
                      }`}
                    />
                  </div>
                )
              })}
          </section>
          <article className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">
              About this experience
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {trip.description}
            </p>
          </article>
          <section className="mt-10 space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">Reviews</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  What travelers say about this experience
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-500">
                    {existingReviews.length > 0
                      ? averageRating
                      : "0.0"}
                  </span>
                  <span className="text-sm font-bold text-gray-500">
                    score
                  </span>
                  <span>({existingReviews.length} reviews)</span>
                </div>
                {canCreateReview && (
                  <Link
                    to={`/trips/${trip.id}/reviews/form`}
                    className="rounded-lg cursor-pointer bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Go to review creation page
                  </Link>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {existingReviews.map((review) => (
                <ReviewCard
                  review={review}
                  key={review.id}
                  avatar={user?.avatar}
                  tripId={trip.id}
                  currentUserId={user?.id ?? null}
                  canDelete={review.userId === user?.id}
                  canEdit={review.userId === user?.id}
                  setReviews={setReviews}
                  onDelete={onDeleteReview}
                  openReplyForm={openReplyForm}
                  setOpenReplyForm={setOpenReplyForm}
                />
              ))}
            </div>
          </section>
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl space-y-6">
            <section className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <span className="text-sm text-zinc-500">
                Price per person
              </span>
              <div>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {trip.price.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR"
                  }) + "€"}
                </span>
                <span className="text-sm text-zinc-500 ml-1">
                  / trip
                </span>
              </div>
            </section>
            <div className="space-y-3 text-sm">
              <section className="flex justify-between">
                <span className="text-zinc-500">Location:</span>
                <span className="font-medium">
                  {getCountryName(trip.country_code)}
                </span>
              </section>
              <section className="flex justify-between">
                <span className="text-zinc-500">Duration:</span>
                <span className="font-medium">
                  {calculateDuration(trip.start_date, trip.end_date)}
                </span>
              </section>
              <section className="flex justify-between">
                <span className="text-zinc-500">Group size:</span>
                <span className="font-medium">
                  Max {trip.available_seats} people
                </span>
              </section>
            </div>
            <button
              disabled={trip.available_seats <= 0}
              onClick={() => setModalOpen(true)}
              className={`w-full py-3 px-4 font-medium rounded-xl shadow-lg transition-all duration-200 ${
                trip.available_seats <= 0
                  ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none line-through"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              }`}
            >
              {trip.available_seats <= 0
                ? "Sold Out"
                : "Book This Trip"}
            </button>

            <Link
              to="/trips"
              className="mt-2 block mx-auto text-center w-full px-5 py-2.5 bg-amber-400 hover:bg-amber-600 cursor-pointer font-bold uppercase text-xs tracking-wider rounded-lg border border-slate-700 transition-all"
            >
              Go back
            </Link>
          </div>
        </div>
      </div>
      {isLightBoxOpen && (
        <LightboxContainer
          setIsLightBoxOpen={setIsLightBoxOpen}
          trip={trip}
          activeImage={activeImage}
          goNext={goNext}
          goPrev={goPrev}
        />
      )}
      {isModalOpen && (
        <BookingConfirmationModal
          id={trip.id}
          price={trip.price}
          setCurrentNumberOfSeats={setCurrentNumberOfSeats}
          setModalOpen={setModalOpen}
          available_seats={trip.available_seats}
          currentNumberOfSeats={currentNumberOfSeats}
        />
      )}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        closeOnClick={true}
      />
      {isModalBookingsOpen && (
        <BookingCartModal
          setModalBookingsOpen={setModalBookingsOpen}
          bookings={bookings}
          isLoading={isLoading}
          bookingCounter={bookingsCounter}
          updateBookingStatus={updateBookingStatus}
        />
      )}
    </main>
  )
}
