import type { SetURLSearchParams } from "react-router"
import { handleParamChange } from "~/utils/frontend-utils/search-param-utils"

export const SortDropdown = ({
  searchParams,
  setSearchParams,
  options
}: {
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
  options: { value: string; label: string }[]
}) => {
  return (
    <select
      value={searchParams.get("sort") || "newest"}
      onChange={(e) =>
        handleParamChange("sort", e.target.value, setSearchParams)
      }
      className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 pr-8 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      {options.map((option, index) => {
        return (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        )
      })}
    </select>
  )
}
