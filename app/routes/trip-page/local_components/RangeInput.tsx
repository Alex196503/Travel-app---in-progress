import { sanitizePriceValue } from "~/utils/frontend-utils/trip-utils"
import { handleParamChange } from "~/utils/frontend-utils/search-param-utils"
import { type SetURLSearchParams } from "react-router"
export const RangeInput = ({
  min,
  max,
  value,
  setSearchParams,
  placeholder,
  name
}: {
  min: number
  max: number
  value: string
  setSearchParams: SetURLSearchParams
  placeholder: string
  name: string
}) => {
  return (
    <>
      <input
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const sanitizedValue = sanitizePriceValue(e.target.value)
          if (
            sanitizedValue === "" ||
            (Number(sanitizedValue) >= 0 &&
              sanitizedValue.length <= 7)
          )
            handleParamChange(name, sanitizedValue, setSearchParams)
        }}
        className="input-range"
      />
    </>
  )
}
