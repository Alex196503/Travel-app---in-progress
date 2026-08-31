import express, { type Application, type NextFunction } from "express"
import process from "process"
import cors from "cors"
import { AuthRouter } from "~/express-router/auth/AuthRouter"
import cookieParser from "cookie-parser"
import {
  globalErrorHandler,
  routeNotFoundHandler
} from "~/utils/node-utils"
import type { AuthenticatedUser } from "~/types/types"
import { VerificationRouter } from "~/express-router/auth/VerificationRouter"
import { PasswordRouter } from "~/express-router/auth/PasswordRouter"
import { ProfileRouter } from "~/express-router/ProfileRouter"
import { TripRouter } from "~/express-router/TripRouter"
import { BookingRouter } from "~/express-router/BookingRouter"
import {
  PaymentRouter,
  webhookHandler
} from "~/express-router/PaymentRouter"

//Singleton pattern for server instance
class Server {
  private app: Application
  private port: number
  constructor(port?: number) {
    this.app = express()
    this.port = port || 5000
  }
  public useMiddleware(middleware: express.RequestHandler): void {
    this.app.use(middleware)
  }
  public addWebhookRoute(
    path: string,
    handler: express.RequestHandler
  ) {
    this.app.use(
      path,
      express.raw({ type: "application/json" }),
      handler
    )
  }
  public addMiddlewareError(
    middleware: express.ErrorRequestHandler
  ): void {
    this.app.use(middleware)
  }
  public addRouter(path: string, router: express.Router): void {
    this.app.use(path, router)
  }
  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`)
    })
  }
}

let server = new Server(Number(process.env.PORT) || 5000)
server.useMiddleware(
  cors({
    origin: "http://localhost:3000",
    credentials: true
  })
)
server.addWebhookRoute("/api/payments/webhook", webhookHandler)
server.useMiddleware(express.json())
server.useMiddleware(express.urlencoded({ extended: true }))
server.useMiddleware(cookieParser())

server.addRouter("/api/auth", AuthRouter)
server.addRouter("/api/auth", VerificationRouter)
server.addRouter("/api/auth", PasswordRouter)
server.addRouter("/api/profile", ProfileRouter)
server.addRouter("/api/trips", TripRouter)
server.addRouter("/api/bookings", BookingRouter)
server.addRouter("/api/payments", PaymentRouter)
server.useMiddleware(routeNotFoundHandler)
server.addMiddlewareError(globalErrorHandler)

server.start()

//TypeScript Declaration Merging: Extends the global Express Request interface to include an optional 'user' property, allowing authenticated user data to be safely attached to requests across the app.
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}
