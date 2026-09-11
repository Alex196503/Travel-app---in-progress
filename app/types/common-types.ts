export interface RawCountry {
  name: string
  nativeName?: string
  population?: number
  region?: string
  subregion?: string
  capital?: string
  flag: string
  alpha3Code?: string
  topLevelDomain?: string[]
  currencies?: Currency[]
  languages?: { name: string }[]
  borders?: string[]
}

export interface Currency {
  name: string
  symbol: string
}

export interface ThemeContextProps {
  isDark: boolean
  setDark: React.Dispatch<React.SetStateAction<boolean>>
}

export interface ModalContextProps {
  isModalBookingsOpen: boolean
  setModalBookingsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export type InputProps = {
  label: string
  fieldType: string
  placeholder?: string
  minLength?: number
  maxLength?: number
  defaultValue?: string
  existingImageUrl?: string
}

export type InputFile = InputProps & {
  accept: string
}
