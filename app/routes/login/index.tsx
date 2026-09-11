import { Form, type LoaderFunctionArgs } from "react-router"
import { TextInput } from "../register/local_components/InputText"
import { LoginSchema } from "~/utils/validation/zod-validation"
import { useAuthSubmit } from "~/custom-hooks/auth-hooks"
import { redirectIfAuthenticated } from "~/utils/frontend-utils/auth-guards"
export async function loader({ request }: LoaderFunctionArgs) {
  return redirectIfAuthenticated(request) || null
}

export default function LoginPage() {
  const { error, loading, handleSubmit } = useAuthSubmit(
    "/auth/login",
    "/",
    LoginSchema
  )
  return (
    <main className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      <section className="bg-first-spot-login"></section>
      <section className="bg-second-spot-login"></section>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-2xl p-8 md:p-10 relative z-10">
        <section className="text-center mb-8">
          <span className="text-xs font-semibold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full">
            Welcome Back
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-4">
            Log in to your account
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Enter your details to continue your journey.
          </p>
        </section>

        <form
          className="flex flex-col gap-y-5"
          method="post"
          noValidate
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              {typeof error === "string" ? (
                <p>{error}</p>
              ) : (
                <ul className="list-disc pl-4 flex flex-col gap-1">
                  {Object.entries(error).map(
                    ([field, fieldError]) => {
                      if (field === "_errors") return null
                      const typedFieldError = fieldError as {
                        _errors?: string[]
                      }
                      if (
                        !typedFieldError?._errors ||
                        typedFieldError._errors.length === 0
                      )
                        return null
                      return (
                        <li key={field}>
                          <span className="font-semibold capitalize">
                            {field}:
                          </span>{" "}
                          {typedFieldError._errors.join(", ")}
                        </li>
                      )
                    }
                  )}
                </ul>
              )}
            </div>
          )}
          <TextInput
            label="email"
            placeholder="name@example.com"
            fieldType="email"
          />
          <TextInput
            label="password"
            placeholder="••••••••"
            fieldType="password"
          />

          <button
            disabled={loading}
            type="submit"
            className="w-full cursor-pointer mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <section className="flex flex-col gap-y-2 justify-center items-center w-full mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Don't have an account?
            <a
              href="/register"
              className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors ml-1"
            >
              Register
            </a>
          </p>
          <p className="text-xs text-gray-400">
            Forgot your password?
            <a
              href="/forgot-password"
              className="text-red-400 font-medium hover:text-red-600 transition-colors ml-1"
            >
              Reset your password
            </a>
          </p>
        </section>
      </div>
    </main>
  )
}
