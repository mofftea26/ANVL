/**
 * Removes simple angle-bracket tag patterns from CMS plain-text fields.
 * React text nodes already escape HTML; this strips markup-like noise when
 * editors paste HTML into text areas (cleaner display and AT output).
 */
export function stripAngleBracketTags(value: string): string {
  return value.replace(/<[^>]*>/g, '')
}
