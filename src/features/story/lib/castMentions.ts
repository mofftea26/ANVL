import type { StoryCastMember } from '@/features/story/schemas/story.schema'

/**
 * A run of act-body text, split into plain text and cast mentions.
 */
export type MentionSegment =
  | { type: 'text'; text: string }
  | { type: 'mention'; text: string; member: StoryCastMember }

const WORD = /[\p{L}\p{N}]/u

/** A position is a word boundary when the neighbouring char is not alphanumeric. */
function isBoundary(ch: string | undefined): boolean {
  return ch === undefined || !WORD.test(ch)
}

/**
 * Split an act paragraph into plain text + cast mentions.
 *
 * MENTION MECHANISM (chosen over fuzzy matching): explicit name matching, but
 * deliberately constrained so it is robust rather than fragile —
 *   - only THIS chapter's enlisted cast display names are candidates;
 *   - names are tried LONGEST-FIRST, so "Jad Haddad" wins over "Jad";
 *   - a name matches only at WORD BOUNDARIES (never inside another word);
 *   - each character of the source text belongs to at most one mention (the
 *     cursor advances past a match, so mentions never overlap).
 * Matching is case-insensitive; the original casing from the text is kept in
 * the output segment. Authors simply type the enlisted athlete's name — no
 * markup — and it lights up wherever it appears.
 */
export function splitCastMentions(
  text: string,
  cast: readonly StoryCastMember[],
): MentionSegment[] {
  const named = cast
    .map((m) => ({ member: m, name: m.name.trim() }))
    .filter((m) => m.name.length >= 2)
    .sort((a, b) => b.name.length - a.name.length)
  if (named.length === 0) return [{ type: 'text', text }]

  const lower = text.toLowerCase()
  const segments: MentionSegment[] = []
  let cursor = 0
  let buffer = ''

  const flush = () => {
    if (buffer) {
      segments.push({ type: 'text', text: buffer })
      buffer = ''
    }
  }

  while (cursor < text.length) {
    let matched: { member: StoryCastMember; length: number } | null = null
    for (const { member, name } of named) {
      const len = name.length
      if (lower.startsWith(name.toLowerCase(), cursor)) {
        if (isBoundary(text[cursor - 1]) && isBoundary(text[cursor + len])) {
          matched = { member, length: len }
          break
        }
      }
    }
    if (matched) {
      flush()
      segments.push({
        type: 'mention',
        text: text.slice(cursor, cursor + matched.length),
        member: matched.member,
      })
      cursor += matched.length
    } else {
      buffer += text[cursor]
      cursor += 1
    }
  }
  flush()
  return segments
}

/** True when the cast member links to a public guest armory. */
export function castMentionHref(member: StoryCastMember): string | null {
  const handle = member.armoryHandle?.trim()
  return handle ? `/armory/${handle}` : null
}
