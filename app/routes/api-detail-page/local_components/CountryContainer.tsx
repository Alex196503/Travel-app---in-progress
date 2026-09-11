import { Link } from "react-router"
import type { RawCountry } from "~/types/common-types"
export default function CountryContainer({
  foundCountry
}: {
  foundCountry: RawCountry
}) {
  return (
    <section className="flex flex-col md:flex-row w-full md:gap-20 gap-10 mt-10 py-5">
      <div className="md:w-1/2 w-full">
        <img
          src={foundCountry!.flag}
          alt={`Flag of ${foundCountry!.name}`}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="w-full md:w-1/2 flex flex-col md:gap-10 md:py-10">
        <h1 className="text-2xl text-black font-bold">
          {foundCountry!.name}{" "}
        </h1>
        <div className="w-full flex flex-col md:flex-row justify-between">
          <section className="flex flex-col gap-2 mt-5 md:mt-0">
            <p>
              <span className="paragraph-info">Native Name:</span>{" "}
              {foundCountry?.nativeName}
            </p>
            <p>
              <span className="paragraph-info">Population:</span>{" "}
              {foundCountry?.population?.toLocaleString("ro-RO") || 0}
            </p>
            <p>
              <span className="paragraph-info">Region:</span>{" "}
              {foundCountry?.region}
            </p>
            <p>
              <span className="paragraph-info">Sub Region:</span>{" "}
              {foundCountry?.subregion || "N/A"}
            </p>
            <p>
              <span className="paragraph-info">Capital:</span>{" "}
              {foundCountry?.capital}
            </p>
          </section>
          <section className="flex flex-col gap-2 mt-10 md:mt-0">
            <p>
              <span className="paragraph-info">
                Top Level Domain:
              </span>{" "}
              {foundCountry?.topLevelDomain}
            </p>
            <p>
              <span className="paragraph-info">Currencies: </span>
              {foundCountry?.currencies
                ?.map((c) => `${c.name} (${c.symbol})`)
                .join(", ") || "N/A"}
            </p>
            <p>
              <span className="paragraph-info">Languages: </span>
              {(foundCountry?.languages || [])
                .map((l) => `${l.name}`)
                .join(", ") || "N/A"}
            </p>
          </section>
        </div>
        <section className="flex flex-col gap-3 mt-5 md:mt-10 py-4 md:py-8">
          <span className="paragraph-info whitespace-nowrap">
            Border countries:
          </span>

          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
            {foundCountry?.borders &&
            foundCountry.borders.length > 0 ? (
              foundCountry.borders.map((border: string) => (
                <Link
                  key={border}
                  to={`/api/${border}`}
                  className="px-4 py-2 md:py-1 text-xs font-medium rounded border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors text-center"
                >
                  {border}
                </Link>
              ))
            ) : (
              <span className="text-zinc-500 text-xs italic">
                None
              </span>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
