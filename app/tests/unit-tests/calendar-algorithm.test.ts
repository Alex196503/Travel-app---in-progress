import { describe, it, vitest, expect } from "vitest"
import {
  completeDaysFromPreviousMonth,
  fillTheFullCalendar,
  generateMatrix
} from "~/routes/home/local_components/CalendarContainer"
import type { CalendarDay } from "~/types/feature-types"
describe("Calendar algorithm", () => {
  it("should correctly add trailing days from the previous month", () => {
    const days: CalendarDay[] = []
    completeDaysFromPreviousMonth(4, 2026, 10, 30, days)
    expect(days.length).toBe(4)
    expect(days[0].dayNumber).toBe(27)
    expect(days[0].isCurrentMonth).toBe(false)
    expect(days[3].dayNumber).toBe(30)
    expect(days[3].isCurrentMonth).toBe(false)
  })
  
  it("should fill up the entire calendar to 35 or 42 cells", () => {
    const days: CalendarDay[] = []
    for (let i = 0; i < 30; i++) {
      days.push({
        date: new Date(),
        dayNumber: i + 1,
        isCurrentMonth: true,
        isToday: false
      })
    }
    fillTheFullCalendar(2026, 2, days)
    expect(days.length).toBe(35)
  })

  it("makes sure there is one current day in the matrix generated for the given month", () => {
    const days = generateMatrix(
      new Date().getFullYear(),
      new Date().getMonth()
    )
    const today = days.filter((day) => day.isToday === true)
    expect(today.length).toBe(1)
    expect(today[0].dayNumber).toBe(new Date().getDate())
    expect(today[0].isCurrentMonth).toBeTruthy()
  })
})
