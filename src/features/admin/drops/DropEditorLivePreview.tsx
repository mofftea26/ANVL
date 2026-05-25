import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Monitor, Smartphone, Tablet, Maximize2 } from 'lucide-react'
import { DropPreviewThemeScope } from '@/app/providers/ActiveDropThemeBridge'
import type { DropThemePalette } from '@/features/drops/theme/dropThemePalette.types'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import { PublicLandingActs } from '@/features/marketing/public-landing/PublicLandingActs'
import type { Product } from '@/features/products/types/product.types'
import { AdminButton } from '@/features/admin/components/AdminButton'
import {
  DROP_EDITOR_PREVIEW_IFRAME_SRCDOC,
  isDropEditorPreviewIframeDocumentReady,
} from '@/features/admin/drops/dropEditorLivePreviewIframe'
import { cn } from '@/shared/lib/cn'

export type BelowXlLivePreviewCollapse = {
  collapsed: boolean
  onToggle: () => void
}

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
  min-height: auto !important;
  height: auto !important;
  overflow-y: auto !important;
}
.anvl-screen-section,
.anvl-screen-section-fixed {
  flex: 0 0 auto !important;
  height: auto !important;
  max-height: none !important;
}
.anvl-screen-section-fixed {
  min-height: var(--anvl-section-h, 100svh) !important;
  height: var(--anvl-section-h, 100svh) !important;
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
`.trim()

const PREVIEW_BASE_CSS = `
:root { color-scheme: dark; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--color-bg, #0b0b0c);
  color: var(--color-text, #e7e4df);
  font-family: var(--font-sans, "Manrope", system-ui, sans-serif);
  overflow-x: hidden;
  min-height: auto !important;
  height: auto !important;
  overflow-y: auto !important;
}
.anvl-screen-section,
.anvl-screen-section-fixed {
  flex: 0 0 auto !important;
  height: auto !important;
  max-height: none !important;
}
.anvl-screen-section-fixed {
  min-height: var(--anvl-section-h, 100svh) !important;
  height: var(--anvl-section-h, 100svh) !important;
}
a { pointer-events: none; }
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
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            className="mt-4 border-amber-400/60 bg-amber-500/20 uppercase tracking-[0.14em] text-amber-50 hover:bg-amber-500/30"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </AdminButton>
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * Iframe wrapper that hosts a React subtree at a simulated viewport width. The
 * iframe is loaded with `DROP_EDITOR_PREVIEW_IFRAME_SRCDOC`, then we:
 *   - copy the parent's stylesheets, inline styles, and font preloads into the
 *     iframe `<head>` so the same Tailwind / CMS theme tokens render inside
 *   - install a `MutationObserver` on the parent `<head>` to mirror live HMR /
 *     active-drop theme `<style>` updates back into the iframe
 *   - inject `PREVIEW_RESET_CSS` so GSAP intro states never break the static
 *     preview layout
 *   - portal the React children into the iframe `<body>` via `createPortal`
 *
 * Bootstrap must survive `interactive` timelines and `load` events that race
 * `useLayoutEffect` (listeners attached after navigation completes). Retries +
 * React `onLoad` cover that alongside a synchronous probe.
 *
 * **Blank iframe RCA (recurring):**
 * - `createPortal(children, iframeBody)` renders the **same** React tree into a
 *   foreign `Document`; errors in that subtree bubble to **`DropEditorPreviewErrorBoundary`**.
 * - `composeLandingPageFromDrop` chooses **acts** (+ hero fallback via `DropEditorRoute`)
 *   so **`PublicLandingActs`** is not handed an empty **`landingActs`** slice.
 * - If `bootstrap()` runs against **doc A**, then **`load`** fires again and
 *   `iframe.contentDocument` becomes **doc B**, a one-shot `readystatechange` on
 *   **doc A** + `bootstrappedRef === true` can strand the portal **off-DOM**
 *   (white iframe). Fixing that requires **`Document` identity** tracking and
 *   per-document **`readystatechange`** wiring.
 *
 * Result: act renderers receive a *real* viewport width inside the iframe, so
 * every `sm:` / `md:` / `lg:` Tailwind variant evaluates against the simulated
 * device width instead of the admin window width.
 */
function ViewportIframe({
  widthPx,
  fill,
  children,
  className,
  freezeIntroAnimations = true,
  remountKey,
}: {
  /** Device width in CSS px when `fill` is false. */
  widthPx: number
  /** When true, span the preview column width (`width: 100%`); iframe height fills the stretch shell. */
  fill?: boolean
  children: ReactNode
  /** Classes for the iframe element (replaced element); shell wrapper uses flex stretch. */
  className?: string
  /** When true (default), GSAP intro states are neutralized for static layout preview. */
  freezeIntroAnimations?: boolean
  /** Bumps iframe bootstrap when animations should replay. */
  remountKey?: string | number
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  /** Latest bootstrap closure for `iframe` `load` callbacks (attached before refs settle). */
  const bootstrapIframeRef = useRef<(() => boolean) | null>(null)
  const [body, setBody] = useState<HTMLBodyElement | null>(null)
  /**
   * `Document` we've fully wired (`clone styles + MutationObserver`). When `iframe` fires
   * `load` again (hidden→visible quirks, navigations), `contentDocument` is a fresh instance —
   * we must detach `readystatechange` / mirrors and bootstrap again despite `bootstrappedRef`.
   */
  const wiredPreviewDocRef = useRef<Document | null>(null)
  /** True after cloned head / observer wiring for the active `wiredPreviewDocRef`. */
  const bootstrappedRef = useRef(false)
  const observerRef = useRef<MutationObserver | null>(null)

  useLayoutEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let cancelled = false
    let docPollRaf = 0
    /**
     * `readystatechange` / microtasks can call `bootstrap` while a run is mid-flight.
     * Re-entrancy would double-clear `doc.head`; bail and let the first run finish.
     */
    let bootstrapInFlight = false
    /** `readystatechange` must follow the current iframe document (not attach once globally). */
    let readystateAttachedTo: Document | null = null
    let detachReadystate: (() => void) | null = null

    const disconnectMirror = () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }

    bootstrappedRef.current = false
    wiredPreviewDocRef.current = null

    const bootstrap = (): boolean => {
      if (cancelled) return true

      const doc = iframe.contentDocument
      if (!isDropEditorPreviewIframeDocumentReady(doc)) return false

      const sameDoc = wiredPreviewDocRef.current === doc
      if (sameDoc && bootstrappedRef.current) return true
      if (bootstrapInFlight) return false

      bootstrapInFlight = true
      try {
        disconnectMirror()

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
        reset.textContent = freezeIntroAnimations ? PREVIEW_RESET_CSS : PREVIEW_BASE_CSS
        doc.head.appendChild(reset)

        doc.documentElement.classList.add('anvl-preview-iframe')

        observerRef.current = new MutationObserver((muts) => {
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
        observerRef.current.observe(document.head, { childList: true })

        setBody(doc.body as HTMLBodyElement)
        wiredPreviewDocRef.current = doc
        bootstrappedRef.current = true
        return true
      } finally {
        bootstrapInFlight = false
      }
    }

    bootstrapIframeRef.current = bootstrap

    const onLoad = () => {
      if (!cancelled) wireDocAndBootstrap()
    }

    /** Rebind whenever `iframe.contentDocument` changes so we never strand on an unloaded doc. */
    const attachReadystateForDoc = (doc: Document) => {
      if (readystateAttachedTo === doc) return
      detachReadystate?.()
      detachReadystate = null
      readystateAttachedTo = null

      const onRs = () => {
        if (!cancelled) void bootstrap()
      }
      doc.addEventListener('readystatechange', onRs)
      readystateAttachedTo = doc
      detachReadystate = () => {
        doc.removeEventListener('readystatechange', onRs)
        if (readystateAttachedTo === doc) readystateAttachedTo = null
        detachReadystate = null
      }
    }

    /** Poll: `contentDocument` can be null briefly; `readyState` may sit on `loading` until `readystatechange`. */
    const MAX_DOC_POLL_FRAMES = 240
    let docPollFrames = 0
    const wireDocAndBootstrap = () => {
      if (cancelled) return
      const doc = iframe.contentDocument
      if (!doc) {
        if (docPollFrames >= MAX_DOC_POLL_FRAMES) return
        if (docPollRaf) return
        docPollRaf = requestAnimationFrame(() => {
          docPollRaf = 0
          docPollFrames += 1
          wireDocAndBootstrap()
        })
        return
      }
      docPollFrames = 0
      attachReadystateForDoc(doc)
      void bootstrap()
    }

    iframe.addEventListener('load', onLoad)

    const scheduleRetries = () => {
      queueMicrotask(() => {
        if (!cancelled) bootstrap()
      })
      requestAnimationFrame(() => {
        if (!cancelled) bootstrap()
      })
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) bootstrap()
        })
      })
    }

    scheduleRetries()

    /** Covers: (1) doc already live before `load` listeners, (2) `contentDocument` / `readystate` races. */
    wireDocAndBootstrap()

    return () => {
      cancelled = true
      iframe.removeEventListener('load', onLoad)
      if (docPollRaf) cancelAnimationFrame(docPollRaf)
      detachReadystate?.()
      detachReadystate = null
      readystateAttachedTo = null
      disconnectMirror()
      bootstrappedRef.current = false
      wiredPreviewDocRef.current = null
      bootstrapIframeRef.current = null
      setBody(null)
    }
  }, [freezeIntroAnimations, remountKey])

  /**
   * The iframe sits in a **flex-1 min-h-0** shell — not as the row flex item directly — so `%`
   * height quirks on replaced elements cannot collapse the lane to ~150px. The shell stretches
   * to the gradient card; **`flex-1 min-h-0 h-full`** on the iframe consumes that height while
   * **`justify-start`** keeps authored layout top-anchored inside the iframe document.
   */
  return (
    <>
      <div
        data-testid="drop-editor-viewport-iframe-shell"
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col justify-start overflow-hidden self-start',
          fill ? 'w-full' : 'items-center',
        )}
      >
        <iframe
          ref={iframeRef}
          title="Drop preview"
          srcDoc={DROP_EDITOR_PREVIEW_IFRAME_SRCDOC}
          onLoad={() => bootstrapIframeRef.current?.()}
          style={{
            width: fill ? '100%' : widthPx,
            maxWidth: '100%',
            transition: 'width 380ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className={cn(
            'mx-auto min-h-0 min-w-0 w-full max-w-full border-0 bg-[var(--color-bg)] shadow-[0_18px_60px_-30px_rgba(0,0,0,0.85)]',
            fill ? 'h-[min(720px,calc(100dvh-var(--admin-topbar-height)-10rem))]' : 'h-[min(720px,calc(100dvh-var(--admin-topbar-height)-10rem))] flex-none',
            className,
          )}
        />
      </div>
      {body ? createPortal(children, body) : null}
    </>
  )
}

export type DropEditorLivePreviewProps = {
  landing: LandingPageCmsContent
  products: Product[]
  palette: DropThemePalette
  emblemUrl: string
  wordmarkUrl?: string
  /** Act rows from the drop editor — merged over `landing` slices in the preview renderer. */
  draftActs?: LandingAct[]
  /** Render only these act ids (acts builder single-act preview). */
  onlyActIds?: string[]
  /** When true (default), neutralize GSAP intro keyframes for static layout QA. */
  freezeIntroAnimations?: boolean
  /** Increment to replay entrance animations inside the iframe. */
  animationRemountKey?: number
  /** Below `xl`: parent drives collapse; preview hides toolbar + iframe shell (`max-xl:hidden`). */
  belowXlCollapse?: BelowXlLivePreviewCollapse
  /** Hide viewport toolbar (single-act sticky preview). */
  compact?: boolean
}

export function DropEditorLivePreview({
  landing,
  products,
  palette,
  emblemUrl,
  wordmarkUrl,
  draftActs,
  onlyActIds,
  freezeIntroAnimations = true,
  animationRemountKey = 0,
  belowXlCollapse,
  compact = false,
}: DropEditorLivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportId>('fit')
  const option = useMemo(
    () => VIEWPORT_OPTIONS.find((o) => o.id === viewport) ?? VIEWPORT_OPTIONS[0],
    [viewport],
  )

  const filteredLanding = useMemo(() => {
    if (!onlyActIds?.length) return landing
    const allowed = new Set(onlyActIds)
    return {
      ...landing,
      landingActs: landing.landingActs.filter((a) => allowed.has(a.id)),
    }
  }, [landing, onlyActIds])

  const filteredDraftActs = useMemo(() => {
    if (!draftActs?.length || !onlyActIds?.length) return draftActs
    const allowed = new Set(onlyActIds)
    return draftActs.filter((a) => allowed.has(a.id))
  }, [draftActs, onlyActIds])

  const previewBody = (
    <DropPreviewThemeScope palette={palette} emblemUrl={emblemUrl}>
      <DropEditorPreviewErrorBoundary>
        <div className="pointer-events-none select-none [&_a]:pointer-events-none">
          <PublicLandingActs
            landing={filteredLanding}
            products={products}
            emblemSrc={emblemUrl}
            wordmarkSrc={wordmarkUrl}
            cmsPreview
            draftActs={filteredDraftActs}
          />
        </div>
      </DropEditorPreviewErrorBoundary>
    </DropPreviewThemeScope>
  )

  const isFit = option.width === null
  const deviceWidthPx = option.width ?? 1280

  /**
   * RCA — viewport toggle glitch (“iframe flashes then content jumps down”):
   * - `key={option.id}` on the iframe forced a full remount on each breakpoint,
   *   so `body` was briefly null → portal vanished → layout collapsed.
   * Fix: stable iframe instance (no breakpoint key) + **width-only** CSS transition.
   */
  const collapsedBelowXl = Boolean(belowXlCollapse?.collapsed)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div
        role="toolbar"
        aria-label="Preview viewport size"
        className={cn(
          'flex shrink-0 flex-wrap items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/70 p-1.5 backdrop-blur',
          (collapsedBelowXl || compact) && 'hidden',
        )}
      >
        {VIEWPORT_OPTIONS.map((opt) => {
          const Icon = opt.Icon
          const active = viewport === opt.id
          return (
            <AdminButton
              key={opt.id}
              type="button"
              aria-pressed={active}
              variant="adminTabList"
              data-active={active ? 'true' : 'false'}
              className="inline-flex gap-1.5 tracking-[0.18em] transition-colors"
              onClick={() => setViewport(opt.id)}
            >
              <Icon size={12} aria-hidden="true" />
              {opt.label}
              {opt.width ? (
                <span className="ml-1 hidden font-mono text-[9px] tracking-tight opacity-70 sm:inline">
                  {opt.width}
                </span>
              ) : null}
            </AdminButton>
          )
        })}
      </div>

      <div
        className={cn(
          /* Shell fills below the viewport pills; scrolling stays inside the iframe doc. */
          'flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain pr-0.5',
          collapsedBelowXl ? 'max-xl:hidden' : '',
        )}
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-bg)] to-black/40 p-2 shadow-inner">
          {/* Subtle device-frame chrome — only visible when constrained. */}
          {!isFit ? (
            <div className="mb-2 flex shrink-0 items-center gap-1.5">
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
              'flex min-h-0 min-w-0 flex-1 flex-col rounded-xl bg-[var(--color-bg)]',
              !isFit && 'min-h-0 overflow-x-auto p-2',
            )}
          >
            <div
              className={cn(
                /* Row: stretch shell so the iframe host (inside ViewportIframe) gets a definite block height. */
                'flex min-h-0 min-w-0 w-full flex-1 flex-row items-stretch justify-center self-stretch',
              )}
            >
              <ViewportIframe
                fill={isFit}
                widthPx={deviceWidthPx}
                freezeIntroAnimations={freezeIntroAnimations}
                remountKey={animationRemountKey}
                className={cn(
                  isFit ? 'w-full max-w-full' : 'rounded-lg',
                )}
              >
                {previewBody}
              </ViewportIframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
