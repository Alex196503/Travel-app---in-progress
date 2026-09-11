import { useMemo, useState } from "react"
import type {
  CalendarDay,
  FormattedBookingForCalendar,
  UserBookingRow
} from "~/types/feature-types"

export function generateMatrix(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const days: CalendarDay[] = []
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startingDayOfWeek === -1) startingDayOfWeek = 6
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  //Adding final days from the previous month (to fill the first row)
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({
      date: prevDate,
      dayNumber: prevDate.getDate(),
      isCurrentMonth: false,
      isToday: false
    })
  }

  //Adding all days from the current month
  const today = new Date()
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const currentDate = new Date(year, month, i)
    const isToday =
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    days.push({
      date: currentDate,
      dayNumber: i,
      isCurrentMonth: true,
      isToday
    })
  }

  //Filling the calendar until we have a grid of 35 or 42 days
  const totalCells = days.length <= 35 ? 35 : 42
  const remainingCells = totalCells - days.length
  for (let i = 1; i <= remainingCells; i++) {
    const newDate = new Date(year, month + 1, i)
    days.push({
      date: newDate,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: false
    })
  }
  return days
}

//Helper function to convert DB date into the correct timeZone(Europe / Bucharest)
const toDateKeyInTimeZone = (
  date: Date,
  timeZone = "Europe/Bucharest"
) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date)
  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )
  return `${map.year}-${map.month}-${map.day}`
}

export function CalendarContainer({
  bookings
}: {
  bookings: UserBookingRow[]
}) {
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const [currentDate, setCurrentDate] = useState(new Date())
  const monthDate = currentDate.toLocaleString("en-US", {
    month: "long"
  })
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const handlePrevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1))

  const handleNextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1))

  const calendarDays = useMemo(() => {
    return generateMatrix(year, month)
  }, [year, month])

  let formattedBookings = bookings.map((booking) => ({
    id: booking.booking_id,
    startDate: new Date(booking.start_date as Date),
    title: booking.trip_title,
    endDate: new Date(booking.end_date as Date)
  }))

  const bookingsMap = useMemo(() => {
    const map = new Map<string, FormattedBookingForCalendar[]>()
    for (let i = 0; i < formattedBookings.length; i++) {
      let startDate = new Date(formattedBookings[i].startDate)
      const currentIterDate = new Date(startDate)
      const endDate = new Date(formattedBookings[i].endDate)
      while (currentIterDate <= endDate) {
        const dateKey = toDateKeyInTimeZone(currentIterDate)
        if (!map.has(dateKey)) {
          map.set(dateKey, [])
        }
        const existings = map.get(dateKey) || []
        map.set(dateKey, [...existings, formattedBookings[i]])
        currentIterDate.setDate(currentIterDate.getDate() + 1)
      }
    }
    return map
  }, [formattedBookings])

  return (
    <>
      <div className="w-full py-4 mt-4 max-w-md md:max-w-[600px] rounded-2xl bg-white dark:bg-brand-blue-900 p-5 shadow-xl border border-gray-100 dark:border-white/10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {monthDate} {year}
          </h3>
          <section className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={handlePrevMonth}
            >
              &larr;
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              &rarr;
            </button>
          </section>
        </div>

        <section className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400">
          {daysOfWeek.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </section>

        <section className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((dayItem, index) => {
            const dateKey = toDateKeyInTimeZone(dayItem.date)
            let bookingsForToday = bookingsMap.get(dateKey) || []
            return (
              <section
                key={index}
                className={`min-h-[50px] rounded-xl p-1.5 flex flex-col justify-between border transition-all cursor-pointer ${
                  dayItem.isToday
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10"
                    : "border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-slate-800/40 hover:border-gray-300 dark:hover:border-white/20"
                }`}
              >
                <span
                  className={`text-xs font-medium self-end ${
                    dayItem.isToday
                      ? "text-blue-600 dark:text-blue-400 font-bold"
                      : dayItem.isCurrentMonth
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  {dayItem.dayNumber}
                </span>
                <section className="flex flex-col gap-1 w-full overflow-y-auto max-h-[40px]">
                  {bookingsForToday.map((booking) => {
                    return (
                      <div
                        key={booking.id}
                        className="booking-badge text-[10px] font-medium bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md truncate shadow-sm"
                        title={booking.title}
                      >
                        {booking.title}
                      </div>
                    )
                  })}
                </section>
              </section>
            )
          })}
        </section>
      </div>
    </>
  )
}
