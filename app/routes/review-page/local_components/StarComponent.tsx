export const StarComponent = ({
  rating,
  star,
  hover,
  setRating,
  setHover
}: {
  rating: number
  star: number
  hover: number
  setRating: React.Dispatch<React.SetStateAction<number>>
  setHover: React.Dispatch<React.SetStateAction<number>>
}) => {
  return (
    <button
      key={star}
      type="button"
      className="text-2xl cursor-pointer focus:outline-none transition-colors"
      onClick={() => setRating(star)}
      onMouseEnter={() => setHover(star)}
      onMouseLeave={() => setHover(0)}
    >
      <span
        className={
          star <= (hover || rating)
            ? "text-amber-400"
            : "text-zinc-300 dark:text-zinc-700"
        }
      >
        ★
      </span>
    </button>
  )
}
