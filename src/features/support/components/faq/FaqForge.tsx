import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Container } from '@/shared/components/ui'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { JsonLd } from '@/shared/components/seo/JsonLd'
import { FaqSeamRow } from './FaqSeamRow'
import { FaqSearchField } from './FaqSearchField'
import { faqPageJsonLd } from './faqPageJsonLd'
import { filterFaqItems } from './faqSearch'
import { FAQ_RAIL_HEAT_HEIGHT, useFaqRailHeat } from './useFaqRailHeat'
import type { ResolvedFaqItem } from '@/features/cms/support/resolveSupportContent'

/**
 * "The Forge Seam" — the FAQ page's answer stack.
 *
 * A forge-lit slab holding a column of forged plates, one per question, wired
 * to a molten conduit that carries the heat to whichever plate is open. One
 * plate opens at a time; instant search filters the stack and marks the hits.
 *
 * The schema.org FAQPage block is always built from the *full* item list, never
 * the filtered view, so client-side searching can't affect rich results.
 */
export function FaqForge({ items }: { items: ResolvedFaqItem[] }) {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const heatRef = useRef<HTMLSpanElement | null>(null)
  const triggersRef = useRef(new Map<string, HTMLButtonElement>())

  const visible = useMemo(() => filterFaqItems(items, query), [items, query])
  /** Index in the unfiltered list, for the stamped serial — a plate keeps its number while filtering. */
  const serialById = useMemo(
    () => new Map(items.map((item, index) => [item.id, index])),
    [items],
  )

  // A filtered-out plate is closed by construction rather than by an effect, so
  // there is never a frame where the rail points at a row that isn't rendered.
  const openIndex = visible.findIndex((item) => item.id === openId)
  const effectiveOpenId = openIndex >= 0 ? openId : null

  useFaqRailHeat({ listRef, heatRef, openIndex })

  const registerTrigger = useCallback((id: string, node: HTMLButtonElement | null) => {
    if (node) triggersRef.current.set(id, node)
    else triggersRef.current.delete(id)
  }, [])

  const handleToggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id))
  }, [])

  /** Roving keyboard nav across the plates (WAI-ARIA accordion pattern). */
  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
      const order = visible.map((item) => item.id)
      const from = order.indexOf(id)
      if (from === -1) return

      let next = -1
      if (event.key === 'ArrowDown') next = (from + 1) % order.length
      else if (event.key === 'ArrowUp') next = (from - 1 + order.length) % order.length
      else if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = order.length - 1
      else return

      event.preventDefault()
      triggersRef.current.get(order[next]!)?.focus()
    },
    [visible],
  )

  // Deep links (`/faq#faq-shipping`) open and reveal that plate. Runs once on
  // mount only — after that the visitor's own toggling owns the open state.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash.startsWith('faq-')) return
    const id = hash.slice('faq-'.length)
    if (!items.some((item) => item.id === id)) return
    setOpenId(id)
    // Let the plate mount open before scrolling to its settled position.
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ block: 'center' })
    })
    return () => cancelAnimationFrame(frame)
  }, [items])

  if (items.length === 0) return null

  return (
    <section className="anvl-faq-slab">
      <JsonLd data={faqPageJsonLd(items)} />
      <div aria-hidden="true" className="anvl-faq-slab-glow" />
      <GrainOverlay intensity="subtle" />

      {/* Tight to the hero above, roomy before the footer CTA below. */}
      <Container className="relative z-10 max-w-4xl pt-8 pb-16 md:pt-10 md:pb-24">
        <header className="anvl-faq-masthead">
          <div>
            <p className="anvl-display anvl-faq-eyebrow">The answers</p>
            <h2 className="anvl-heading anvl-faq-title">Struck and settled</h2>
          </div>
          <FaqSearchField
            value={query}
            onChange={setQuery}
            resultCount={visible.length}
            totalCount={items.length}
          />
        </header>

        <div className="anvl-faq-stack">
          <span aria-hidden="true" className="anvl-faq-rail">
            <span
              ref={heatRef}
              className="anvl-faq-rail-heat"
              style={{ height: `${FAQ_RAIL_HEAT_HEIGHT}px` }}
            />
          </span>

          {visible.length > 0 ? (
            <ul ref={listRef} className="anvl-faq-list">
              {visible.map((item) => (
                <FaqSeamRow
                  key={item.id}
                  item={item}
                  index={serialById.get(item.id) ?? 0}
                  open={effectiveOpenId === item.id}
                  query={query}
                  onToggle={handleToggle}
                  onTriggerKeyDown={handleTriggerKeyDown}
                  registerTrigger={registerTrigger}
                />
              ))}
            </ul>
          ) : (
            <div className="anvl-faq-empty">
              <p className="anvl-faq-empty-title anvl-heading">Nothing forged yet</p>
              <p className="anvl-faq-empty-body">
                No answer matches “{query.trim()}”. Try a shorter word — or ask us
                directly and we'll add it to the ledger.
              </p>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
