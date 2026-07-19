import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  PREVIEW_PROTOCOL_VERSION,
  PREVIEW_QUERY_PARAM,
  parseAdminPreviewMessage,
  type PreviewDraftPayload,
  type StorefrontPreviewMessage,
} from './previewBridge.types'
import { highlightPreviewTarget, setPreviewHoverTarget } from './previewHighlight'

/** `null` = preview inactive (every real visitor); `{}` = active, no drafts yet. */
const PreviewDraftContext = createContext<PreviewDraftPayload | null>(null)

/**
 * The active admin preview draft, or `null` outside preview mode. Consumers
 * prefer a present draft slice over loader/published data — absent slices
 * always fall through to the published value.
 */
export function usePreviewDraft(): PreviewDraftPayload | null {
  return useContext(PreviewDraftContext)
}

function isPreviewCandidate(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  // Only iframes on our own origin can complete the handshake below.
  return params.get(PREVIEW_QUERY_PARAM) === '1' && window.self !== window.top
}

/**
 * Storefront side of the admin live-preview bridge. SSR-safe: state is `null`
 * on the server and the first client paint (no hydration mismatch); activation
 * happens post-mount, and only when ALL hold — `?anvl-cms-preview=1`, running
 * inside an iframe, and a valid `hello` received from the SAME origin (every
 * subsequent message re-checks the origin).
 *
 * Handshake is storefront-initiated: hydration finishes long after the
 * iframe's `load` event, so a parent-initiated `hello` alone would race the
 * listener and be lost. On mount the candidate announces `ready` to its
 * parent; the admin replies `hello` (and keeps retrying its own side), and
 * either direction completes the pairing.
 */
export function PreviewDraftProvider({
  children,
  /** TEST-ONLY: bypass the query-param + iframe check (jsdom can't iframe). */
  forceCandidate = false,
}: PropsWithChildren<{ forceCandidate?: boolean }>) {
  const [draft, setDraft] = useState<PreviewDraftPayload | null>(null)

  useEffect(() => {
    if (!forceCandidate && !isPreviewCandidate()) return

    let active = false
    let adminWindow: MessageEventSource | null = null

    const announceReady = (target?: MessageEventSource | null) => {
      const message: StorefrontPreviewMessage = {
        type: 'anvl-preview/ready',
        v: PREVIEW_PROTOCOL_VERSION,
        path: window.location.pathname,
      }
      if (target) {
        target.postMessage(message, { targetOrigin: window.location.origin })
      } else {
        window.parent.postMessage(message, window.location.origin)
      }
    }

    const reply = (message: StorefrontPreviewMessage) => {
      if (adminWindow) {
        adminWindow.postMessage(message, { targetOrigin: window.location.origin })
      } else {
        window.parent.postMessage(message, window.location.origin)
      }
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const message = parseAdminPreviewMessage(event.data)
      if (!message) return

      if (message.type === 'anvl-preview/hello') {
        active = true
        adminWindow = event.source
        setDraft((prev) => prev ?? {})
        announceReady(event.source)
        return
      }

      if (!active) return

      if (message.type === 'anvl-preview/draft') {
        setDraft((prev) => ({ ...(prev ?? {}), ...message.payload }))
        return
      }

      if (message.type === 'anvl-preview/hover') {
        setPreviewHoverTarget(message.target)
        return
      }

      if (message.type === 'anvl-preview/focus') {
        const found = highlightPreviewTarget(message.target)
        reply({
          type: 'anvl-preview/located',
          v: PREVIEW_PROTOCOL_VERSION,
          target: message.target,
          found,
        })
      }
    }

    window.addEventListener('message', onMessage)
    // Storefront-initiated side of the handshake — we exist, come pair with us.
    announceReady()

    return () => window.removeEventListener('message', onMessage)
  }, [forceCandidate])

  return (
    <PreviewDraftContext.Provider value={draft}>{children}</PreviewDraftContext.Provider>
  )
}
