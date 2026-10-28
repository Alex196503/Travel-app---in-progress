import { describe, it, vitest, expect, vi, beforeEach } from "vitest"
import { makeHTTPRequest } from "~/utils/node-utils"
import { app } from "~/server/server"
import {
  invalidProfileUpdateMock,
  invalidUserMock,
  mockUpdatedProfileResponse,
  validProfileUpdateMock,
  type MockFileValidationInput,
  type MockUploadRequest,
  type TestApiResponse
} from "~/tests/test-mocks/user-data-mocks"
import type { NextFunction } from "express"

const { mockUpdateProfile } = vi.hoisted(() => ({
  mockUpdateProfile: vi.fn()
}))

vi.mock("../../../server/ProfileService", () => {
  return {
    ProfileService: class {
      updateProfile = mockUpdateProfile
    }
  }
})

vi.mock("../../../utils/validation/zod-validation", async () => {
  const actual = await vi.importActual(
    "../../../utils/validation/zod-validation"
  )
  return {
    ...actual,
    FileValidationSchema: {
      safeParse: vi
        .fn()
        .mockImplementation((file: MockFileValidationInput) => {
          const fileSize = file?.size ?? 0
          if (
            file?.mimetype === "text/plain" ||
            fileSize > 5 * 1024 * 1024
          ) {
            return {
              success: false,
              error: {
                issues: [{ message: "Max file size is 5MB." }],
                flatten: () => ({
                  fieldErrors: {
                    size: ["Max file size is 5MB."]
                  },
                  formErrors: []
                })
              }
            }
          }
          return { success: true }
        })
    }
  }
})

vi.mock("../../../middleware/authMiddleware", () => ({
  authentificationMiddleware: (
    req: unknown,
    res: Response,
    next: NextFunction
  ) => {
    ;(req as { user?: { id: number } }).user = { id: 1 }
    next()
  }
}))

vi.mock("~/utils/node-utils", async () => {
  const actual = await vi.importActual("~/utils/node-utils")
  return {
    ...actual,
    uploadMiddleware: () => ({
      single:
        (fieldName: string) =>
        (req: Request, res: Response, next: NextFunction): void => {
          const uploadReq = req as MockUploadRequest

          if (uploadReq.body?.simulateInvalidFile) {
            uploadReq.file = {
              fieldname: fieldName,
              filename: "file.txt",
              originalname: "text.txt",
              mimetype: "text/plain",
              size: 1024,
              path: "path/to/fake/text.txt"
            }
          } else if (uploadReq.body?.simulateLargeFile) {
            uploadReq.file = {
              fieldname: fieldName,
              originalname: "huge.webp",
              mimetype: "image/webp",
              filename: "huge-123456.webp",
              size: 6 * 1024 * 1024,
              path: "path/to/fake/huge.webp"
            }
          } else if (uploadReq.body?.simulateValidFile) {
            uploadReq.file = {
              fieldname: fieldName,
              originalname: "avatar.webp",
              mimetype: "image/webp",
              filename: "avatar-123456.webp",
              size: 2 * 1024 * 1024,
              path: "path/to/fake/avatar.webp"
            }
          }
          next()
        }
    })
  }
})

vi.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

describe("Testing edit profile functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return 400 validation error when email format is invalid", async () => {
    const response = await makeHTTPRequest(
      app,
      "PATCH",
      "/api/profile/update",
      invalidUserMock
    )
    const body = response.body as TestApiResponse
    expect(response.status).toBe(400)
    expect(body.success).toBeFalsy()
    expect(body.message).toBe("Validation failed")
    expect(body.errors).toHaveProperty("email")
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it("should successfully update the profile when file is valid and under size limit", async () => {
    vi.mocked(mockUpdateProfile).mockResolvedValueOnce(
      mockUpdatedProfileResponse
    )
    const response = await makeHTTPRequest(
      app,
      "PATCH",
      "/api/profile/update",
      validProfileUpdateMock
    )
    const body = response.body as TestApiResponse
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.message).toBe("Profile updated successfully!")
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        username: "moldovanalex",
        email: "sandumoldovan2008@yahoo.com"
      })
    )
  })

  it("should return 400 when uploaded file exceeds the maximum size limit", async () => {
    const response = await makeHTTPRequest(
      app,
      "PATCH",
      "/api/profile/update",
      invalidProfileUpdateMock
    )
    const body = response.body as TestApiResponse
    expect(response.status).toBe(400)
    expect(body.success).toBeFalsy()
    expect(body.message).toContain("Invalid image")
    expect(body).toHaveProperty("errors")
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })
})
