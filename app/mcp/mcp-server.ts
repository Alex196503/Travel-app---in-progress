import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import type { RawCountry } from "~/types/common-types"
import countriesData from "../../data.json"
import { CountryFinder, CountryManager } from "./CountryManager"
const countries: RawCountry[] = countriesData

function createServer() {
  const server = new McpServer({
    name: "countries-mcp",
    version: "1.0.0"
  })

  const countryFinder = new CountryFinder(countries)
  const manager = new CountryManager(countries, countryFinder)
  server.tool(
    "get_country_info",
    "Get information about a specific country",
    {
      country_name: z.string().describe("Name of the country")
    },
    async ({ country_name }) => {
      const result = manager.getCountryInfo(country_name)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      }
    }
  )

  server.tool(
    "list_countries_by_region",
    "Get a list of countries in a specific region (e.g., Europe, Asia, Americas, Africa, Oceania)",
    {
      region_name: z
        .string()
        .describe(
          "Name of the region/continent (e.g., 'Europe', 'Asia')"
        )
    },
    async ({ region_name }) => {
      const result = manager.getCountriesByRegion(region_name)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      }
    }
  )

  server.tool(
    "compare_countries",
    "Compare key metrics (population, region, capital, languages) between two or more countries",
    {
      country_names: z
        .array(z.string())
        .min(2)
        .describe(
          "List of country names to compare (at least two, e.g. ['Romania', 'France'])"
        )
    },
    async ({ country_names }) => {
      const result = manager.compareCountries(country_names)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      }
    }
  )

  server.tool(
    "get_top_populous_countries",
    "Returns the top most populous countries, optionally filtered by region.",
    {
      limit: z
        .number()
        .optional()
        .describe("Number of countries to return (default is 5)"),
      region: z
        .string()
        .optional()
        .describe(
          "Optional region to filter by (e.g., Africa, Europe)"
        )
    },
    async ({ limit, region }) => {
      const result = manager.getTopPopulousCountries(
        limit ?? 5,
        region
      )
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      }
    }
  )

  server.tool(
    "search_countries_by_language",
    "Searches for countries where a specific language is spoken.",
    {
      languageName: z
        .string()
        .describe(
          "The name of the language to search for (e.g., Spanish, French)"
        )
    },
    async ({ languageName }) => {
      const result = manager.searchCountriesByLanguage(languageName)
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) }
        ]
      }
    }
  )

  return server
}

async function main() {
  const server = createServer()
  const transport = new StdioServerTransport()
  try {
    await server.connect(transport)
    console.error("Rest Countries MCP Server running on stdio.")
  } catch (error) {
    console.error(
      `MCP Server connection error: ${(error as Error).message}`
    )
  }
}

process.stdout.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EPIPE") {
    process.exit(0)
  }
})
process.stdin.on("close", () => {
  process.exit(0)
})

main()
