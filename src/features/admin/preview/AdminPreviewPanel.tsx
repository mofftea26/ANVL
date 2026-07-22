import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import {
  PREVIEW_PROTOCOL_VERSION,
  PREVIEW_QUERY_PARAM,
  parseStorefrontPreviewMessage,
  resolvePreviewTargetToEditor,
  type AdminPreviewMessage,
} from '@/features/cms/preview'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'
import {
  Crosshair,
  ExternalLink,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  X,
} from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'

import {
  clearEditorAnchorHighlights,
  setEditorAnchorRing,
} from './adminEditorHighlight'
import { locatePreviewTargetInEditor } from './adminInspectLocate'
import {
  consumePreviewFocus,
  consumePreviewRoute,
  readPreviewDraftPayload,
  readPreviewHover,
  subscribePreviewDraft,
  subscribePreviewFocus,
  subscribePreviewHover,
  subscribePreviewRoute,
} from './adminPreviewStore'

type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

/** Desktop = 1280 so the Oath cinematic gate (≥1280px) genuinely triggers. */
const DEVICE_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
}

const DEVICE_OPTIONS: Array<{
  key: PreviewDevice
  label: string
  icon: typeof Monitor
}> = [
  { key: 'desktop', label: 'Desktop (1280)', icon: Monitor },
  { key: 'tablet', label: 'Tablet (768)', icon: Tablet },
  { key: 'mobile', label: 'Mobile (390)', icon: Smartphone },
]

const ROUTE_OPTIONS = [
  { value: '/', label: 'Home — landing' },
  { value: '/shop', label: 'Shop' },
  { value: '/about', label: 'About' },
  { value: '/story', label: 'Story' },
  { value: '/cart', label: 'Cart' },
  { value: '/faq', label: 'FAQ' },
  { value: '/contact', label: 'Contact' },
  { value: '/shipping', label: 'Shipping' },
  { value: '/returns', label: 'Returns' },
  { value: '/care-guide', label: 'Care guide' },
  { value: '/size-guide', label: 'Size guide' },
  { value: '/privacy', label: 'Privacy' },
  { value: '/terms', label: 'Terms' },
  { value: '/cookie-policy', label: 'Cookie policy' },
  { value: '/accessibility', label: 'Accessibility' },
]

/** Seed the preview route from the editor being used. */
function defaultRouteForAdminPath(pathname: string): string {
  if (pathname.startsWith('/admin/about')) return '/about'
  if (pathname.startsWith('/admin/shop')) return '/shop'
  if (pathname.startsWith('/admin/products')) return '/shop'
  if (pathname.startsWith('/admin/story')) return '/story'
  return '/'
}

const DRAFT_SEND_DEBOUNCE_MS = 200

/**
 * SCOPE EXCEPTION: the Assets / Theme / Fonts editors keep their existing
 * editor-hover highlighting but get no inspector toggle — their edits are
 * page-wide (palette, fonts) or slot-based (assets), so element-level
 * inspect-to-locate has no owning field to land on.
 */
const INSPECTOR_EXCLUDED_ADMIN_PATH = /^\/admin\/(assets|theme|fonts)(\/|$)/

/** Preview panel width: drag-resizable, persisted, clamped to sane bounds. */
const PANEL_WIDTH_KEY = ADMIN_STORAGE_KEYS.previewWidthPref
const PANEL_MIN_WIDTH = 320
const PANEL_DEFAULT_WIDTH = 480

function clampPanelWidth(width: number): number {
  const max =
    typeof window !== 'undefined'
      ? Math.max(PANEL_MIN_WIDTH, Math.round(window.innerWidth * 0.7))
      : 960
  return Math.min(Math.max(width, PANEL_MIN_WIDTH), max)
}

function readStoredPanelWidth(): number {
  try {
    const raw = Number(window.localStorage.getItem(PANEL_WIDTH_KEY))
    return Number.isFinite(raw) && raw > 0 ? clampPanelWidth(raw) : PANEL_DEFAULT_WIDTH
  } catch {
    return PANEL_DEFAULT_WIDTH
  }
}

function persistPanelWidth(width: number) {
  try {
    window.localStorage.setItem(PANEL_WIDTH_KEY, String(Math.round(width)))
  } catch {
    // Preference only.
  }
}

interface AdminPreviewPanelProps {
  onClose: () => void
}

/**
 * Live storefront preview — the real site in a same-origin iframe, rendering
 * the editors' UNSAVED working copies via the postMessage bridge. Pausing or
 * closing unmounts the iframe entirely (the Oath cinematic must never idle in
 * the background).
 */
export function AdminPreviewPanel({ onClose }: AdminPreviewPanelProps) {
  const adminPath = useRouterState({ select: (s) => s.location.pathname })
  const [route, setRoute] = useState(() => defaultRouteForAdminPath(adminPath))
  // About defaults to tablet: the ≥1280px About is the 3D Forge Altar (canvas,
  // nothing to highlight); tablet renders the normal sectioned page.
  const [device, setDevice] = useState<PreviewDevice>(() =>
    defaultRouteForAdminPath(adminPath) === '/about' ? 'tablet' : 'desktop',
  )

  const selectRoute = useCallback((next: string) => {
    setRoute(next)
    if (next === '/about') {
      setDevice((current) => (current === 'desktop' ? 'tablet' : current))
    }
  }, [])
  const [reloadKey, setReloadKey] = useState(0)
  const [ready, setReady] = useState(false)

  // Inspector mode (protocol v2): click elements in the preview to locate
  // their editor field. Hidden for the Assets/Theme/Fonts editors (see
  // INSPECTOR_EXCLUDED_ADMIN_PATH).
  const navigate = useNavigate()
  const inspectAllowed = !INSPECTOR_EXCLUDED_ADMIN_PATH.test(adminPath)
  const [inspecting, setInspecting] = useState(false)
  const inspectingRef = useRef(false)
  inspectingRef.current = inspecting
  const adminPathRef = useRef(adminPath)
  adminPathRef.current = adminPath

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })

  // Drag-resizable split: the handle on the panel's left edge resizes the
  // panel and (being flex siblings) the editor column at once.
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH)
  const [resizing, setResizing] = useState(false)
  useEffect(() => {
    setPanelWidth(readStoredPanelWidth())
  }, [])

  const onResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const startX = event.clientX
      const startWidth = panelWidth
      const handle = event.currentTarget
      handle.setPointerCapture(event.pointerId)
      setResizing(true)

      const onMove = (move: PointerEvent) => {
        setPanelWidth(clampPanelWidth(startWidth + (startX - move.clientX)))
      }
      const onUp = (up: PointerEvent) => {
        handle.releasePointerCapture(up.pointerId)
        handle.removeEventListener('pointermove', onMove)
        handle.removeEventListener('pointerup', onUp)
        setResizing(false)
        setPanelWidth((width) => {
          persistPanelWidth(width)
          return width
        })
      }
      handle.addEventListener('pointermove', onMove)
      handle.addEventListener('pointerup', onUp)
    },
    [panelWidth],
  )

  const onResizeKeyDown = useCallback((event: React.KeyboardEvent) => {
    const step = event.key === 'ArrowLeft' ? 24 : event.key === 'ArrowRight' ? -24 : 0
    if (!step) return
    event.preventDefault()
    setPanelWidth((width) => {
      const next = clampPanelWidth(width + step)
      persistPanelWidth(next)
      return next
    })
  }, [])

  const deviceWidth = DEVICE_WIDTHS[device]
  const scale = stageSize.width > 0 ? Math.min(stageSize.width / deviceWidth, 1) : 1
  const frameHeight = scale > 0 ? stageSize.height / scale : 0

  const iframeSrc = `${route}${route.includes('?') ? '&' : '?'}${PREVIEW_QUERY_PARAM}=1`

  const post = useCallback((message: AdminPreviewMessage) => {
    iframeRef.current?.contentWindow?.postMessage(message, window.location.origin)
  }, [])

  const sendDraft = useCallback(() => {
    post({
      type: 'anvl-preview/draft',
      v: PREVIEW_PROTOCOL_VERSION,
      payload: readPreviewDraftPayload(),
    })
  }, [post])

  const setInspectMode = useCallback(
    (enabled: boolean) => {
      setInspecting(enabled)
      post({ type: 'anvl-preview/inspect-mode', v: PREVIEW_PROTOCOL_VERSION, enabled })
      if (!enabled) clearEditorAnchorHighlights()
    },
    [post],
  )

  // Track the stage box so the fixed-width device frame scale-fits it.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box) setStageSize({ width: box.width, height: box.height })
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  // Handshake (either side may initiate — hydration inside the iframe finishes
  // long after `load`, so a single hello would race the listener and be lost):
  // the storefront announces `ready` once hydrated; we also retry `hello`
  // until the first `ready` lands. On `ready`: reply hello (idempotent
  // pairing), seed the current drafts, flush any pending locate.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      const message = parseStorefrontPreviewMessage(event.data)
      if (!message) return
      if (message.type === 'anvl-preview/ready') {
        setReady(true)
        post({ type: 'anvl-preview/hello', v: PREVIEW_PROTOCOL_VERSION })
        sendDraft()
        const pending = consumePreviewFocus()
        if (pending) {
          post({ type: 'anvl-preview/focus', v: PREVIEW_PROTOCOL_VERSION, target: pending })
        }
        // Inspect mode is sticky across iframe reloads/route switches — a
        // fresh storefront re-enters it until the user turns the toggle off.
        if (inspectingRef.current) {
          post({
            type: 'anvl-preview/inspect-mode',
            v: PREVIEW_PROTOCOL_VERSION,
            enabled: true,
          })
        }
        return
      }
      if (message.type === 'anvl-preview/inspect-mode') {
        // Echo — Escape inside the iframe exited inspect mode there.
        if (!message.enabled) {
          setInspecting(false)
          clearEditorAnchorHighlights()
        }
        return
      }
      if (message.type === 'anvl-preview/inspect-hover') {
        const match = message.target
          ? resolvePreviewTargetToEditor(message.target.id)
          : null
        setEditorAnchorRing(match ? match.anchorId : null)
        return
      }
      if (message.type === 'anvl-preview/inspect-click') {
        locatePreviewTargetInEditor({
          targetId: message.target.id,
          currentAdminPath: adminPathRef.current,
          navigate: (to) => {
            void navigate({ to })
          },
        })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [post, sendDraft, navigate])

  // Hello retry loop — stops as soon as the storefront reports ready.
  useEffect(() => {
    if (ready) return
    const timer = setInterval(() => {
      post({ type: 'anvl-preview/hello', v: PREVIEW_PROTOCOL_VERSION })
    }, 700)
    return () => clearInterval(timer)
  }, [ready, post])

  // Debounced draft forwarding while editors type.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const unsubscribe = subscribePreviewDraft(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(sendDraft, DRAFT_SEND_DEBOUNCE_MS)
    })
    return () => {
      if (timer) clearTimeout(timer)
      unsubscribe()
    }
  }, [sendDraft])

  // Route requests from wizards/editors — consume the pending request on
  // mount (the panel may have been opened by the same signal) and on every
  // emission. Same-route requests fall through `selectRoute` without
  // remounting the iframe (its key only changes when the route changes).
  useEffect(() => {
    const applyPending = () => {
      const next = consumePreviewRoute()
      if (next) selectRoute(next)
    }
    applyPending()
    return subscribePreviewRoute(applyPending)
  }, [selectRoute])

  // Locate requests from editors (panel already open).
  useEffect(() => {
    const unsubscribe = subscribePreviewFocus(() => {
      const target = consumePreviewFocus()
      if (target) {
        post({ type: 'anvl-preview/focus', v: PREVIEW_PROTOCOL_VERSION, target })
      }
    })
    return () => unsubscribe()
  }, [post])

  // Inspection-style hover: mirror the hovered editor field as a live ring.
  useEffect(() => {
    const unsubscribe = subscribePreviewHover(() => {
      post({
        type: 'anvl-preview/hover',
        v: PREVIEW_PROTOCOL_VERSION,
        target: readPreviewHover(),
      })
    })
    return () => {
      post({ type: 'anvl-preview/hover', v: PREVIEW_PROTOCOL_VERSION, target: null })
      unsubscribe()
    }
  }, [post])

  // Escape in the ADMIN document also exits inspect mode. (When the iframe
  // holds keyboard focus the storefront's own Escape handler fires instead
  // and echoes `inspect-mode { enabled: false }` back — handled above.)
  useEffect(() => {
    if (!inspecting) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInspectMode(false)
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [inspecting, setInspectMode])

  // Navigating into an inspector-excluded editor force-exits the mode.
  useEffect(() => {
    if (!inspectAllowed && inspecting) setInspectMode(false)
  }, [inspectAllowed, inspecting, setInspectMode])

  // Unmount: the iframe leaves inspect mode + editor-side rings clear.
  useEffect(() => {
    return () => {
      post({ type: 'anvl-preview/inspect-mode', v: PREVIEW_PROTOCOL_VERSION, enabled: false })
      clearEditorAnchorHighlights()
    }
  }, [post])

  const handleLoad = useCallback(() => {
    setReady(false)
    post({ type: 'anvl-preview/hello', v: PREVIEW_PROTOCOL_VERSION })
  }, [post])

  const frameStyle = useMemo(
    () => ({
      width: `${deviceWidth}px`,
      height: `${Math.max(frameHeight, 0)}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
    }),
    [deviceWidth, frameHeight, scale],
  )

  return (
    <section
      aria-label="Live storefront preview"
      data-testid="admin-preview-panel"
      style={{ width: `${panelWidth}px` }}
      className="relative flex h-full shrink-0 flex-col border-l border-[var(--color-line)]/70 bg-[var(--color-surface)]/60"
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize preview panel"
        tabIndex={0}
        onPointerDown={onResizeStart}
        onKeyDown={onResizeKeyDown}
        className={cn(
          'focus-ring absolute inset-y-0 left-0 z-20 w-1.5 cursor-col-resize touch-none',
          'hover:bg-[var(--color-accent)]/40',
          resizing && 'bg-[var(--color-accent)]/60',
        )}
      />
      {resizing ? (
        // Shield so the iframe never swallows pointer moves mid-drag.
        <div aria-hidden className="absolute inset-0 z-10" />
      ) : null}
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-line)]/60 px-3 py-2">
        <h2 className="anvl-heading mr-auto text-sm font-normal text-[var(--color-heading)]">
          Live preview
        </h2>

        {inspectAllowed ? (
          <button
            type="button"
            aria-pressed={inspecting}
            aria-label="Inspect storefront elements"
            title={
              inspecting
                ? 'Inspecting — click an element in the preview to open its editor field (Esc to stop)'
                : 'Inspect — click an element in the preview to open its editor field'
            }
            data-testid="preview-inspect-toggle"
            onClick={() => setInspectMode(!inspecting)}
            className={cn(
              'focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
              inspecting
                ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            )}
          >
            <Crosshair size={ICON_SIZE.sm} aria-hidden />
          </button>
        ) : null}

        <div
          role="group"
          aria-label="Preview device size"
          className="flex gap-0.5 rounded-lg border border-[var(--color-line)]/70 p-0.5"
        >
          {DEVICE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              title={option.label}
              aria-label={option.label}
              aria-pressed={device === option.key}
              onClick={() => setDevice(option.key)}
              className={cn(
                'focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                device === option.key
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              <option.icon size={ICON_SIZE.sm} aria-hidden />
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Reload preview"
          title="Reload preview"
          onClick={() => setReloadKey((k) => k + 1)}
          className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <RefreshCw size={ICON_SIZE.sm} aria-hidden />
        </button>

        <a
          href={route}
          target="_blank"
          rel="noreferrer"
          aria-label="Open this page in a new tab"
          title="Open in new tab"
          className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <ExternalLink size={ICON_SIZE.sm} aria-hidden />
        </a>

        <button
          type="button"
          aria-label="Close preview"
          title="Close preview"
          onClick={onClose}
          className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <X size={ICON_SIZE.sm} aria-hidden />
        </button>

        <div className="w-full">
          <AdminFieldSelect label="Page" value={route} onChange={selectRoute} options={ROUTE_OPTIONS} />
        </div>
      </header>

      <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden bg-[var(--color-bg)]">
        {!ready ? (
          <p
            role="status"
            className="absolute inset-x-0 top-3 z-10 text-center text-xs text-[var(--color-text-muted)]"
          >
            Connecting preview…
          </p>
        ) : null}
        <iframe
          key={`${route}-${reloadKey}`}
          ref={iframeRef}
          src={iframeSrc}
          title="Storefront live preview"
          onLoad={handleLoad}
          style={frameStyle}
          className="border-0 bg-[var(--color-bg)]"
        />
      </div>

      <footer className="shrink-0 border-t border-[var(--color-line)]/60 px-3 py-1.5">
        <p className="text-[10px] leading-snug text-[var(--color-text-muted)]">
          Shows your unsaved edits live. Saving publishes them to the real site.
        </p>
      </footer>
    </section>
  )
}
