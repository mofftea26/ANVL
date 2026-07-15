/**
 * Country presets for the passport origin map (CMS picks by key). Coordinates
 * are rough national centroids — enough to place a pin on the world map.
 */
export interface PassportCountry {
  key: string
  label: string
  lat: number
  lng: number
}

export const PASSPORT_COUNTRIES: PassportCountry[] = [
  { key: 'lebanon', label: 'Lebanon', lat: 33.9, lng: 35.9 },
  { key: 'turkey', label: 'Turkey', lat: 39.0, lng: 35.0 },
  { key: 'portugal', label: 'Portugal', lat: 39.6, lng: -8.0 },
  { key: 'italy', label: 'Italy', lat: 42.8, lng: 12.5 },
  { key: 'france', label: 'France', lat: 46.6, lng: 2.4 },
  { key: 'spain', label: 'Spain', lat: 40.3, lng: -3.7 },
  { key: 'germany', label: 'Germany', lat: 51.1, lng: 10.4 },
  { key: 'united-kingdom', label: 'United Kingdom', lat: 54.0, lng: -2.5 },
  { key: 'netherlands', label: 'Netherlands', lat: 52.2, lng: 5.5 },
  { key: 'switzerland', label: 'Switzerland', lat: 46.8, lng: 8.2 },
  { key: 'sweden', label: 'Sweden', lat: 62.0, lng: 15.0 },
  { key: 'poland', label: 'Poland', lat: 52.1, lng: 19.4 },
  { key: 'romania', label: 'Romania', lat: 45.9, lng: 25.0 },
  { key: 'greece', label: 'Greece', lat: 39.0, lng: 22.0 },
  { key: 'egypt', label: 'Egypt', lat: 26.8, lng: 30.0 },
  { key: 'morocco', label: 'Morocco', lat: 31.8, lng: -7.1 },
  { key: 'tunisia', label: 'Tunisia', lat: 34.0, lng: 9.5 },
  { key: 'south-africa', label: 'South Africa', lat: -29.0, lng: 24.0 },
  { key: 'uae', label: 'United Arab Emirates', lat: 24.0, lng: 54.0 },
  { key: 'saudi-arabia', label: 'Saudi Arabia', lat: 24.0, lng: 45.0 },
  { key: 'jordan', label: 'Jordan', lat: 31.3, lng: 36.5 },
  { key: 'india', label: 'India', lat: 21.0, lng: 78.0 },
  { key: 'pakistan', label: 'Pakistan', lat: 30.0, lng: 69.0 },
  { key: 'bangladesh', label: 'Bangladesh', lat: 23.8, lng: 90.4 },
  { key: 'sri-lanka', label: 'Sri Lanka', lat: 7.7, lng: 80.7 },
  { key: 'china', label: 'China', lat: 35.0, lng: 103.0 },
  { key: 'vietnam', label: 'Vietnam', lat: 15.9, lng: 107.8 },
  { key: 'thailand', label: 'Thailand', lat: 15.2, lng: 101.0 },
  { key: 'indonesia', label: 'Indonesia', lat: -2.5, lng: 118.0 },
  { key: 'japan', label: 'Japan', lat: 36.5, lng: 138.0 },
  { key: 'south-korea', label: 'South Korea', lat: 36.4, lng: 127.9 },
  { key: 'australia', label: 'Australia', lat: -25.5, lng: 134.0 },
  { key: 'usa', label: 'United States', lat: 39.5, lng: -98.4 },
  { key: 'canada', label: 'Canada', lat: 56.0, lng: -106.0 },
  { key: 'mexico', label: 'Mexico', lat: 23.9, lng: -102.5 },
  { key: 'brazil', label: 'Brazil', lat: -10.8, lng: -53.0 },
  { key: 'argentina', label: 'Argentina', lat: -35.4, lng: -65.2 },
]

export function getPassportCountry(key: string): PassportCountry | null {
  const k = key.trim().toLowerCase()
  return PASSPORT_COUNTRIES.find((c) => c.key === k) ?? null
}

/**
 * Equirectangular projection onto a `width × height` canvas:
 * x = (lng+180)/360·W, y = (90−lat)/180·H.
 */
export function projectEquirect(
  lat: number,
  lng: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: ((lng + 180) / 360) * width,
    y: ((90 - lat) / 180) * height,
  }
}
