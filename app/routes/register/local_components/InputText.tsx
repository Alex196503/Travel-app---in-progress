import { type InputProps } from "~/types/common-types"

export const TextInput = ({
  label,
  fieldType,
  placeholder,
  minLength = 2,
  maxLength = 50,
  defaultValue
}: InputProps) => {
  return (
    <section className="flex flex-col gap-y-2">
      <label
        className="text-xs font-medium text-slate-300 uppercase tracking-wider"
        htmlFor={label}
      >
        {label.at(0)?.toUpperCase() + label.slice(1)}
      </label>
      <div className="relative">
        <input
          type={fieldType}
          id={label}
          name={label}
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className="form-input"
        />
      </div>
    </section>
  )
}
