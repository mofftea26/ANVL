import { useRef } from 'react'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { readActStr } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import { bindActEnterTransition } from '../shared/actTransitionBridge'
import { useGSAP } from '@/shared/lib/gsap'
import type { ActPresetProps } from '../types'

type Chapter = { id: string; title: string; body: string }

function parseChapters(content: Record<string, unknown> | undefined): Chapter[] {
  if (Array.isArray(content?.chapters)) {
    return (content.chapters as Chapter[]).filter((c) => c.title?.trim())
  }
  const title = readActStr(content, 'chapterTitle')
  const body = readActStr(content, 'chapterBody')
  if (title || body) {
    return [{ id: 'ch-1', title: title || 'Chapter', body }]
  }
  return []
}

export function OathNarrativeScrollPreset({ landing, row, emblemSrc }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const m = previewManifestoFields(landing.manifesto, row, 'storytelling')
  const chapters = parseChapters(row?.content as Record<string, unknown>)

  useActPresetMotion(rootRef, row, {
    staggerSelector: '[data-act-chapter]',
    words: '[data-act-word]',
  })

  useGSAP(
    () => {
      const host = rootRef.current
      if (!host) return
      return bindActEnterTransition(host, 'standard')
    },
    { scope: rootRef },
  )

  return (
    <ActPresetShell rootRef={rootRef} row={row} ariaLabel="Storytelling">
      <div className="relative">
        {emblemSrc ? (
          <img
            src={emblemSrc}
            alt=""
            className="pointer-events-none absolute -right-4 top-0 size-24 opacity-20 sm:size-32"
            aria-hidden
          />
        ) : null}
        <p data-act-eyebrow className="uppercase tracking-[0.32em] text-[var(--color-muted)]">
          {m.actLabel}
        </p>
        <h2 data-act-title className="mt-2 max-w-3xl font-display uppercase leading-[0.92] text-[var(--color-fg)]">
          <span data-act-word>{m.heading}</span>
        </h2>
        <div className="mt-[var(--act-gap)] space-y-4 sm:space-y-5">
          {(chapters.length ? chapters : [{ id: 'default', title: m.heading, body: m.intro }]).map(
            (ch, i) => (
              <article
                key={ch.id}
                data-act-chapter
                className="grid gap-2 border-l-2 border-[var(--color-accent)] pl-4 sm:grid-cols-[3rem_1fr]"
              >
                <span className="font-display text-xl text-[var(--color-accent)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-display text-base uppercase text-[var(--color-fg)]">
                    {ch.title}
                  </h3>
                  <p data-act-body className="mt-1 max-w-2xl text-[length:var(--act-body-size)] leading-snug text-[var(--color-muted)] line-clamp-3">
                    {ch.body}
                  </p>
                </div>
              </article>
            ),
          )}
        </div>
      </div>
    </ActPresetShell>
  )
}
