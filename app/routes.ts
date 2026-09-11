import {
  type RouteConfig,
  index,
  route
} from "@react-router/dev/routes"

export default [
  index("routes/home/index.tsx"),
  route("countries", "routes/api/index.tsx"),
  route("country/:code", "routes/api-detail-page/index.tsx"),
  route("register", "routes/register/index.tsx"),
  route("login", "routes/login/index.tsx"),
  route("/verify-email", "routes/verify-email/index.tsx"),
  route("/forgot-password", "routes/forgot-password-page/index.tsx"),
  route("/reset-password", "routes/reset-password-page/index.tsx"),
  route("/edit-profile", "routes/edit-profile/index.tsx"),
  route("/trips", "routes/trip-page/index.tsx"),
  route("/trips/:id", "routes/trip-detail-page/index.tsx"),
  route("/checkout/cancel", "routes/cancel-payment/index.tsx"),
  route("/checkout/success", "routes/success-payment/index.tsx"),
  route("/trips/:id/reviews/form", "routes/review-page/index.tsx"),
  route("*", "routes/not-found-page/index.tsx")
] satisfies RouteConfig
