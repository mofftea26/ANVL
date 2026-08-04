import { Container } from '@/shared/components/ui'
import { ForgeAtmosphere } from './ForgeAtmosphere'

/**
 * The storefront's one page masthead — used by every doc page (FAQ, care
 * guide, size guide, contact, shipping, returns, and all four legal pages) so
 * they read as one system.
 *
 * Structure: a colossal solid ghost word entering from the right edge and
 * dissolving toward the headline (flat and untreated on purpose — an outlined
 * or embossed version reads dated at this scale), the eyebrow on its hairline,
 * the title in
 * forged champagne foil (the metallic treatment `StoryHero` gives "Kingdom",
 * struck around `--color-accent` — the palette's `primary` token), an optional
 * "Last updated" stamp, and the intro.
 *
 * Deliberately has **no** action slot: CTAs belong at the foot of a page
 * (`DocFooterCta`), not in its masthead.
 *
 * All copy is supplied by the caller, which sources it from the CMS
 * (`support_content` / `legal_content`) — this component owns layout only.
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/**
 * Formats an ISO `YYYY-MM-DD` date deterministically (no `Date`/`Intl`, so SSR
 * and client agree regardless of locale/timezone). Returns '' for anything that
 * is not a clean date string, so a blank stamp simply hides.
 */
export function formatDocDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!match) return ''
  const [, year, month, day] = match
  const monthName = MONTHS[Number(month) - 1]
  if (!monthName) return ''
  return `${monthName} ${Number(day)}, ${year}`
}

/**
 * The ghost word behind the title, derived from the title's first word so no
 * page has to wire one up: "Size guide" → SIZE, "Privacy policy" → PRIVACY.
 * Returns '' when the title yields nothing usable, which hides the watermark.
 */
export function deriveWatermark(title: string): string {
  const firstWord = title.trim().split(/\s+/)[0] ?? ''
  return firstWord.replace(/[^\p{L}\p{N}]/gu, '').toUpperCase()
}

/**
 * Splits a title so its final word can wear the foil, mirroring Story's
 * "The Forged / **Kingdom**". A single-word title has no lead, so the whole
 * thing is foiled.
 */
export function splitTitleForFoil(title: string): { lead: string; lastWord: string } {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return { lead: '', lastWord: title }
  return { lead: words.slice(0, -1).join(' '), lastWord: words[words.length - 1]! }
}

export interface PageMastheadProps {
  eyebrow: string
  title: string
  intro?: string
  /** ISO `YYYY-MM-DD`; blank hides the "Last updated" stamp. */
  updatedAt?: string
  /** Overrides the word derived from `title`. Pass '' to hide it entirely. */
  watermark?: string
}

export function PageMasthead({
  eyebrow,
  title,
  intro,
  updatedAt,
  watermark,
}: PageMastheadProps) {
  const formattedDate = updatedAt ? formatDocDate(updatedAt) : ''
  const ghost = watermark ?? deriveWatermark(title)
  const { lead, lastWord } = splitTitleForFoil(title)

  return (
    <section className="anvl-masthead">
      <div aria-hidden="true" className="anvl-masthead-atmos">
        <ForgeAtmosphere />
      </div>

      {ghost ? (
        <span aria-hidden="true" className="anvl-heading anvl-masthead-ghost">
          {ghost}
        </span>
      ) : null}

      <Container className="anvl-masthead-container">
        <p className="anvl-display anvl-masthead-eyebrow">{eyebrow}</p>

        {/* Two-tone, exactly like Story's "The Forged / Kingdom": the lead
            words stay bone and the final word catches the champagne foil. A
            one-word title is foiled whole. */}
        <h1 className="anvl-heading anvl-masthead-title">
          {lead ? `${lead} ` : null}
          <span className="anvl-foil-text">{lastWord}</span>
        </h1>

        <span aria-hidden="true" className="anvl-masthead-rule" />

        {formattedDate ? (
          <p className="anvl-micro anvl-masthead-stamp">Last updated {formattedDate}</p>
        ) : null}

        {intro ? <p className="anvl-masthead-intro">{intro}</p> : null}
      </Container>
    </section>
  )
}
