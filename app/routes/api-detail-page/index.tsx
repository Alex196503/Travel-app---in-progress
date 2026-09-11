import { useLoaderData, useParams } from "react-router"
import { FiArrowLeft } from "react-icons/fi"
import { IoMoon } from "react-icons/io5"
import { getMeta } from "~/helpers/helpers"
import ApiNav from "../api/local_components/ApiNav"
import { Link } from "react-router"
import type { Route } from "./+types"
import { getCountriesRawData } from "~/utils/node-utils"
import { useEffect } from "react"
import { toast } from "react-toastify"
import CountryContainer from "./local_components/CountryContainer"
import type { RawCountry } from "~/types/common-types"
import { useThemeContext } from "~/custom-hooks/context-hooks"
import { useAuth } from "~/custom-hooks/auth-hooks"
import { requireAuthOnServer } from "~/utils/frontend-utils/auth-guards"

export const meta = () =>
  getMeta(
    "Detail page for every country",
    "Check some information about the country"
  )
export async function loader({ params, request }: Route.LoaderArgs) {
  await requireAuthOnServer(request)

  try {
    const rawData = await getCountriesRawData()
    const countries = (rawData || []).map((country) => ({
      name: country.name || "Unknown",
      nativeName: country.nativeName || "",
      population: country.population || 0,
      region: country.region || "Unknown",
      subregion: country.subregion || "",
      capital: country.capital || "N/A",
      flag: country.flag || "🏳️",
      code: country.alpha3Code || "",
      topLevelDomain: country.topLevelDomain || "Unknown",
      currencies: country.currencies || [],
      languages: country.languages || [],
      borders: country.borders || []
    }))
    return { countries, error: null }
  } catch (error) {
    let fsMessage = ""

    if (error instanceof Error) {
      fsMessage = error.message || "An unknown error occured!"
    }
    return {
      countries: [],
      error: fsMessage
    }
  }
}
export default function DefaultPage() {
  const { countries, error } = useLoaderData<typeof loader>()
  let { code } = useParams()
  const { isDark, setDark } = useThemeContext()
  const foundCountry = countries.find(
    (country) => country.code === code
  )
  const { user } = useAuth()
  useEffect(() => {
    if (!error) return
    toast.error(error || "An unknown error occurred!")
  }, [error])

  return (
    <>
      <main className="w-full px-6 md:px-22 py-8">
        <Link
          to="/countries"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors duration-200 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 cursor-pointer"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        {foundCountry ? (
          <CountryContainer
            foundCountry={foundCountry as RawCountry}
          />
        ) : (
          <div className="text-center mt-20 text-zinc-500">
            Country with code "{code}" not found.
          </div>
        )}
      </main>
    </>
  )
}
