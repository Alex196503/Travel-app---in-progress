import { type LoaderFunctionArgs } from "react-router"
import { TextInput } from "./local_components/InputText"
import { RegisterSchema } from "~/utils/validation/zod-validation"
import { FileInput } from "./local_components/FileInput"
import { useAuthSubmit } from "~/custom-hooks/auth-hooks"
import { redirectIfAuthenticated } from "~/utils/frontend-utils/auth-guards"

export async function loader({ request }: LoaderFunctionArgs) {
  return redirectIfAuthenticated(request) || null
}

export default function Register() {
  const registerFields = [
    {
      label: "name",
      placeholder: "e.g: alex_traveler",
      fieldType: "text"
    },
    {
      label: "email",
      placeholder: "name@example.com",
      fieldType: "email"
    },
    { label: "avatar", fieldType: "file", accept: "image/*" },
    {
      label: "password",
      placeholder: "••••••••",
      fieldType: "password"
    },
    {
      label: "confirmPassword",
      placeholder: "••••••••",
      fieldType: "password"
    }
  ]
  const { error, loading, handleSubmit } = useAuthSubmit(
    "/auth/register",
    "/",
    RegisterSchema
  )
  return (
    <main className="text-slate-100 min-h-screen flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <article className="relative hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
          <section className="bg-spot"></section>
          <section className="bg-second-spot"></section>

          <div>
            <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
              Start your trip!
            </span>
          </div>

          <section className="my-auto flex flex-col gap-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Create unforgettable memories.
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Join the community and organize your next adventures in
              a simple, elegant, and fast way.
            </p>
          </section>

          <section className="text-xs text-indigo-200">
            &copy; 2026 VoyageFlow. All rights reserved.
          </section>
        </article>
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <section className="mb-8 flex flex-col gap-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Create your account!
            </h2>
            <p className="text-sm text-slate-400">
              Complete all the fields to create your account!
            </p>
          </section>

          <form
            className="flex flex-col gap-y-5"
            noValidate
            onSubmit={handleSubmit}
            method="post"
            encType="multipart/form-data"
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
            {registerFields.map((field) => {
              return field.fieldType === "file" ? (
                <FileInput
                  key={field.label}
                  label={field.label}
                  fieldType={field.fieldType}
                  accept={field.accept as string}
                />
              ) : (
                <TextInput
                  key={field.label}
                  label={field.label}
                  fieldType={field.fieldType}
                  placeholder={field.placeholder}
                />
              )
            })}
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98]"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
          <section className="flex justify-between gap-y-10 items-center w-full mt-5">
            <p className="text-center text-xs text-slate-400">
              Already have an account?
            </p>
            <a
              href="/login"
              className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
            >
              Login
            </a>
          </section>
        </div>
      </div>
    </main>
  )
}
