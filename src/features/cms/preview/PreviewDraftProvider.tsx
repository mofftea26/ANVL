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
import { highlightPreviewTarget } from './previewHighlight'

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
 * inside an iframe, and a valid `hello` received from the SAME origin. Every
 * subsequent message re-checks the origin.
 */
export function PreviewDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<PreviewDraftPayload | null>(null)

  useEffect(() => {
    if (!isPreviewCandidate()) return

    let active = false
    let adminWindow: MessageEventSource | null = null

    const reply = (message: StorefrontPreviewMessage) => {
      adminWindow?.postMessage(message, { targetOrigin: window.location.origin })
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const message = parseAdminPreviewMessage(event.data)
      if (!message) return

      if (message.type === 'anvl-preview/hello') {
        active = true
        adminWindow = event.source
        setDraft((prev) => prev ?? {})
        reply({
          type: 'anvl-preview/ready',
          v: PREVIEW_PROTOCOL_VERSION,
          path: window.location.pathname,
        })
        return
      }

      if (!active) return

      if (message.type === 'anvl-preview/draft') {
        setDraft((prev) => ({ ...(prev ?? {}), ...message.payload }))
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
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <PreviewDraftContext.Provider value={draft}>{children}</PreviewDraftContext.Provider>
  )
}
