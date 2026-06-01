/** PostgREST returns 400 when selecting/updating a column that does not exist yet. */
export function isPostgrestMissingColumnError(
  error: { message?: string; code?: string } | null | undefined,
  column: string,
): boolean {
  if (!error) return false
  const msg = (error.message ?? '').toLowerCase()
  const col = column.toLowerCase()
  return (
    error.code === '42703' ||
    (msg.includes(col) &&
      (msg.includes('does not exist') ||
        msg.includes('could not find') ||
        msg.includes('schema cache')))
  )
}
