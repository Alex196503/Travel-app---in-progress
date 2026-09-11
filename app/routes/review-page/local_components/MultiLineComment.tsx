export const MultiLineComment = ({
  name,
  rows,
  minLength = 1,
  maxLength = 500,
  defaultValue
}: {
  name: string
  rows: number
  minLength?: number
  maxLength?: number
  defaultValue?: string
}) => {
  return (
    <textarea
      name={name}
      id={name}
      rows={rows}
      minLength={minLength}
      maxLength={maxLength}
      defaultValue={defaultValue}
      required
      className="w-full border rounded-lg p-2"
    />
  )
}
