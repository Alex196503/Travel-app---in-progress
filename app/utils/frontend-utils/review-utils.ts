//File that contains some boilerplate functions used to mutate the reviews that belong to a user.

import axios from "axios"
import { toast } from "react-toastify"
import { api } from "~/axios/axios"

export const onDeleteReview = async <T extends { id: number }>(
  id: number,
  setReviews: React.Dispatch<React.SetStateAction<T[]>>
) => {
  try {
    const confirmed = window.confirm(
      `Are you sure that you want to delete this review with the id of ${id}?`
    )
    if (!confirmed) return

    const res = await api.delete<{
      success: boolean
      message: string
    }>(`/reviews/${id}`)
    if (res.data.success) {
      setReviews((prevReviews) =>
        prevReviews.filter((review) => review.id !== id)
      )
      toast.success(
        res.data.message ||
          `Review with the id ${id} deleted succesfully!`
      )
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        error.response?.data?.message || "Failed to delete review"
      )
    } else {
      console.error("Failed to delete review", error)
    }
  }
}
