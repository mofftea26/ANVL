/** Shared form styling + tab model for the drop editor route. */

export type TabId =
  | 'basics'
  | 'visuals'
  | 'theme'
  | 'landing'
  | 'products'
  | 'seo'

export type LeaveEmptyMap = Partial<{
  logoImageUrl: boolean
  wordmarkImageUrl: boolean
  heroImageUrl: boolean
  loadingEmblemUrl: boolean
}>

export function padDt(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function isoToDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${padDt(d.getMonth() + 1)}-${padDt(d.getDate())}T${padDt(d.getHours())}:${padDt(d.getMinutes())}`
}

export function localInputToIso(local: string): string | undefined {
  if (!local.trim()) return undefined
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export const fieldClass =
  'mt-1 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus-ring'

export const fieldErrorClass = 'border-red-500/60 bg-red-500/5'
