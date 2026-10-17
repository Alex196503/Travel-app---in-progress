import type { RawCountry } from "~/types/common-types"

interface ICountryFinder {
  findCountry(name: string): RawCountry | undefined
}

export class CountryFinder implements ICountryFinder {
  private countriesMap = new Map<string, RawCountry>()
  constructor(countries: RawCountry[]) {
    for (const country of countries) {
      this.countriesMap.set(
        country.name.toLowerCase().trim(),
        country
      )
    }
  }

  public findCountry(name: string) {
    const query = name.toLowerCase().trim()
    if (!query) return undefined
    return this.countriesMap.get(query)
  }
}

export class CountryManager {
  private countries: RawCountry[]
  private countryFinder: CountryFinder

  constructor(
    countriesData: RawCountry[],
    countryFinder: CountryFinder
  ) {
    this.countries = countriesData
    this.countryFinder = countryFinder
  }

  public getCountryInfo(countryName: string) {
    const country = this.countryFinder.findCountry(countryName)
    if (!country)
      return { error: `Country '${countryName}' not found` }

    return {
      name: country.name,
      capital: country.capital,
      region: country.region,
      population: country.population,
      languages: country.languages,
      flag: country.flags?.svg ?? country.flag ?? "N/A"
    }
  }

  public getCountriesByRegion(regionName: string) {
    const query = regionName.toLowerCase().trim()
    const matches = this.countries.filter(
      (c) => c.region?.toLowerCase() === query
    )

    if (matches.length === 0)
      return {
        error: `No countries found in region '${regionName}'.`
      }

    return {
      region: regionName,
      total_countries: matches.length,
      countries: matches.map((c) => ({
        name: c.name,
        capital: c.capital,
        population: c.population
      }))
    }
  }

  public compareCountries(countryNames: string[]) {
    const foundCountries: Array<{
      name: string
      capital: string | undefined
      region: string | undefined
      population: number | undefined
      languages: { name: string }[]
    }> = []
    let countryNamesNormalized: string[] = []
    for (let country of countryNames) {
      countryNamesNormalized.push(country.toLowerCase().trim())
    }
    let countryNamesNotDuplicate = new Set(countryNamesNormalized)
    const notFound: string[] = []
    for (const name of countryNamesNotDuplicate.values()) {
      const foundCountry = this.countryFinder.findCountry(name)
      if (foundCountry) {
        foundCountries.push({
          name: foundCountry.name,
          capital: foundCountry.capital,
          region: foundCountry.region,
          population: foundCountry.population,
          languages: foundCountry.languages ?? []
        })
      } else {
        notFound.push(name)
      }
    }
    return {
      compared_countries: foundCountries,
      not_found: notFound.length > 0 ? notFound : undefined
    }
  }

  public getTopPopulousCountries(limit: number = 5, region?: string) {
    let filtered = this.countries
    if (region) {
      const query = region.toLowerCase().trim()
      filtered = filtered.filter(
        (c) => c.region?.toLowerCase() === query
      )
    }
    const sorted = [...filtered].sort(
      (a, b) => (b.population ?? 0) - (a.population ?? 0)
    )
    const top = sorted.slice(0, limit)
    return {
      total_filtered: top.length,
      countries: top.map((c) => ({
        name: c.name,
        capital: c.capital,
        region: c.region,
        population: c.population
      }))
    }
  }

  public searchCountriesByLanguage(languageName: string) {
    const query = languageName.toLowerCase().trim()
    const matches = this.countries.filter((c) =>
      c.languages?.some((lang) =>
        lang.name.toLowerCase().includes(query)
      )
    )
    if (matches.length === 0) {
      return {
        error: `No countries found where language '${languageName}' is spoken.`
      }
    }
    return {
      language: languageName,
      total_countries: matches.length,
      countries: matches.map((c) => ({
        name: c.name,
        capital: c.capital,
        region: c.region,
        population: c.population
      }))
    }
  }
}
