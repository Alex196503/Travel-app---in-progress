import express, { type Application, type NextFunction } from "express"
import process from "process"
import { WebSocketServer, WebSocket as WSClient } from "ws"
import cors from "cors"
import http from "http"
import {
  JSONMessageFormatter,
  JSONMessageParser,
  wsManager,
  type IWSManager,
  type MessageFormatter,
  type MessageParser
} from "~/socket-events/WSManager"
import { AuthRouter } from "~/express-router/auth/AuthRouter"
import cookieParser from "cookie-parser"
import {
  globalErrorHandler,
  routeNotFoundHandler
} from "~/utils/node-utils"
import type { AuthenticatedUser } from "~/types/auth-types"
import { VerificationRouter } from "~/express-router/auth/VerificationRouter"
import { PasswordRouter } from "~/express-router/auth/PasswordRouter"
import { ProfileRouter } from "~/express-router/ProfileRouter"
import { TripRouter } from "~/express-router/TripRouter"
import { BookingRouter } from "~/express-router/BookingRouter"
import "../node-services/cron-job-trips"
import {
  PaymentRouter,
  webhookHandler
} from "~/express-router/PaymentRouter"
import { NotificationRouter } from "~/express-router/NotificationRouter"
import { ReviewRouter } from "~/express-router/ReviewRouter"
import { ReplyRouter } from "~/express-router/ReplyRouter"
import { createWebSocketHandler } from "~/express-router/WSRouter"
import { idSchema } from "~/utils/validation/zod-validation"
import {
  JwtTokenService,
  type TokenService
} from "./auth/AuthService"
import { TicketRouter } from "~/express-router/TicketRouter"
import type {
  AuthPayload,
  WSIncomingMessage
} from "~/types/feature-types"
import { PromptRouter } from "~/express-router/PromptRouter"

const jsonMessageFormatter = new JSONMessageFormatter()
const handleWebSocketMessage = createWebSocketHandler(
  jsonMessageFormatter,
  wsManager
)

export const app =express()

//Singleton pattern for server instance
class Server {
  private app: Application
  private port: number
  private server: http.Server
  private wss: WebSocketServer | null
  private wsManager: IWSManager
  private messageFormatter: MessageFormatter
  private messageParser: MessageParser
  private tokenService: TokenService
  constructor(
    app: Application,
    server: http.Server,
    wss: WebSocketServer | null,
    wsManager: IWSManager,
    messageFormatter: MessageFormatter,
    messageParser: MessageParser,
    tokenService: TokenService,
    port?: number
  ) {
    this.app = app
    this.server = server
    this.wss = wss
    this.port = port || Number(process.env.PORT) || 5000
    this.wsManager = wsManager
    this.messageFormatter = messageFormatter
    this.messageParser = messageParser
    this.tokenService = tokenService
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
    this.manageWebSocketConnection()
    this.server.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`)
    })
  }
  public manageWebSocketConnection(): void {
    console.log("Managing WebSocket connection...")
    if (this.wss) {
      this.wss.on("connection", (ws) => {
        let userId: number | null = null
        const authTimeout = setTimeout(() => {
          ws.close(1008, "Authentication timeout")
        }, 5000) // 5 seconds timeout for authentication
        ws.on("message", (chunk: unknown) => {
          if (chunk) {
            if (userId === null) {
              try {
                const message = this.messageParser.parseMessage(
                  chunk
                ) as WSIncomingMessage<AuthPayload>
                if (
                  message.event !== "authenticate" ||
                  typeof message.data?.token !== "string"
                ) {
                  ws.close(1008, "Authenticate first")
                  return
                }

                const decoded = this.tokenService.verifyToken(
                  message.data.token
                )
                const parsedUserId = idSchema.safeParse(decoded.id)

                if (!parsedUserId.success) {
                  ws.close(1008, "Invalid credentials")
                  return
                }

                userId = parsedUserId.data
                clearTimeout(authTimeout)
                ws.send(
                  this.messageFormatter.formatMessage("authenticated")
                )
                return
              } catch {
                ws.close(1008, "Invalid authentication message")
                return
              }
            }
            handleWebSocketMessage(ws, chunk.toString(), userId)
          }
        })
        ws.on("close", () => {
          this.wsManager.removeAllUsersFromRoom(ws)
          console.log("WebSocket connection closed.")
        })
      })
    }
  }
}
const serverInstance = http.createServer(app)
const wssInstance = new WebSocketServer({ server: serverInstance })
const port = Number(process.env.PORT) || 5000
const messageParser = new JSONMessageParser()
const jwtTokenService = new JwtTokenService()
let server = new Server(
  app,
  serverInstance,
  wssInstance,
  wsManager,
  jsonMessageFormatter,
  messageParser,
  jwtTokenService,
  port
)

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
server.addRouter("/api/prompt", PromptRouter)
server.addRouter("/api/trips", TripRouter)
server.addRouter("/api/bookings", BookingRouter)
server.addRouter("/api/profile", ProfileRouter)
server.addRouter("/api/payments", PaymentRouter)
server.addRouter("/api/notifications", NotificationRouter)
server.addRouter("/api/reviews", ReviewRouter)
server.addRouter("/api/replies", ReplyRouter)
server.addRouter("/api/tickets", TicketRouter)
server.useMiddleware(routeNotFoundHandler)
server.addMiddlewareError(globalErrorHandler)

if (process.env.NODE_ENV !== "test") {
  server.start()
}

//TypeScript Declaration Merging: Extends the global Express Request interface to include an optional 'user' property, allowing authenticated user data to be safely attached to requests across the app.
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}
