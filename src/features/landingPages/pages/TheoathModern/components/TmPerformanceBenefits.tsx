import {
  Anvil,
  Droplets,
  Hexagon,
  Move,
  Shield,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import { sanitizeHref } from '@/shared/lib/url'
import type { TmResolvedContent } from '../content/theoathModernContent.defaults'
import { TmEyebrow, TmSectionShell } from './TmPrimitives'

/** CMS icon token → lucide icon. Unknown tokens fall back to a neutral mark. */
const ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  thermometer: Thermometer,
  move: Move,
  droplets: Droplets,
  wind: Wind,
  anvil: Anvil,
}

export function TmPerformanceBenefits({
  content,
}: {
  content: TmResolvedContent
}) {
  const { benefits } = content
  return (
    <TmSectionShell section="benefits">
      <TmEyebrow>{benefits.eyebrow}</TmEyebrow>
      <h2
        data-tm-heading
        data-tm-reveal-m
        className="anvl-heading mt-4 text-3xl uppercase leading-tight sm:text-4xl lg:text-5xl"
      >
        {benefits.title}
      </h2>
      <ul data-tm-parallax="0.05" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.items.map((b) => {
          const Icon = ICONS[b.icon] ?? Hexagon
          const href = b.href ? sanitizeHref(b.href) : ''
          const inner = (
            <>
              <Icon
                aria-hidden="true"
                className="h-6 w-6 text-[color:var(--color-highlight)]"
                strokeWidth={1.5}
              />
              <h3 className="anvl-heading mt-4 text-lg uppercase">{b.heading}</h3>
              <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
                {b.description}
              </p>
            </>
          )
          return (
            <li
              key={b.id}
              data-tm-reveal-m
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]"
            >
              {href ? (
                <a href={href} className="focus-ring block">
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          )
        })}
      </ul>
    </TmSectionShell>
  )
}
