/** SSR-safe guard shared by storage helpers and `*.storage.ts` re-exports. */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}
