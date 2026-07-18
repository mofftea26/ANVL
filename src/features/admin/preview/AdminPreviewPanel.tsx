import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouterState } from '@tanstack/react-router'

import {
  PREVIEW_PROTOCOL_VERSION,
  PREVIEW_QUERY_PARAM,
  parseStorefrontPreviewMessage,
  type AdminPreviewMessage,
} from '@/features/cms/preview'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet, X } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'

import {
  consumePreviewFocus,
  readPreviewDraftPayload,
  subscribePreviewDraft,
  subscribePreviewFocus,
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
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [reloadKey, setReloadKey] = useState(0)
  const [ready, setReady] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })

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

  // Handshake: hello on load → storefront replies ready → seed current drafts.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      const message = parseStorefrontPreviewMessage(event.data)
      if (!message) return
      if (message.type === 'anvl-preview/ready') {
        setReady(true)
        sendDraft()
        const pending = consumePreviewFocus()
        if (pending) {
          post({ type: 'anvl-preview/focus', v: PREVIEW_PROTOCOL_VERSION, target: pending })
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [post, sendDraft])

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
      className="flex h-full w-[24rem] shrink-0 flex-col border-l border-[var(--color-line)]/70 bg-[var(--color-surface)]/60 xl:w-[30rem] 2xl:w-[36rem]"
    >
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-line)]/60 px-3 py-2">
        <h2 className="anvl-heading mr-auto text-sm font-normal text-[var(--color-heading)]">
          Live preview
        </h2>

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
          <AdminFieldSelect label="Page" value={route} onChange={setRoute} options={ROUTE_OPTIONS} />
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
