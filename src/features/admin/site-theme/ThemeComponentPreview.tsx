import { memo, type CSSProperties, useId, useMemo } from 'react'
import { themeConfigToCssVars, type ThemeConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import { appearanceToDataTheme, type ThemePreset } from '@/features/cms/config/themeLibrary'

type ThemeComponentPreviewProps = {
  preset: ThemePreset
}

function presetVars(preset: ThemePreset): CSSProperties {
  const theme: ThemeConfig = {
    dataTheme: appearanceToDataTheme(preset.appearance),
    palette: preset.palette,
  }
  return themeConfigToCssVars(theme) as CSSProperties
}

/** Small labelled block wrapper. */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
        {title}
      </p>
      {children}
    </div>
  )
}

/**
 * Real-component preview (§12) — the Palette Mockup. Renders the actual
 * interface surfaces a theme touches — chrome, commerce, forms, overlays,
 * effects — all consuming semantic tokens inside a scoped CSS-variable
 * container so editors see the full system, not swatches. Internally
 * responsive (fills its rail column); memoized so the mockup + its derived
 * CSS-var map only recompute when the edited preset actually changes.
 */
export const ThemeComponentPreview = memo(function ThemeComponentPreview({
  preset,
}: ThemeComponentPreviewProps) {
  const fieldId = useId()
  const vars = useMemo(() => presetVars(preset), [preset])
  return (
    <div
      data-testid="theme-component-preview"
      data-theme={appearanceToDataTheme(preset.appearance)}
      className="mx-auto w-full overflow-hidden rounded-2xl border border-[var(--color-line)]"
      style={vars}
    >
      <div
        className="space-y-6 p-5"
        style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
      >
        {/* Header + announcement */}
        <div className="-mx-5 -mt-5">
          <div
            className="px-5 py-1.5 text-center text-[10px] uppercase tracking-[0.24em]"
            style={{ background: 'var(--color-highlight)', color: 'var(--color-on-highlight)' }}
          >
            Free shipping over $150
          </div>
          <div
            className="flex items-center justify-between border-b px-5 py-3"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
          >
            <span
              className="text-sm font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--color-heading)', fontFamily: 'var(--font-heading)' }}
            >
              ANVL
            </span>
            <nav className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span style={{ color: 'var(--color-heading)' }}>Shop</span>
              <span>Story</span>
              <span>Account</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-xl border p-5"
          style={{
            borderColor: 'var(--color-line)',
            background:
              'radial-gradient(ellipse 60% 80% at 80% 30%, var(--hero-accent-glow), transparent 60%), var(--hero-background)',
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--color-accent)' }}>
            Drop 01 — The Oath
          </p>
          <h3
            className="mt-2 text-2xl uppercase leading-none"
            style={{ color: 'var(--color-heading)', fontFamily: 'var(--font-heading)', textShadow: 'var(--hero-text-shadow)' }}
          >
            Forged under pressure
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="focus-ring rounded-md px-4 py-2 text-xs font-semibold"
              style={{ background: 'var(--color-accent)', color: 'var(--color-on-accent)' }}
            >
              Shop the drop
            </button>
            <button
              type="button"
              className="focus-ring rounded-md border px-4 py-2 text-xs font-semibold"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-text)' }}
            >
              The story
            </button>
            <a href="#" className="self-center text-xs underline" style={{ color: 'var(--color-accent)' }}>
              Size guide
            </a>
          </div>
        </div>

        {/* Product card + commerce states */}
        <Group title="Product card">
          <div
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: 'var(--color-line)', background: 'var(--color-surface)' }}
          >
            <div className="relative aspect-[4/3]" style={{ background: 'var(--color-surface-soft)' }}>
              <span
                className="absolute left-2 top-2 rounded px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
                style={{ background: 'var(--color-accent)', color: 'var(--color-on-accent)' }}
              >
                Limited
              </span>
            </div>
            <div className="space-y-2 p-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-heading)' }}>
                The Oath Compression Tee
              </p>
              <p className="text-sm">
                <span style={{ color: 'var(--color-danger)' }}>$48</span>{' '}
                <span className="line-through" style={{ color: 'var(--color-text-muted)' }}>$60</span>
              </p>
              {/* Size selector */}
              <div className="flex gap-1.5 pt-1">
                {['S', 'M', 'L', 'XL'].map((size, i) => (
                  <span
                    key={size}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border text-[11px]"
                    style={
                      i === 1
                        ? { background: 'var(--color-accent)', color: 'var(--color-on-accent)', borderColor: 'var(--color-accent)' }
                        : i === 3
                          ? { borderColor: 'var(--color-line)', color: 'var(--color-disabled)', opacity: 0.5, textDecoration: 'line-through' }
                          : { borderColor: 'var(--color-line)', color: 'var(--color-text)' }
                    }
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Group>

        {/* Form states */}
        <Group title="Form">
          <div className="space-y-2">
            <label htmlFor={fieldId} className="block text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Email
            </label>
            <input
              id={fieldId}
              defaultValue="athlete@anvl.com"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-focus-ring)',
                color: 'var(--color-text)',
                boxShadow: '0 0 0 2px var(--color-focus-ring)',
              }}
            />
            <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
              Enter a valid email address.
            </p>
            <p className="text-xs" style={{ color: 'var(--color-success)' }}>
              Looks good.
            </p>
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-sm"
                style={{ background: 'var(--color-accent)', color: 'var(--color-on-accent)' }}
              >
                ✓
              </span>
              Subscribe to drop alerts
            </label>
          </div>
        </Group>

        {/* Overlay: modal / drawer / checkout */}
        <Group title="Overlay & checkout">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: 'var(--color-line)', background: 'var(--color-surface-elevated)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--color-heading)' }}>
              Order summary
            </p>
            <div className="mt-2 space-y-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span style={{ color: 'var(--color-text)' }}>$96.00</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span style={{ color: 'var(--color-success)' }}>Free</span>
              </div>
              <div
                className="flex justify-between border-t pt-1 text-sm font-semibold"
                style={{ borderColor: 'var(--color-line)', color: 'var(--color-heading)' }}
              >
                <span>Total</span>
                <span>$96.00</span>
              </div>
            </div>
            <button
              type="button"
              className="focus-ring mt-3 w-full rounded-md py-2 text-xs font-semibold"
              style={{ background: 'var(--color-accent)', color: 'var(--color-on-accent)' }}
            >
              Checkout
            </button>
          </div>
        </Group>

        {/* Effects: particles + scrollbar */}
        <Group title="Effects">
          <div className="grid grid-cols-2 gap-2">
            <div
              className="relative h-16 overflow-hidden rounded-lg border"
              style={{ borderColor: 'var(--color-line)', background: 'var(--color-bg)' }}
            >
              <span className="absolute left-2 top-2 text-[9px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                Particles
              </span>
              <span className="absolute right-3 top-6 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--particle-primary)' }} />
              <span className="absolute right-7 top-9 h-1 w-1 rounded-full" style={{ background: 'var(--particle-secondary)' }} />
              <span className="absolute right-5 top-4 h-1 w-1 rounded-full" style={{ background: 'var(--particle-highlight)' }} />
            </div>
            <div
              className="flex h-16 items-center gap-2 rounded-lg border px-2"
              style={{ borderColor: 'var(--color-line)', background: 'var(--color-surface)' }}
            >
              <span className="text-[9px] uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                Scroll
              </span>
              <span className="h-10 w-2.5 rounded-full" style={{ background: 'var(--scrollbar-track)' }}>
                <span className="block h-5 w-2.5 rounded-full" style={{ background: 'var(--scrollbar-thumb)' }} />
              </span>
            </div>
          </div>
        </Group>
      </div>
    </div>
  )
})
