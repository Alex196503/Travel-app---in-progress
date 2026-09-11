import type { SetURLSearchParams } from "react-router"
import { TripCategory } from "../../../../generated/prisma/enums"
import { handleParamChange } from "~/utils/frontend-utils/search-param-utils"
export const GeneralDropdown = ({
  setSearchParams,
  searchParams
}: {
  setSearchParams: SetURLSearchParams
  searchParams: URLSearchParams
}) => {
  let tripCategories = Object.keys(TripCategory)
  return (
    <select
      value={searchParams.get("category") || ""}
      onChange={(e) =>
        handleParamChange("category", e.target.value, setSearchParams)
      }
      className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
    >
      <option value="">All</option>
      {tripCategories.map((category, index) => {
        return (
          <option key={index} value={category}>
            {category.at(0)?.toUpperCase() +
              category.slice(1).toLowerCase()}
          </option>
        )
      })}
    </select>
  )
}
