import { useEffect, useState } from 'react'
import { Download, Share2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { buildShareTitle } from '../captions'
import { renderAnvlQr } from '../qr/anvlQr'
import { downloadDataUrl, shareImageFile } from '../shareActions'
import type { ShareCapabilities, ShareContext } from '../types'

/**
 * The QR tab. The code encodes the PUBLIC ARMORY URL — never `/p/<token>`,
 * which is the claim secret and the transfer surface and has no business on
 * anything a stranger can photograph.
 *
 * The sheet is 960px wide from `lg`, but this tab is a document: `ShareModal`
 * centres it at a 30rem reading measure rather than letting it stretch, so the
 * only thing the extra width buys the code is a slightly larger plate.
 */
export function ShareQrTab({
  context,
  capabilities,
}: {
  context: ShareContext
  capabilities: ShareCapabilities
}) {
  const [qr, setQr] = useState<{ dataUrl: string; blob: Blob | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    void renderAnvlQr({ url: context.url })
      .then((result) => {
        if (!cancelled) setQr({ dataUrl: result.dataUrl, blob: result.blob })
      })
      .catch(() => {
        if (!cancelled) setQr(null)
      })
    return () => {
      cancelled = true
    }
  }, [context.url])

  const filename = 'anvl-armory-qr.png'

  return (
    <div>
      <div className="flex justify-center rounded-2xl bg-[color-mix(in_oklab,var(--color-bg)_70%,transparent)] p-4">
        <div className="relative aspect-square w-[min(70vw,17rem)] overflow-hidden rounded-2xl lg:w-[20rem]">
          {qr?.dataUrl ? (
            <img
              src={qr.dataUrl}
              alt={`QR code linking to ${context.url}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-[var(--color-surface-elevated)]" />
          )}
        </div>
      </div>

      <p className="anvl-micro mt-3 text-center text-[10px] text-[var(--color-text-muted)]">
        Scans to your public armory
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!qr?.dataUrl}
          onClick={() => {
            if (qr) downloadDataUrl(qr.dataUrl, filename)
          }}
          className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-on-highlight)] disabled:opacity-50"
        >
          <Download size={ICON_SIZE.md} aria-hidden="true" /> Download
        </button>
        <button
          type="button"
          disabled={!qr}
          onClick={() => {
            if (!qr) return
            void shareImageFile(qr.blob, filename, {
              title: buildShareTitle(context),
              text: context.url,
            }).then((shared) => {
              // No file sharing here means the code is only useful saved.
              if (!shared) downloadDataUrl(qr.dataUrl, filename)
            })
          }}
          className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-elevated)] py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-heading)] disabled:opacity-50"
        >
          <Share2 size={ICON_SIZE.md} aria-hidden="true" />
          {capabilities.canShareFiles ? 'Share' : 'Save'}
        </button>
      </div>
    </div>
  )
}
