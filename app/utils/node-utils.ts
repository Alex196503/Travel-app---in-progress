import fs from "fs/promises"
import path from "node:path"
import type { RawCountry } from "~/types/common-types"

import {
  type Response,
  type Request,
  type NextFunction
} from "express"
import multer from "multer"
import { cloudinaryVar } from "../cloudinary-config"
import { CloudinaryStorage } from "multer-storage-cloudinary"

//Handler that fetches and parses the raw countries dataset(SERVER-ONLY HANDLER). Isolated inside this node-utils file to make sure Node.js modules are never bundled into the client code.
const filePath = path.join(process.cwd(), "data.json")
export async function getCountriesRawData(): Promise<RawCountry[]> {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8")
    return JSON.parse(fileContent)
  } catch (error) {
    console.error("Failed to read countries data:", error)
    return []
  }
}

//Express middleware that returns 404 status if route introduced by the user is not found
export const routeNotFoundHandler = (req: Request, res: Response) => {
  return res
    .status(404)
    .json({ success: false, message: "Route not found!" })
}

//Express global middleware that catches any error that occured on the server
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack)
  return res.status(500).json({
    success: false,
    message: "Something bad happened with the server!",
    error: err.message || "Internal Server Error"
  })
}

// Middleware that returns a configured multer instance using CloudinaryStorage.
export const uploadMiddleware = (folderName: string) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinaryVar,
    params: async (req: Request, file: Express.Multer.File) => {
      const publicId = `${file.fieldname}-${Date.now()}`
      return {
        public_id: publicId,
        folder: folderName.trim(),
        format: "webp"
      }
    }
  })
  return multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  })
}

// Note: Using in-memory Map for development.
// Production should use Redis for distributed state
// across multiple server instances.
const cooldownMaps = {
  verification: new Map<string, number>(),
  passwordReset: new Map<string, number>(),
  editBooking: new Map<string, number>()
}

// Check if a cooldown is still active for a given type and key. Returns isCooldown flag and remaining minutes if active.
export const checkCooldown = (
  type: keyof typeof cooldownMaps,
  key: string,
  cooldownTime: number
) => {
  const map = cooldownMaps[type]
  const lastSentTime = map.get(key)
  const now = Date.now()
  if (lastSentTime && now - lastSentTime < cooldownTime) {
    const remainingMinutes = Math.ceil(
      (cooldownTime - (now - lastSentTime)) / 1000 / 60
    )
    const remainingSeconds = Math.ceil(
      (cooldownTime - (Date.now() - lastSentTime)) / 1000
    )
    return { isCooldown: true, remainingMinutes, remainingSeconds }
  }
  return { isCooldown: false }
}

// Setting the cooldown, and removing the current entry from the map when cooldown expires
export const setCooldown = (
  type: keyof typeof cooldownMaps,
  key: string,
  cooldownTime: number
) => {
  const map = cooldownMaps[type]
  let date = Date.now()
  map.set(key, date)
  setTimeout(() => {
    map.delete(key)
  }, cooldownTime)
}
