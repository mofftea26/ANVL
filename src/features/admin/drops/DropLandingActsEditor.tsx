import { useMemo } from 'react'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import type { DropLandingContent } from '@/features/admin/drops/drops.types'
import type { LandingAct } from '@/features/admin/drops/acts/landingActs.types'
import type { LandingActSlot } from '@/features/admin/drops/drops.actSequence'
import { DropActsBuilderPanel } from '@/features/admin/drops/DropActsBuilderPanel'

const fieldClass =
  'mt-1 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]'

interface Props {
  value: DropLandingContent
  onChange: (next: DropLandingContent) => void
  acts: LandingAct[]
  landingActSequence: LandingActSlot[]
  onActsChange: (next: {
    acts: LandingAct[]
    landingActSequence: LandingActSlot[]
  }) => void
}

export function DropLandingActsEditor({
  value,
  onChange,
  acts,
  landingActSequence,
  onActsChange,
}: Props) {
  const lc = value

  const landingContentJson = useMemo(() => JSON.stringify(lc), [lc])

  const tenetLines = useMemo(
    () => lc.manifesto.tenets.map((t) => t.text).join('\n'),
    [lc.manifesto.tenets],
  )

  const bulletLines = useMemo(
    () => lc.waitlist.bullets.map((b) => b.text).join('\n'),
    [lc.waitlist.bullets],
  )

  const wordsLine = useMemo(() => lc.dropReveal.words.join(', '), [lc.dropReveal.words])

  return (
    <div className="space-y-6">
      <DropActsBuilderPanel
        landingContentJson={landingContentJson}
        acts={acts}
        landingActSequence={landingActSequence}
        onChange={onActsChange}
      />

      <AdminCard title="Act I — Hero" description="Opening forge narration and CTAs.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs text-[var(--color-text-muted)]">
            Act label
            <input
              className={fieldClass}
              value={lc.hero.actLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  hero: { ...lc.hero, actLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-xs text-[var(--color-text-muted)]">
            Badge
            <input
              className={fieldClass}
              value={lc.hero.badgeText}
              onChange={(e) =>
                onChange({
                  ...lc,
                  hero: { ...lc.hero, badgeText: e.target.value },
                })
              }
            />
          </label>
          <label className="col-span-full block text-xs text-[var(--color-text-muted)]">
            Title
            <input
              className={fieldClass}
              value={lc.hero.title}
              onChange={(e) =>
                onChange({
                  ...lc,
                  hero: { ...lc.hero, title: e.target.value },
                })
              }
            />
          </label>
          <label className="col-span-full block text-xs text-[var(--color-text-muted)]">
            Subtitle
            <textarea
              className={`${fieldClass} min-h-[88px]`}
              value={lc.hero.subtitle}
              onChange={(e) =>
                onChange({
                  ...lc,
                  hero: { ...lc.hero, subtitle: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-xs text-[var(--color-text-muted)]">
            Primary CTA label
            <input
              className={fieldClass}
              value={lc.hero.primaryCta.label}
              onChange={(e) =>
                onChange({
                  ...lc,
                  hero: {
                    ...lc.hero,
                    primaryCta: { ...lc.hero.primaryCta, label: e.target.value },
                  },
                })
              }
            />
          </label>
          <label className="block text-xs text-[var(--color-text-muted)]">
            Primary CTA href
            <input
              className={fieldClass}
              value={lc.hero.primaryCta.href}
              onChange={(e) =>
                onChange({
                  ...lc,
                  hero: {
                    ...lc.hero,
                    primaryCta: { ...lc.hero.primaryCta, href: e.target.value },
                  },
                })
              }
            />
          </label>
          <label className="block text-xs text-[var(--color-text-muted)]">
            Secondary CTA label
            <input
              className={fieldClass}
              value={lc.hero.secondaryCta.label}
              onChange={(e) =>
                onChange({
                  ...lc,
                  hero: {
                    ...lc.hero,
                    secondaryCta: { ...lc.hero.secondaryCta, label: e.target.value },
                  },
                })
              }
            />
          </label>
          <label className="block text-xs text-[var(--color-text-muted)]">
            Secondary CTA href
            <input
              className={fieldClass}
              value={lc.hero.secondaryCta.href}
              onChange={(e) =>
                onChange({
                  ...lc,
                  hero: {
                    ...lc.hero,
                    secondaryCta: { ...lc.hero.secondaryCta, href: e.target.value },
                  },
                })
              }
            />
          </label>
        </div>
        <div className="mt-5 grid gap-3">
          <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
            Hero meta strip (3 slots)
          </p>
          {lc.hero.meta.map((row, idx) => (
            <div
              key={row.id}
              className="grid gap-2 rounded-lg border border-[var(--color-line)] p-3 md:grid-cols-2"
            >
              <label className="text-xs text-[var(--color-text-muted)]">
                Label
                <input
                  className={fieldClass}
                  value={row.label}
                  onChange={(e) => {
                    const meta = lc.hero.meta.map((m, i) =>
                      i === idx ? { ...m, label: e.target.value } : m,
                    )
                    onChange({ ...lc, hero: { ...lc.hero, meta } })
                  }}
                />
              </label>
              <label className="text-xs text-[var(--color-text-muted)]">
                Value
                <input
                  className={fieldClass}
                  value={row.value}
                  onChange={(e) => {
                    const meta = lc.hero.meta.map((m, i) =>
                      i === idx ? { ...m, value: e.target.value } : m,
                    )
                    onChange({ ...lc, hero: { ...lc.hero, meta } })
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Act II — Manifesto" description="Tenets ledger and intro.">
        <div className="grid gap-4">
          <label className="text-xs text-[var(--color-text-muted)]">
            Act label
            <input
              className={fieldClass}
              value={lc.manifesto.actLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  manifesto: { ...lc.manifesto, actLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Counter label
            <input
              className={fieldClass}
              value={lc.manifesto.counterLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  manifesto: { ...lc.manifesto, counterLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Heading
            <textarea
              className={`${fieldClass} min-h-[72px]`}
              value={lc.manifesto.heading}
              onChange={(e) =>
                onChange({
                  ...lc,
                  manifesto: { ...lc.manifesto, heading: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Intro
            <textarea
              className={`${fieldClass} min-h-[96px]`}
              value={lc.manifesto.intro}
              onChange={(e) =>
                onChange({
                  ...lc,
                  manifesto: { ...lc.manifesto, intro: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Tenets (one per line)
            <textarea
              className={`${fieldClass} min-h-[140px]`}
              value={tenetLines}
              onChange={(e) => {
                const lines = e.target.value
                  .split('\n')
                  .map((l) => l.trim())
                  .filter(Boolean)
                const prev = lc.manifesto.tenets
                const tenets = lines.map((text, i) => ({
                  id: prev[i]?.id ?? createCmsId('tenet'),
                  text,
                  isVisible: prev[i]?.isVisible ?? true,
                }))
                onChange({
                  ...lc,
                  manifesto: { ...lc.manifesto, tenets },
                })
              }}
            />
          </label>
        </div>
      </AdminCard>

      <AdminCard title="Act III — Drop reveal" description="Typographic monolith and stats.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs text-[var(--color-text-muted)]">
            Act label
            <input
              className={fieldClass}
              value={lc.dropReveal.actLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  dropReveal: { ...lc.dropReveal, actLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Counter label
            <input
              className={fieldClass}
              value={lc.dropReveal.counterLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  dropReveal: { ...lc.dropReveal, counterLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="col-span-full text-xs text-[var(--color-text-muted)]">
            Words (comma separated)
            <input
              className={fieldClass}
              value={wordsLine}
              onChange={(e) => {
                const words = e.target.value
                  .split(',')
                  .map((w) => w.trim())
                  .filter(Boolean)
                onChange({
                  ...lc,
                  dropReveal: { ...lc.dropReveal, words },
                })
              }}
            />
          </label>
          <label className="col-span-full text-xs text-[var(--color-text-muted)]">
            Tagline
            <textarea
              className={`${fieldClass} min-h-[96px]`}
              value={lc.dropReveal.tagline}
              onChange={(e) =>
                onChange({
                  ...lc,
                  dropReveal: { ...lc.dropReveal, tagline: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Primary CTA label
            <input
              className={fieldClass}
              value={lc.dropReveal.primaryCta.label}
              onChange={(e) =>
                onChange({
                  ...lc,
                  dropReveal: {
                    ...lc.dropReveal,
                    primaryCta: { ...lc.dropReveal.primaryCta, label: e.target.value },
                  },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Primary CTA href
            <input
              className={fieldClass}
              value={lc.dropReveal.primaryCta.href}
              onChange={(e) =>
                onChange({
                  ...lc,
                  dropReveal: {
                    ...lc.dropReveal,
                    primaryCta: { ...lc.dropReveal.primaryCta, href: e.target.value },
                  },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Secondary CTA label
            <input
              className={fieldClass}
              value={lc.dropReveal.secondaryCta.label}
              onChange={(e) =>
                onChange({
                  ...lc,
                  dropReveal: {
                    ...lc.dropReveal,
                    secondaryCta: { ...lc.dropReveal.secondaryCta, label: e.target.value },
                  },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Secondary CTA href
            <input
              className={fieldClass}
              value={lc.dropReveal.secondaryCta.href}
              onChange={(e) =>
                onChange({
                  ...lc,
                  dropReveal: {
                    ...lc.dropReveal,
                    secondaryCta: { ...lc.dropReveal.secondaryCta, href: e.target.value },
                  },
                })
              }
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3">
          <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">Stats strip</p>
          {lc.dropReveal.stats.map((row, idx) => (
            <div
              key={row.id}
              className="grid gap-2 rounded-lg border border-[var(--color-line)] p-3 md:grid-cols-2"
            >
              <label className="text-xs text-[var(--color-text-muted)]">
                Label
                <input
                  className={fieldClass}
                  value={row.label}
                  onChange={(e) => {
                    const stats = lc.dropReveal.stats.map((s, i) =>
                      i === idx ? { ...s, label: e.target.value } : s,
                    )
                    onChange({
                      ...lc,
                      dropReveal: { ...lc.dropReveal, stats },
                    })
                  }}
                />
              </label>
              <label className="text-xs text-[var(--color-text-muted)]">
                Value
                <input
                  className={fieldClass}
                  value={row.value}
                  onChange={(e) => {
                    const stats = lc.dropReveal.stats.map((s, i) =>
                      i === idx ? { ...s, value: e.target.value } : s,
                    )
                    onChange({
                      ...lc,
                      dropReveal: { ...lc.dropReveal, stats },
                    })
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Act IV — Pieces" description="Pieces grid framing copy.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs text-[var(--color-text-muted)]">
            Act label
            <input
              className={fieldClass}
              value={lc.pieces.actLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  pieces: { ...lc.pieces, actLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Heading line one
            <input
              className={fieldClass}
              value={lc.pieces.headingLineOne}
              onChange={(e) =>
                onChange({
                  ...lc,
                  pieces: { ...lc.pieces, headingLineOne: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)] md:col-span-2">
            Heading line two
            <input
              className={fieldClass}
              value={lc.pieces.headingLineTwo}
              onChange={(e) =>
                onChange({
                  ...lc,
                  pieces: { ...lc.pieces, headingLineTwo: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            View all label
            <input
              className={fieldClass}
              value={lc.pieces.viewAllLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  pieces: { ...lc.pieces, viewAllLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            View all href
            <input
              className={fieldClass}
              value={lc.pieces.viewAllHref}
              onChange={(e) =>
                onChange({
                  ...lc,
                  pieces: { ...lc.pieces, viewAllHref: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)] md:col-span-2">
            Footer left text
            <input
              className={fieldClass}
              value={lc.pieces.footerLeftText}
              onChange={(e) =>
                onChange({
                  ...lc,
                  pieces: { ...lc.pieces, footerLeftText: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Footer link label
            <input
              className={fieldClass}
              value={lc.pieces.footerLinkLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  pieces: { ...lc.pieces, footerLinkLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Footer link href
            <input
              className={fieldClass}
              value={lc.pieces.footerLinkHref}
              onChange={(e) =>
                onChange({
                  ...lc,
                  pieces: { ...lc.pieces, footerLinkHref: e.target.value },
                })
              }
            />
          </label>
        </div>
      </AdminCard>

      <AdminCard title="Act V — Materials" description="Materials runway entries.">
        <div className="grid gap-4">
          <label className="text-xs text-[var(--color-text-muted)]">
            Act label
            <input
              className={fieldClass}
              value={lc.materials.actLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  materials: { ...lc.materials, actLabel: e.target.value },
                })
              }
            />
          </label>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-[var(--color-text-muted)]">
              Counter suffix
              <input
                className={fieldClass}
                value={lc.materials.counterSuffix}
                onChange={(e) =>
                  onChange({
                    ...lc,
                    materials: { ...lc.materials, counterSuffix: e.target.value },
                  })
                }
              />
            </label>
            <label className="text-xs text-[var(--color-text-muted)]">
              Heading
              <input
                className={fieldClass}
                value={lc.materials.heading}
                onChange={(e) =>
                  onChange({
                    ...lc,
                    materials: { ...lc.materials, heading: e.target.value },
                  })
                }
              />
            </label>
          </div>
          <label className="text-xs text-[var(--color-text-muted)]">
            Intro
            <textarea
              className={`${fieldClass} min-h-[88px]`}
              value={lc.materials.intro}
              onChange={(e) =>
                onChange({
                  ...lc,
                  materials: { ...lc.materials, intro: e.target.value },
                })
              }
            />
          </label>
          <div className="space-y-4">
            {lc.materials.materials.map((mat, idx) => (
              <div
                key={mat.id}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/40 p-4"
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-xs text-[var(--color-text-muted)]">
                    Code
                    <input
                      className={fieldClass}
                      value={mat.code}
                      onChange={(e) => {
                        const materials = lc.materials.materials.map((m, i) =>
                          i === idx ? { ...m, code: e.target.value } : m,
                        )
                        onChange({
                          ...lc,
                          materials: { ...lc.materials, materials },
                        })
                      }}
                    />
                  </label>
                  <label className="text-xs text-[var(--color-text-muted)] md:col-span-2">
                    Title
                    <input
                      className={fieldClass}
                      value={mat.title}
                      onChange={(e) => {
                        const materials = lc.materials.materials.map((m, i) =>
                          i === idx ? { ...m, title: e.target.value } : m,
                        )
                        onChange({
                          ...lc,
                          materials: { ...lc.materials, materials },
                        })
                      }}
                    />
                  </label>
                </div>
                <label className="mt-3 block text-xs text-[var(--color-text-muted)]">
                  Description
                  <textarea
                    className={`${fieldClass} min-h-[72px]`}
                    value={mat.description}
                    onChange={(e) => {
                      const materials = lc.materials.materials.map((m, i) =>
                        i === idx ? { ...m, description: e.target.value } : m,
                      )
                      onChange({
                        ...lc,
                        materials: { ...lc.materials, materials },
                      })
                    }}
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mat.isFeatured}
                      onChange={(e) => {
                        const materials = lc.materials.materials.map((m, i) =>
                          i === idx ? { ...m, isFeatured: e.target.checked } : m,
                        )
                        onChange({
                          ...lc,
                          materials: { ...lc.materials, materials },
                        })
                      }}
                    />
                    Featured
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mat.isVisible !== false}
                      onChange={(e) => {
                        const materials = lc.materials.materials.map((m, i) =>
                          i === idx ? { ...m, isVisible: e.target.checked } : m,
                        )
                        onChange({
                          ...lc,
                          materials: { ...lc.materials, materials },
                        })
                      }}
                    />
                    Visible
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Act VI — Waitlist" description="Final oath section & form labels.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs text-[var(--color-text-muted)]">
            Act label
            <input
              className={fieldClass}
              value={lc.waitlist.actLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  waitlist: { ...lc.waitlist, actLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="text-xs text-[var(--color-text-muted)]">
            Right label
            <input
              className={fieldClass}
              value={lc.waitlist.rightLabel}
              onChange={(e) =>
                onChange({
                  ...lc,
                  waitlist: { ...lc.waitlist, rightLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="col-span-full text-xs text-[var(--color-text-muted)]">
            Heading
            <input
              className={fieldClass}
              value={lc.waitlist.heading}
              onChange={(e) =>
                onChange({
                  ...lc,
                  waitlist: { ...lc.waitlist, heading: e.target.value },
                })
              }
            />
          </label>
          <label className="col-span-full text-xs text-[var(--color-text-muted)]">
            Intro
            <textarea
              className={`${fieldClass} min-h-[88px]`}
              value={lc.waitlist.intro}
              onChange={(e) =>
                onChange({
                  ...lc,
                  waitlist: { ...lc.waitlist, intro: e.target.value },
                })
              }
            />
          </label>
          <label className="col-span-full text-xs text-[var(--color-text-muted)]">
            Bullets (one per line)
            <textarea
              className={`${fieldClass} min-h-[120px]`}
              value={bulletLines}
              onChange={(e) => {
                const lines = e.target.value
                  .split('\n')
                  .map((l) => l.trim())
                  .filter(Boolean)
                const prev = lc.waitlist.bullets
                const bullets = lines.map((text, i) => ({
                  id: prev[i]?.id ?? createCmsId('bullet'),
                  text,
                  isVisible: prev[i]?.isVisible ?? true,
                }))
                onChange({
                  ...lc,
                  waitlist: { ...lc.waitlist, bullets },
                })
              }}
            />
          </label>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {(Object.entries(lc.waitlist.form) as Array<[string, string]>).map(
            ([key, val]) => (
              <label key={key} className="text-xs text-[var(--color-text-muted)]">
                Form: {key}
                <input
                  className={fieldClass}
                  value={val}
                  onChange={(e) =>
                    onChange({
                      ...lc,
                      waitlist: {
                        ...lc.waitlist,
                        form: { ...lc.waitlist.form, [key]: e.target.value },
                      },
                    })
                  }
                />
              </label>
            ),
          )}
        </div>
      </AdminCard>
    </div>
  )
}
