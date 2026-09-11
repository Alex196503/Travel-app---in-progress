import type { SetURLSearchParams } from "react-router"

//Updates, adds, or removes a query parameter in the URL search params. If a value is provided, it sets or updates the parameter. If the value is empty, it deletes the parameter from the URL.
export const handleParamChange = (
  key: string,
  value: string,
  setSearchParams: SetURLSearchParams
) => {
  setSearchParams((prev) => {
    if (value) {
      prev.set(key, value)
      prev.set("page", "1")
    } else {
      prev.delete(key)
    }
    return prev
  })
}
