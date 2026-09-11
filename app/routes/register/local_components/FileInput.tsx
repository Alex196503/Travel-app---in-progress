import { type InputFile } from "~/types/common-types"
import { useEffect, useRef, useState } from "react"
export const FileInput = ({
  label,
  accept,
  fieldType,
  onFileSelect,
  existingImageUrl
}: InputFile & { onFileSelect?: (file: File | null) => void }) => {
  const [imageSelected, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (!imageSelected) {
      setPreviewUrl(null)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
      return
    }
    const objectURL = URL.createObjectURL(imageSelected)
    setPreviewUrl(objectURL)
    return () => URL.revokeObjectURL(objectURL)
  }, [imageSelected])

  const updateFile = (file: File | null) => {
    setImage(file)
    if (onFileSelect) {
      onFileSelect(file)
    }
  }
  const displayImage = previewUrl || existingImageUrl || null

  return (
    <section className="flex flex-col gap-y-2">
      <label
        className="text-xs font-medium text-slate-300 uppercase tracking-wider"
        htmlFor={label}
      >
        {label.at(0)?.toUpperCase() + label.slice(1)}
      </label>
      <div className="relative group">
        <div className="flex items-center justify-between p-3 border border-slate-700 rounded-xl bg-slate-900/50 hover:border-blue-500/50 transition-all">
          <article className="flex items-center gap-3 overflow-hidden">
            <section className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {displayImage ? (
                <img
                  src={displayImage as string}
                  alt="User preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  IMG
                </span>
              )}
            </section>
            <section className="flex flex-col truncate">
              <span className="text-sm text-slate-200 font-medium truncate">
                {imageSelected
                  ? imageSelected.name
                  : existingImageUrl
                    ? "Current avatar"
                    : "No file selected"}
              </span>
              <span className="text-xs text-slate-500">
                Choose a picture (WebP, PNG, JPG)
              </span>
            </section>
          </article>
          <button
            type="button"
            className=" cursor-pointer w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors shrink-0"
            title="Clear the image"
            onClick={() => updateFile(null)}
          >
            ✕
          </button>
        </div>
        <input
          type={fieldType}
          id={label}
          name={label}
          accept={accept}
          ref={inputRef}
          onChange={(e) => {
            const file = e.currentTarget.files?.[0]
            if (file) {
              updateFile(file)
            }
          }}
          className="form-input"
        />
      </div>
    </section>
  )
}
