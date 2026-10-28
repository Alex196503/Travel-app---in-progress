import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeHTTPRequest } from "~/utils/node-utils"
import { app } from "~/server/server"
import {
  type NextFunction,
  type Request,
  type Response
} from "express"
import {
  fakeClosedTicket,
  fakeCreatedTicket,
  mockTickets,
  type TestApiResponse
} from "~/tests/test-mocks/user-data-mocks"

const { mockGetTicketsForAdmin, mockCreateTicket, mockCloseTicket } =
  vi.hoisted(() => ({
    mockGetTicketsForAdmin: vi.fn(),
    mockCreateTicket: vi.fn(),
    mockCloseTicket: vi.fn()
  }))

vi.mock("~/server/TicketManagementService", () => {
  return {
    TicketManagementService: class {
      getTicketsForAdmin = mockGetTicketsForAdmin
      createTicket = mockCreateTicket
      closeTicket = mockCloseTicket
    }
  }
})

vi.mock("~/middleware/authMiddleware", () => ({
  authentificationMiddleware: (
    req: unknown,
    res: Response,
    next: NextFunction
  ) => {
    ;(req as { user?: { id: number } }).user = { id: 1 }
    next()
  }
}))

describe("test suite validating the /GET  admin tickets method", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 403 Forbidden when user is not an admin", async () => {
    const { ForbiddenError } =
      await import("~/server/auth/custom-errors")
    vi.mocked(mockGetTicketsForAdmin).mockRejectedValueOnce(
      new ForbiddenError("Access denied. Admin rights required.")
    )
    const response = await makeHTTPRequest(
      app,
      "GET",
      "/api/tickets/admin"
    )
    const body = response.body as TestApiResponse
    expect(response.status).toBe(403)
    expect(body.success).toBeFalsy()
    expect(body.message).toContain("Admin rights required")
    expect(mockGetTicketsForAdmin).toHaveBeenCalledWith(1)
  })

  it("should return 200 and tickets list when user is a valid admin", async () => {
    vi.mocked(mockGetTicketsForAdmin).mockResolvedValueOnce(
      mockTickets
    )

    const response = await makeHTTPRequest(
      app,
      "GET",
      "/api/tickets/admin"
    )
    const body = response.body as TestApiResponse
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.tickets).toEqual(mockTickets)
    expect(mockGetTicketsForAdmin).toHaveBeenCalledWith(1)
  })
})

describe("testing tickets /POST method", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it("should return HTTP code 400 when subject is missing and not call the service method", async () => {
    const response = await makeHTTPRequest(
      app,
      "POST",
      "/api/tickets",
      { subject: "" }
    )
    const body = response.body as TestApiResponse
    expect(response.status).toEqual(400)
    expect(body.success).toBeFalsy()
    expect(body.message).toBe("Subject is required")
    expect(mockCreateTicket).not.toHaveBeenCalled()
  })
  it("should successfully create a ticket and return 201 HTTP code", async () => {
    vi.mocked(mockCreateTicket).mockResolvedValueOnce(
      fakeCreatedTicket
    )
    const response = await makeHTTPRequest(
      app,
      "POST",
      "/api/tickets",
      { subject: "Bug in profile page" }
    )
    const body = response.body as TestApiResponse
    expect(response.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.message).toBe("Ticket created successfully")
    expect(body.ticket).toMatchObject({
      id: 10,
      subject: "Bug in profile page",
      status: "OPEN"
    })
    expect(mockCreateTicket).toHaveBeenCalledWith(
      1,
      "Bug in profile page"
    )
  })
})

  describe("test suite validating the closing ticket method", async () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("should return 400 HTTP status code when ticket ID is invalid and not call the service method", async () => {
      const response = await makeHTTPRequest(
        app,
        "PATCH",
        "/api/tickets/abc/close"
      )
      const body = response.body as TestApiResponse
      expect(response.status).toEqual(400)
      expect(body.success).toBeFalsy()
      expect(body.message).toBe("Invalid ticket ID")
      expect(mockCloseTicket).not.toHaveBeenCalled()
    })

    it("should successfully close a ticket and return 200 OK when ID is valid", async () => {
      vi.mocked(mockCloseTicket).mockResolvedValueOnce(
        fakeClosedTicket
      )
      const response = await makeHTTPRequest(
        app,
        "PATCH",
        "/api/tickets/5/close"
      )
      const body = response.body as TestApiResponse
      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.ticket).toMatchObject({
        id: 5,
        status: "RESOLVED"
      })
      expect(mockCloseTicket).toHaveBeenCalledWith(1, 5)
    })

    it("should return 404 Not Found when the ticket does not exist or user lacks permission", async () => {
      const { NotFoundError } =
        await import("~/server/auth/custom-errors")
      vi.mocked(mockCloseTicket).mockRejectedValueOnce(
        new NotFoundError("Ticket not found")
      )
      const response = await makeHTTPRequest(
        app,
        "PATCH",
        "/api/tickets/999/close"
      )
      const body = response.body as TestApiResponse
      expect(response.status).toBe(404)
      expect(body.success).toBeFalsy()
      expect(body.message).toContain("Ticket not found")
      expect(mockCloseTicket).toHaveBeenCalledWith(1, 999)
    })

    it("should handle concurrent requests gracefully without crashing or duplicating state", async () => {
      const { Conflict } = await import("~/server/auth/custom-errors")
      mockCloseTicket
        .mockResolvedValueOnce({
          id: 5,
          status: "RESOLVED",
          success: true
        })
        .mockRejectedValueOnce(
          new Conflict("Ticket is already closed")
        )
        .mockRejectedValueOnce(
          new Conflict("Ticket is already closed")
        )
      const requests = [
        makeHTTPRequest(app, "PATCH", "/api/tickets/5/close"),
        makeHTTPRequest(app, "PATCH", "/api/tickets/5/close"),
        makeHTTPRequest(app, "PATCH", "/api/tickets/5/close")
      ]
      const results = await Promise.all(requests)
      const statuses = results.map((result) => result.status)
      const messages = results.map((result) => {
        let body = result.body as TestApiResponse
        return body.success
      })
      expect(statuses).toContain(200)
      expect(
        statuses.filter((status) => status === 409)
      ).toHaveLength(2)
      expect(messages).toContain(true)
      expect(
        messages.filter((message) => message === false)
      ).toHaveLength(2)
    })
  })
