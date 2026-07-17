import { Anvil, Rows3 } from '@/shared/icons'
import { AnvlCompactMark } from '@/shared/assets/brand'
import type { AboutViewMode } from '../hooks/useAboutViewMode'

const TOGGLE_BUTTON =
  'focus-ring flex h-7 w-7 items-center justify-center rounded-full transition-colors'

/**
 * A small persistent header for the About page — a compact brand pill fixed
 * just under the site nav. Only rendered on altar-capable devices (desktop,
 * WebGL, no reduced motion); it carries the view switch so a reader can move
 * between the animated Forge Altar and the normal scrolling page at will —
 * and switch back, since choosing "normal" on a capable device would
 * otherwise strand them there.
 */
export function AboutHeader({
  mode,
  onChange,
}: {
  mode: AboutViewMode
  onChange: (mode: AboutViewMode) => void
}) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-[var(--anvl-header-h)] z-30 flex justify-center px-4 pt-3">
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_72%,transparent)] py-1.5 pl-2.5 pr-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <AnvlCompactMark className="h-4 w-4 shrink-0 text-[var(--color-heading)]" />
        <span className="anvl-display text-[10px] tracking-[0.28em] text-[var(--color-heading)]/85">
          About
        </span>
        <div
          role="group"
          aria-label="About page view"
          className="ml-1 flex items-center gap-0.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] p-0.5"
        >
          <button
            type="button"
            onClick={() => onChange('altar')}
            aria-pressed={mode === 'altar'}
            title="Animated Forge Altar"
            className={
              mode === 'altar'
                ? `${TOGGLE_BUTTON} bg-[var(--color-highlight)] text-[var(--color-bg)]`
                : `${TOGGLE_BUTTON} text-[var(--color-text-muted)] hover:text-[var(--color-heading)]`
            }
          >
            <Anvil size={15} aria-hidden="true" />
            <span className="sr-only">Animated Forge Altar view</span>
          </button>
          <button
            type="button"
            onClick={() => onChange('normal')}
            aria-pressed={mode === 'normal'}
            title="Classic page"
            className={
              mode === 'normal'
                ? `${TOGGLE_BUTTON} bg-[var(--color-highlight)] text-[var(--color-bg)]`
                : `${TOGGLE_BUTTON} text-[var(--color-text-muted)] hover:text-[var(--color-heading)]`
            }
          >
            <Rows3 size={15} aria-hidden="true" />
            <span className="sr-only">Classic scrolling view</span>
          </button>
        </div>
      </div>
    </header>
  )
}
