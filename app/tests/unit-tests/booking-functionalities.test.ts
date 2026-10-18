import { describe, it, vitest, expect, afterEach } from "vitest"
import { groupBookingsByDate } from "~/routes/home/local_components/CalendarContainer"
import type { FormattedBookingForCalendar } from "~/types/feature-types"
import {
  calculateDuration,
  sanitizePriceValue
} from "~/utils/frontend-utils/trip-utils"
import {
  checkCooldown,
  resetAllCooldownsForTesting,
  setCooldown
} from "~/utils/node-utils"

// Arrange - Act - Assert

describe("Testing trip functionalities", () => {
  it("should sanitize price correctly across various edge cases", () => {
    expect(sanitizePriceValue("")).toEqual("")
    expect(sanitizePriceValue("abc")).toEqual("")
    expect(sanitizePriceValue("12345")).toEqual("10000")
    expect(sanitizePriceValue("989abcxyzs")).toEqual("989")
    expect(sanitizePriceValue("500")).toEqual("500")
  })
})

describe("Testing the trip duration calculator", () => {
  it("should calculate correct days and nights for string dates", () => {
    const result = calculateDuration("2026-06-01", "2026-06-05")
    expect(result).toBe("4 Days / 3 Nights")
  })
  it("should handle same-day trips correctly", () => {
    const result = calculateDuration("2026-06-01", "2026-06-01")
    expect(result).toEqual("0 Days / 0 Nights")
  })
  it("should work with Date objects as well as strings", () => {
    const startDate = new Date("2026-07-10")
    const endDate = new Date("2026-07-12")
    const result = calculateDuration(startDate, endDate)
    expect(result).toBe("2 Days / 1 Nights")
  })
})

describe("checkCooldownForUserOperations", () => {
  afterEach(() => {
    resetAllCooldownsForTesting()
  })
  const testType = "sample-unit-testing" as Parameters<
    typeof checkCooldown
  >[0]
  const testKey = "user123"
  const cooldownLimit = 5 * 60 * 1000
  ;(it("should return false or undefined if operation does not exist", () => {
    resetAllCooldownsForTesting()
    const result = checkCooldown(testType, testKey, cooldownLimit)
    expect(result.isCooldown).toBeFalsy()
  }),
    it("should return isCooldown: true with remaining time if cooldown is active", () => {
      const testType2 = "verification"
      const oneMinuteAgo = Date.now() - 60 * 1000
      setCooldown(testType2, testKey, oneMinuteAgo)
      const result = checkCooldown(testType2, testKey, cooldownLimit)
      expect(result.isCooldown).toBeTruthy()
      expect(result.remainingMinutes).toBeGreaterThan(0)
      expect(result.remainingSeconds).toBeGreaterThan(0)
    }))

  it("should return isCooldown: false if cooldown time has already passed", () => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    setCooldown("verification", testKey, tenMinutesAgo)
    const result = checkCooldown(testType, testKey, cooldownLimit)
    expect(result.isCooldown).toBeFalsy()
    expect(result.remainingSeconds).toBeUndefined()
    expect(result.remainingMinutes).toBeUndefined()
  })
})

describe("groupBookingsByDate algorithm", () => {
  afterEach(() => {
    map.clear()
  })
  const map = new Map<string, FormattedBookingForCalendar[]>()
  it("should handle empty bookings array", () => {
    groupBookingsByDate(map, [])
    expect(map.size).toBe(0)
  })

  it("should correctly map a single-day booking", () => {
    const booking = [
      {
        id: 1,
        title: "Trip to Madrid",
        startDate: "2026-10-18",
        endDate: "2026-10-18"
      }
    ] as unknown as FormattedBookingForCalendar[]
    groupBookingsByDate(map, booking)
    expect(map.get("2026-10-18")).toHaveLength(1)
    expect(map.get("2026-10-18")?.[0]?.id).toBe(1)
    expect(map.get("2026-10-18")?.[0]?.title).toEqual(
      "Trip to Madrid"
    )
  })

  it("should span multi-day bookings across all covered dates", () => {
    const booking = [
      {
        id: 1,
        startDate: "2026-10-18",
        endDate: "2026-10-22",
        title: "Trip to Paris"
      }
    ] as unknown as FormattedBookingForCalendar[]
    groupBookingsByDate(map, booking)
    expect(map.size).toEqual(5)
    expect(map.get("2026-10-17")).toBeFalsy()
    expect(map.get("2026-10-18")).toHaveLength(1)
    expect(map.get("2026-10-18")?.[0].id).toBe(1)
    expect(map.get("2026-10-18")?.[0].title).toBe("Trip to Paris")
    expect(map.get("2026-10-22")).toBeTruthy()
    expect(map.get("2026-10-23")).toBeFalsy()
  })

  it("should accumulate multiple bookings on the same date", () => {
    const bookings = [
      {
        id: 1,
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        title: "Journey to Monaco"
      },
      {
        id: 2,
        startDate: "2026-06-02",
        endDate: "2026-06-04",
        title: "Short business trip to Vancouver"
      }
    ] as unknown as FormattedBookingForCalendar[]
    groupBookingsByDate(map, bookings)
    console.log(map)
    const octoberBookings = map.get("2026-06-02")
    expect(octoberBookings).toHaveLength(2)
    expect(octoberBookings?.map((booking) => booking.id)).toEqual([
      1, 2
    ])
    expect(octoberBookings?.map((booking) => booking.title)).toEqual([
      "Journey to Monaco",
      "Short business trip to Vancouver"
    ])
  })
})
