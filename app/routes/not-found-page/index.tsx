import { Link } from "react-router"
import { getMeta } from "~/helpers/helpers"

export const meta = () =>
  getMeta(
    "Not found page",
    "The page you were looking for might've been deleted or replaced!"
  )

export default function NotFoundPage() {
  return (
    <main className="flex flex-col items-center justify-center text-center px-6 min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <h1 className="text-8xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
        404
      </h1>
      <h2 className="text-2xl font-bold tracking-tight mb-2">
        Page Not Found
      </h2>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm text-sm sm:text-base">
        Sorry, the page you are looking for does not exist or has been
        moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-md shadow-sm border transition-colors duration-200 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer"
      >
        Go Back Home
      </Link>
    </main>
  )
}
