/**
 * Zero-dependency deep-pick primitives shared by every `supportContent.*.zod.ts`
 * module (`supportContent.zod.ts` itself, `supportContent.shared.zod.ts`,
 * `supportContent.care.zod.ts`, `supportContent.size.zod.ts`). Kept in their
 * own file with no imports of any kind so the schema modules that depend on
 * them form a strict acyclic chain: this file → shared → care, and this file
 * → size, with the root file importing both — never the other way around.
 */

export function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}
}

export function pickKeys(raw: unknown, keys: readonly string[]): Record<string, unknown> {
  const r = obj(raw)
  const out: Record<string, unknown> = {}
  for (const key of keys) if (key in r) out[key] = r[key]
  return out
}

export function pickStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((v) => (typeof v === 'string' ? v : String(v ?? '')))
}
