import { cn } from '@/shared/lib/cn'
import { OATH_META } from '../data'

/** Coordinates-style technical metadata strip (editorial detail). */
export function SceneMeta({ className }: { className?: string }) {
  return (
    <dl
      className={cn(
        'flex flex-wrap items-center gap-x-5 gap-y-1 text-[var(--color-text-muted)]',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <dt className="sr-only">Coordinates</dt>
        <dd className="anvl-micro">{OATH_META.coords}</dd>
      </div>
      <div className="flex items-center gap-2">
        <dt className="sr-only">Origin</dt>
        <dd className="anvl-micro">{OATH_META.origin}</dd>
      </div>
      <div className="flex items-center gap-2">
        <dt className="sr-only">Drop</dt>
        <dd className="anvl-micro text-[var(--color-accent)]">{OATH_META.drop}</dd>
      </div>
    </dl>
  )
}
