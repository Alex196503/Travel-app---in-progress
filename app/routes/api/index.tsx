import { IoSearch } from "react-icons/io5"
import { Link } from "react-router"
import CountryFinder from "~/routes/api/local_components/CountryFinder"
import RegionDropdown from "~/routes/api/local_components/RegionDropdown"
import type { Route } from "./+types/index"
import {
  useLoaderData,
  useNavigate,
  useNavigation
} from "react-router"
import { useEffect, type FormEvent } from "react"
import { toast } from "react-toastify"
import { ToastContainer } from "react-toastify"
import { useState } from "react"
import { type CSSProperties } from "react"
import { ClipLoader } from "react-spinners"
import { CountryCard } from "~/routes/api/local_components/CountryCard"
import {
  useAuth,
  useDebouncer,
  useThemeContext
} from "~/custom-hooks/react-hooks"
import PaginationComponent from "~/components/ApiComponents/Pagination"
import { getMeta } from "~/helpers/helpers"
import { getCountriesRawData } from "~/utils/node-utils"
import { requireAuthOnServer } from "~/utils/frontend-utils"

export const meta = () =>
  getMeta("Our API", "Check some information about several countries")
//This code runs on server in SSR
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
      code: country.alpha3Code || ""
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

export default function ApiPage() {
  const redirectTo = useNavigate()
  const { countries, error } = useLoaderData<typeof loader>()
  const [search, setSearchedValue] = useState("")
  const [filter, setFilter] = useState("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const debouncedValue = useDebouncer(search, 1000)
  const navigate = useNavigation()
  const isLoading = navigate.state === "loading"

  useEffect(() => {
    if (!error) return
    toast.error(error || "An unknown error occurred!")
  }, [error])

  let options = [
    "Filter by Region",
    "Africa",
    "Americas",
    "Asia",
    "Europe",
    "Oceania"
  ]

  const filteredCountries = countries.filter((country) => {
    const matchesSearch =
      country.name
        .toLowerCase()
        .includes(debouncedValue.toLowerCase()) ||
      country.capital
        .toLowerCase()
        .includes(debouncedValue.toLowerCase())
    const hasRegion =
      filter && filter.toLowerCase() !== "filter by region"
    const matchesRegion = hasRegion ? country.region === filter : true
    return matchesSearch && matchesRegion
  })
  let countriesPerPage = 20
  let numberOfPages =
    Math.ceil(filteredCountries.length / countriesPerPage) || 1
  let lastIndex = currentPage * countriesPerPage
  let firstIndex = lastIndex - countriesPerPage

  const override: CSSProperties = {
    display: "block",
    margin: "40px auto",
    borderColor: "red"
  }

  return (
    <>
      <main className="w-full px-6 md:px-16 py-8">
        <section className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
          <CountryFinder
            label="Search for a country..."
            id="text"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchedValue(e.target.value)
              setCurrentPage(1)
            }}
          >
            <IoSearch />
          </CountryFinder>
          <div className="relative w-full md:w-56">
            <RegionDropdown
              label="Select a region"
              value={filter}
              id="select"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={options}
            />
          </div>
        </section>
        {isLoading && (
          <div className="w-full flex justify-center py-8">
            <ClipLoader
              color="#ffffff"
              loading={isLoading}
              cssOverride={override}
              size={100}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        )}
        <section className="py-10 grid grid-cols-1 md:grid-cols-4 gap-10">
          {filteredCountries.length > 0 ? (
            filteredCountries
              .slice(firstIndex, lastIndex)
              .map((country) => {
                return (
                  <CountryCard
                    onClick={() =>
                      redirectTo(`/country/${country.code}`)
                    }
                    key={country.code}
                    country={country}
                  />
                )
              })
          ) : (
            <section className="flex gap-10 items-center">
              <h3 className="text-xl text-dark font-medium">
                No countries found...
              </h3>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-md shadow-sm border transition-colors duration-200 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer"
              >
                Go Back
              </Link>
            </section>
          )}
        </section>
        <nav className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-zinc-200 dark:border-zinc-700 pt-6">
          {" "}
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing <span className="text-span">{firstIndex}</span> to{" "}
            <span className="text-span">{lastIndex}</span> of{" "}
            <span className="text-span">
              {filteredCountries.length}
            </span>{" "}
            entries
          </span>
          <PaginationComponent
            setCurrentPage={setCurrentPage}
            numberOfPages={numberOfPages}
            currentPage={currentPage}
          />
        </nav>
      </main>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        closeOnClick={true}
      />
    </>
  )
}
