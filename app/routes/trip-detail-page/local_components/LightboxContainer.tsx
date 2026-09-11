import type { TripWithImages } from "~/types/trip-types"
export const LightboxContainer = ({
  setIsLightBoxOpen,
  trip,
  activeImage,
  goNext,
  goPrev
}: {
  setIsLightBoxOpen: React.Dispatch<React.SetStateAction<boolean>>
  trip: TripWithImages
  activeImage: string | null
  goNext: (e: React.MouseEvent<Element, MouseEvent>) => void
  goPrev: (e: React.MouseEvent<Element, MouseEvent>) => void
}) => {
  return (
    <div
      onClick={() => setIsLightBoxOpen(false)}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <button
        onClick={() => setIsLightBoxOpen(false)}
        className="absolute top-6 right-6 text-white bg-zinc-800/80 hover:bg-zinc-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl transition-colors cursor-pointer z-50 shadow-lg"
      >
        ✕
      </button>
      <button
        onClick={goPrev}
        className="absolute left-6 text-white bg-zinc-800/80 hover:bg-zinc-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl transition-colors cursor-pointer z-50 shadow-lg"
      >
        ‹
      </button>
      <div className="relative max-w-5xl w-full max-h-[85vh] flex items-center justify-center">
        <img
          src={activeImage || trip.images[0].url}
          alt="Carusel slide"
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button
        onClick={goNext}
        className="absolute right-6 text-white bg-zinc-800/80 hover:bg-zinc-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl transition-colors cursor-pointer z-50 shadow-lg"
      >
        ›
      </button>
    </div>
  )
}
