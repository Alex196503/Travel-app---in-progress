//Handler function that sanitizes the value introduced by the user in the price input
export const sanitizePriceValue = (value: string) => {
  if (!value) return ""
  const numericOnly = value.replace(/[^0-9]/g, "")
  if (!numericOnly) return ""
  const num = Number(numericOnly)
  const ABSOLUTE_MAX_PRICE = 10000
  if (num > ABSOLUTE_MAX_PRICE) {
    return ABSOLUTE_MAX_PRICE.toString()
  }
  return num.toString()
}

//Handler function to calculate the difference in days between end date and start date of the trip
export const calculateDuration = (
  start: string | Date,
  end: string | Date
) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const nights = diffDays > 0 ? diffDays - 1 : 0
  return `${diffDays} Days / ${nights} Nights`
}

//Handler function that returns the name of the country based on its country code using Intl.DisplayNames object browser
export const getCountryName = (countryCode: string) => {
  const regionNames = new Intl.DisplayNames(["en"], {
    type: "region"
  })
  return regionNames.of(countryCode.toUpperCase()) || countryCode
}

