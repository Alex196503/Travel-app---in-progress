import type { RawCountry } from "~/types/common-types"

export const CountryCard = ({
  country,
  onClick
}: {
  country: RawCountry
  onClick: () => void | Promise<void>
}) => {
  return (
    <article
      onClick={onClick}
      className="overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-800 border border-zinc-100 cursor-pointer dark:border-zinc-700"
    >
      <section className="aspect-[16/10] w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        <img
          src={country.flag}
          alt={`Flag of ${country.name}`}
          className="img-flag"
          loading="lazy"
        />
      </section>
      <section className="p-5">
        <h2
          className="mb-4 truncate text-lg font-bold text-zinc-950 dark:text-white"
          title={country.name}
        >
          {country.name}
        </h2>
        <div className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Population:
            </span>{" "}
            {(country.population || 0).toLocaleString("ro-RO")}
          </p>
          <p>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Region:
            </span>{" "}
            {country.region}
          </p>
          <p className="truncate" title={country.capital}>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Capital:
            </span>{" "}
            {country.capital}
          </p>
        </div>
      </section>
    </article>
  )
}
