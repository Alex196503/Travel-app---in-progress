export const MultiLineComment = ({
  name,
  rows,
  minLength = 1,
  maxLength = 500,
  defaultValue,
  placeholder = "Write your comment here..."
}: {
  name: string
  rows: number
  minLength?: number
  maxLength?: number
  defaultValue?: string
  placeholder?: string
}) => {
  return (
    <textarea
      name={name}
      id={name}
      rows={rows}
      minLength={minLength}
      maxLength={maxLength}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required
      className="w-full border rounded-lg p-2"
    />
  )
}
