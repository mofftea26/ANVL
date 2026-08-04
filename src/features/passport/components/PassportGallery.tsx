import { useState } from 'react'

import { cn } from '@/shared/lib/cn'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'

/**
 * The piece, seen properly.
 *
 * `piece.gallery` was authored in the CMS and reached nothing: every consumer
 * read `gallery[0]` and only as a FALLBACK for a missing hero render, so the
 * second image onward existed solely in the database. This is the surface that
 * pays that authoring off, and it is why the section exists at all.
 *
 * One large frame plus a thumbnail rail rather than a grid of equals — a
 * passport is a document about ONE object, and a grid invites comparison
 * between shots instead of attention to the piece.
 */
export function PassportGallery({
  gallery,
  productName,
}: {
  gallery: ResolvedPassportContent['piece']['gallery']
  productName: string
}) {
  const [active, setActive] = useState(0)
  if (gallery.length === 0) return null

  const current = gallery[Math.min(active, gallery.length - 1)]
  if (!current) return null

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_88%,transparent)]">
        <img
          src={current.src}
          alt={current.alt || productName}
          // Contain, never cover: these are product shots on a plate, and
          // cropping one to fill a frame is how a hem or a cuff goes missing.
          className="mx-auto max-h-[46vh] w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>

      {gallery.length > 1 ? (
        <ul className="flex flex-wrap gap-2" aria-label={`${productName} views`}>
          {gallery.map((image, i) => (
            <li key={`${image.src}-${i}`}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                aria-label={`View ${i + 1} of ${gallery.length}`}
                className={cn(
                  'focus-ring h-14 w-14 overflow-hidden rounded-lg border transition-opacity',
                  i === active
                    ? 'border-[var(--color-highlight-bright)] opacity-100'
                    : 'border-[var(--color-line)] opacity-60 hover:opacity-100',
                )}
              >
                <img
                  src={image.src}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
