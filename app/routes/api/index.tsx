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
  useCountdown,
  useDebouncer
} from "~/custom-hooks/utility-hooks"
import PaginationComponent from "~/components/ApiComponents/Pagination"
import { getMeta } from "~/helpers/helpers"
import { getCountriesRawData } from "~/utils/node-utils"
import { requireAuthOnServer } from "~/utils/frontend-utils/auth-guards"
import axios from "axios"
import { api } from "~/axios/axios"
import { type APIResponse } from "~/types/feature-types"

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
  const { countdown, setCountdown, formattedTime, isCounting } =
    useCountdown(0)
  const [filter, setFilter] = useState("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
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

  const handleAISubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!aiPrompt.trim()) return
    try {
      setIsAiLoading(true)
      setAiResponse(null)
      const response = await api.post<APIResponse>("/prompt/ai", {
        prompt: aiPrompt
      })
      const data = response.data
      if ("error" in data) {
        toast.error(`Server error: ${data.error}`)
        setCountdown(300)
        return
      }
      setAiResponse(data.reply || "No response from the assistant")
      setCountdown(300)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          toast.error(
            "Too many requests. Please wait before trying again."
          )
          setCountdown(300)
        } else {
          toast.error(`Unexpected error came: ${error.message}`)
        }
      }
    } finally {
      setIsAiLoading(false)
    }
  }
  return (
    <>
      <main className="w-full px-6 md:px-16 py-8">
        <section className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
          <div className="w-full lg:w-1/3">
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
          </div>

          <form
            onSubmit={handleAISubmit}
            className="w-full lg:w-1/3 flex items-center gap-2"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI about countries (e.g., compare RO & FR)..."
                className="w-full px-10 py-2.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <button
              type="submit"
              disabled={isCounting || isAiLoading}
              style={{ opacity: isCounting ? 0.5 : 1 }}
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-md shadow-sm bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isCounting
                ? `Sending prompt in ${formattedTime}.`
                : "Send prompt."}
            </button>
          </form>
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
        {aiResponse && (
          <section className="mt-6 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              AI Orchestrator Result:
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
              {aiResponse}
            </p>
          </section>
        )}
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
