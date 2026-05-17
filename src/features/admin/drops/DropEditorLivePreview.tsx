import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Monitor, Smartphone, Tablet, Maximize2 } from 'lucide-react'
import { DropPreviewThemeScope } from '@/app/providers/ActiveDropThemeBridge'
import type { DropThemePalette } from '@/features/admin/drops/drops.types'
import type { LandingPageCmsContent } from '@/features/admin/landing-cms/landingCms.types'
import { PublicLandingActs } from '@/features/marketing/public-landing/PublicLandingActs'
import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'

type ViewportId = 'fit' | 'mobile' | 'tablet' | 'desktop'

type ViewportOption = {
  id: ViewportId
  label: string
  /** Numeric width used inside the iframe; `null` for Fit (no iframe). */
  width: number | null
  /** Icon for the toolbar pill. */
  Icon: typeof Monitor
}

const VIEWPORT_OPTIONS: ViewportOption[] = [
  { id: 'fit', label: 'Fit', width: null, Icon: Maximize2 },
  { id: 'mobile', label: 'Mobile', width: 390, Icon: Smartphone },
  { id: 'tablet', label: 'Tablet', width: 820, Icon: Tablet },
  { id: 'desktop', label: 'Desktop', width: 1280, Icon: Monitor },
]

/**
 * Forces the preview to render in a static "post-animation" state.
 *
 * The act components run in the parent window's JS context (the iframe only owns
 * DOM + CSS via React portal). That means GSAP's `matchMedia` evaluates against
 * the parent width, not the simulated iframe width — so trying to play hero /
 * reveal timelines inside a 390 px iframe would produce frozen `opacity:0` /
 * `y:115%` initial states. Neutralizing those via `!important` keeps the layout
 * preview accurate at every breakpoint without fighting the timeline.
 */
const PREVIEW_RESET_CSS = `
:root { color-scheme: dark; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--color-bg, #0b0b0c);
  color: var(--color-text, #e7e4df);
  font-family: var(--font-sans, "Manrope", system-ui, sans-serif);
  overflow-x: hidden;
}
/* Cancel GSAP intro states so the preview always shows the final layout. */
[data-hero-word],
[data-hero-badge],
[data-hero-sub],
[data-hero-ctas],
[data-hero-meta],
[data-hero-crest],
[data-hero-glow],
[data-hero-ember],
[data-hero-title],
[data-hero-vignette],
[data-drop-eyebrow],
[data-drop-counter],
[data-drop-monolith],
[data-drop-word],
[data-drop-tagline],
[data-drop-stat],
[data-drop-cta],
[data-drop-icon],
[data-oath-eyebrow],
[data-oath-counter],
[data-oath-intro],
[data-oath-word],
[data-oath-tenet],
[data-oath-rule],
[data-oath-shape],
[data-pieces-eyebrow],
[data-pieces-word],
[data-pieces-meta],
[data-pieces-card],
[data-pieces-footer],
[data-mm-eyebrow],
[data-mm-counter],
[data-mm-intro],
[data-mm-word],
[data-mm-card],
[data-join-eyebrow],
[data-join-word],
[data-join-intro],
[data-join-bullet],
[data-join-form],
[data-join-shape] {
  opacity: 1 !important;
  transform: none !important;
  transition: none !important;
}
[data-hero-ember] { opacity: 0.55 !important; }
[data-hero-vignette] { opacity: 0 !important; }
/* Never let anchor clicks navigate the parent inside the preview. */
a { pointer-events: none; }
/* Tight scroll inside the iframe so the section heights breathe correctly. */
.anvl-screen-section-fixed { height: var(--anvl-section-h, 100svh) !important; }
`.trim()

type BoundaryProps = { children: ReactNode }
type BoundaryState = { error: Error | null }

class DropEditorPreviewErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[DropEditorLivePreview]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-50"
        >
          <p className="anvl-micro text-[10px] font-semibold uppercase tracking-[0.2em]">
            CMS preview — render error
          </p>
          <p className="mt-2 text-sm text-amber-100/90">
            The preview hit invalid draft data or an unsupported combination. Fix the issue, then
            use &quot;Try again&quot;.
          </p>
          <p className="mt-2 font-mono text-xs text-amber-200/80">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-4 rounded-md border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-50 transition hover:bg-amber-500/30"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * Iframe wrapper that hosts a React subtree at a simulated viewport width. The
 * iframe is loaded with a minimal `srcDoc` scaffold, then we:
 *   - copy the parent's stylesheets, inline styles, and font preloads into the
 *     iframe `<head>` so the same Tailwind / CMS theme tokens render inside
 *   - install a `MutationObserver` on the parent `<head>` to mirror live HMR /
 *     active-drop theme `<style>` updates back into the iframe
 *   - inject `PREVIEW_RESET_CSS` so GSAP intro states never break the static
 *     preview layout
 *   - portal the React children into the iframe `<body>` via `createPortal`
 *
 * Result: act renderers receive a *real* viewport width inside the iframe, so
 * every `sm:` / `md:` / `lg:` Tailwind variant evaluates against the simulated
 * device width instead of the admin window width.
 */
function ViewportIframe({
  width,
  height,
  children,
  className,
}: {
  width: number
  height: string
  children: ReactNode
  className?: string
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [body, setBody] = useState<HTMLBodyElement | null>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let cancelled = false
    let observer: MutationObserver | null = null

    let initialized = false

    const initialize = () => {
      const doc = iframe.contentDocument
      if (!doc || cancelled) return
      // Idempotent: srcDoc iframes can run our handler twice (sync-ready + load
      // event). Re-running would leak a second MutationObserver and flicker the
      // cloned head; bail after the first successful pass.
      if (initialized) return
      initialized = true

      doc.head.innerHTML = ''

      const base = doc.createElement('base')
      base.href = window.location.origin + '/'
      doc.head.appendChild(base)

      const meta = doc.createElement('meta')
      meta.setAttribute('name', 'viewport')
      meta.setAttribute('content', 'width=device-width, initial-scale=1')
      doc.head.appendChild(meta)

      const charset = doc.createElement('meta')
      charset.setAttribute('charset', 'utf-8')
      doc.head.appendChild(charset)

      const fontPreloads = document.head.querySelectorAll(
        'style, link[rel="stylesheet"], link[rel="preload"][as="style"], link[rel="preload"][as="font"], link[rel="preconnect"]',
      )
      fontPreloads.forEach((node) => doc.head.appendChild(node.cloneNode(true)))

      const reset = doc.createElement('style')
      reset.dataset['anvlPreviewReset'] = 'true'
      reset.textContent = PREVIEW_RESET_CSS
      doc.head.appendChild(reset)

      doc.documentElement.classList.add('anvl-preview-iframe')

      setBody(doc.body as HTMLBodyElement)

      observer?.disconnect()
      observer = new MutationObserver((muts) => {
        muts.forEach((m) => {
          m.addedNodes.forEach((n) => {
            if (
              n instanceof HTMLElement &&
              (n.tagName === 'STYLE' || n.tagName === 'LINK')
            ) {
              doc.head.appendChild(n.cloneNode(true))
            }
          })
        })
      })
      observer.observe(document.head, { childList: true })
    }

    iframe.addEventListener('load', initialize)
    if (iframe.contentDocument?.readyState === 'complete') {
      initialize()
    }

    return () => {
      cancelled = true
      iframe.removeEventListener('load', initialize)
      observer?.disconnect()
    }
  }, [])

  return (
    <>
      <iframe
        ref={iframeRef}
        title="Drop preview"
        srcDoc={'<!doctype html><html><head></head><body></body></html>'}
        style={{
          width,
          height,
          transition:
            'width 380ms cubic-bezier(0.16, 1, 0.3, 1), height 380ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={cn(
          'block max-w-full border-0 bg-[var(--color-bg)] shadow-[0_18px_60px_-30px_rgba(0,0,0,0.85)]',
          className,
        )}
      />
      {body ? createPortal(children, body) : null}
    </>
  )
}

export type DropEditorLivePreviewProps = {
  landing: LandingPageCmsContent
  products: Product[]
  palette: DropThemePalette
  emblemUrl: string
}

export function DropEditorLivePreview({
  landing,
  products,
  palette,
  emblemUrl,
}: DropEditorLivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportId>('fit')
  const option = useMemo(
    () => VIEWPORT_OPTIONS.find((o) => o.id === viewport) ?? VIEWPORT_OPTIONS[0],
    [viewport],
  )

  const previewBody = (
    <DropPreviewThemeScope palette={palette} emblemUrl={emblemUrl}>
      <DropEditorPreviewErrorBoundary>
        <div className="select-none">
          <PublicLandingActs
            landing={landing}
            products={products}
            emblemSrc={emblemUrl}
            cmsPreview
          />
        </div>
      </DropEditorPreviewErrorBoundary>
    </DropPreviewThemeScope>
  )

  const isFit = option.width === null
  const iframeHeight = 'min(82vh, 940px)'

  return (
    <div className="space-y-3">
      <div
        role="toolbar"
        aria-label="Preview viewport size"
        className="flex flex-wrap items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/70 p-1.5 backdrop-blur"
      >
        {VIEWPORT_OPTIONS.map((opt) => {
          const Icon = opt.Icon
          const active = viewport === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              className={cn(
                'focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors',
                active
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
              )}
              onClick={() => setViewport(opt.id)}
            >
              <Icon size={12} aria-hidden="true" />
              {opt.label}
              {opt.width ? (
                <span className="ml-1 hidden font-mono text-[9px] tracking-tight opacity-70 sm:inline">
                  {opt.width}
                </span>
              ) : null}
            </button>
          )
        })}
        <span className="ml-auto pr-2 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          {isFit
            ? 'fits preview pane'
            : `simulating ${option.width}px viewport`}
        </span>
      </div>

      <div className="relative rounded-2xl border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-bg)] to-black/40 p-3 shadow-inner">
        {/* Subtle device-frame chrome — only visible when constrained. */}
        {!isFit ? (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="block h-2 w-2 rounded-full bg-red-400/60" />
            <span className="block h-2 w-2 rounded-full bg-amber-400/60" />
            <span className="block h-2 w-2 rounded-full bg-emerald-400/60" />
            <span className="ml-3 font-mono text-[10px] tracking-tight text-[var(--color-text-muted)]">
              /drop/preview
            </span>
          </div>
        ) : null}

        <div
          className={cn(
            'flex justify-center overflow-x-auto rounded-xl bg-[var(--color-bg)]',
            isFit ? 'p-0' : 'p-3',
          )}
        >
          {isFit ? (
            // Fit mode: inline render (no iframe overhead) at full pane width.
            <div className="w-full">
              <DropPreviewThemeScope palette={palette} emblemUrl={emblemUrl}>
                <DropEditorPreviewErrorBoundary>
                  <div className="pointer-events-none select-none [&_a]:pointer-events-none">
                    <PublicLandingActs
                      landing={landing}
                      products={products}
                      emblemSrc={emblemUrl}
                      cmsPreview
                    />
                  </div>
                </DropEditorPreviewErrorBoundary>
              </DropPreviewThemeScope>
            </div>
          ) : (
            <ViewportIframe
              key={option.id}
              width={option.width!}
              height={iframeHeight}
              className="rounded-lg"
            >
              {previewBody}
            </ViewportIframe>
          )}
        </div>
      </div>
    </div>
  )
}
