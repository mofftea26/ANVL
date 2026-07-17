import type { ComponentType, ReactNode } from 'react'
import { BookOpen, FileText, Flame, Package, Users } from '@/shared/icons'
import { cn } from '@/shared/lib/cn'
import type { SearchDocumentType, SearchResult } from '@/features/search/types/search.types'

const TYPE_ICON: Record<SearchDocumentType, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  product: Package,
  'pdp-tile': Package,
  'story-chapter': BookOpen,
  'story-act': BookOpen,
  'story-cast': Users,
  'about-orb': Flame,
  'static-page': FileText,
}

/** Wraps the character ranges Fuse matched on `title` in a highlight span. */
function highlightTitle(title: string, result: SearchResult) {
  const match = result.matches.find((m) => m.key === 'title')
  if (!match || match.indices.length === 0) return title

  const nodes: ReactNode[] = []
  let cursor = 0
  match.indices.forEach(([start, end], i) => {
    if (start > cursor) nodes.push(title.slice(cursor, start))
    nodes.push(
      <mark key={i} className="rounded-[2px] bg-[var(--color-highlight)]/25 text-[var(--color-heading)]">
        {title.slice(start, end + 1)}
      </mark>,
    )
    cursor = end + 1
  })
  if (cursor < title.length) nodes.push(title.slice(cursor))
  return nodes
}

export function SearchResultRow({
  result,
  active,
  onClick,
  id,
}: {
  result: SearchResult
  active: boolean
  onClick: () => void
  id?: string
}) {
  const Icon = TYPE_ICON[result.document.type]
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'focus-ring flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        active ? 'bg-[var(--color-surface-elevated)]' : 'hover:bg-[var(--color-surface-elevated)]',
      )}
    >
      <Icon size={15} aria-hidden={true} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-[var(--color-heading)]">
          {highlightTitle(result.document.title, result)}
        </span>
        {result.document.subtitle ? (
          <span className="anvl-micro block truncate text-[var(--color-text-muted)]">
            {result.document.subtitle}
          </span>
        ) : null}
      </span>
    </button>
  )
}
