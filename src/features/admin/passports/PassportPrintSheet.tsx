import { useEffect, useMemo, useState } from 'react'
import { Printer, X } from '@/shared/icons'
import { Button } from '@/shared/components/ui/Button'
import { BRAND } from '@/shared/constants/brand'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { PRINT_QR_COLORS, renderAnvlQrBatch } from '@/features/share/qr/anvlQr'
import type { AdminPassport } from './passports.service'

/**
 * Source raster edge, in px. Over the 3-up printed width (54.66 mm — see the
 * grid below) that is 476 dpi, comfortably past the 300 dpi floor with headroom
 * for the printer's own rasterisation.
 *
 * The printed module pitch depends on the payload length: a passport URL is
 * `BRAND.canonicalBaseUrl` + `/p/` + a 36-char UUID = 68 chars, which encodes at
 * level H as a 49-module (version 8) code. Lengthening the canonical domain past
 * 74 total chars silently pushes it to version 9 (53 modules) and costs another
 * 8% of pitch — re-measure against the card printer if that ever changes.
 */
const PRINT_QR_PX = 1024

/**
 * Print-ready QR sheet for one generation batch. Rendered as a full-screen
 * overlay; the embedded @media print rules hide everything else on the page so
 * the browser's "Save as PDF" produces a clean A4 grid for the card printer.
 *
 * The codes are the SAME branded mark the customer sees in the app (rounded
 * modules, forged finder eyes, crest knockout) — rendered by the shared
 * renderer, never by the raw `qrcode` library, so the two surfaces cannot
 * drift. Colours come from {@link PRINT_QR_COLORS}: paper white and K-only
 * black, deliberately independent of any theme.
 */
export default function PassportPrintSheet({
  passports,
  onClose,
}: {
  passports: AdminPassport[]
  onClose: () => void
}) {
  const [qrByToken, setQrByToken] = useState<Record<string, string>>({})
  const [rendered, setRendered] = useState(0)
  const [failed, setFailed] = useState(false)
  const first = passports[0]

  /* The parent rebuilds this array on every one of its renders, so keying the
     render effect on its identity would re-encode the whole batch each time —
     up to 500 codes. The token list is the only thing the render depends on. */
  const tokenKey = passports.map((p) => p.token).join('|')
  const tokens = useMemo(() => (tokenKey ? tokenKey.split('|') : []), [tokenKey])

  useEffect(() => {
    let active = true
    setQrByToken({})
    setRendered(0)
    setFailed(false)
    void renderAnvlQrBatch(
      tokens.map((token) => `${BRAND.canonicalBaseUrl}/p/${token}`),
      {
        size: PRINT_QR_PX,
        ...PRINT_QR_COLORS,
        onProgress: (done) => {
          if (active) setRendered(done)
        },
      },
    )
      .then((dataUrls) => {
        if (!active) return
        setQrByToken(Object.fromEntries(tokens.map((token, i) => [token, dataUrls[i]] as const)))
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [tokens])

  const ready = tokens.length > 0 && tokens.every((token) => qrByToken[token])
  const label = ready
    ? 'Print / Save as PDF'
    : failed
      ? 'QR render failed'
      : `Rendering ${rendered} / ${tokens.length}…`

  return (
    /* Literal paper colours on purpose. These must NOT become theme tokens:
       /admin wears the dark Studio palette, so tokenising them would print a
       black page and burn a toner cartridge per sheet. */
    <div
      data-passport-print-sheet
      className="fixed inset-0 z-[100] overflow-y-auto bg-white text-black"
    >
      {/* Print isolation: only the sheet is visible on paper. Injected here
          (not styles.css) because it exists only while this overlay is open. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-passport-print-sheet], [data-passport-print-sheet] * { visibility: visible; }
          [data-passport-print-sheet] { position: absolute; inset: 0; overflow: visible; }
          [data-passport-print-toolbar] { display: none; }
        }
      `}</style>

      <div
        data-passport-print-toolbar
        className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Passport QR sheet
          </p>
          <h2 className="text-lg font-semibold">
            {first ? `${first.productName} · ${passports.length} codes` : 'Empty batch'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            density="compact"
            disabled={!ready}
            onClick={() => window.print()}
          >
            <Printer size={ICON_SIZE.sm} aria-hidden="true" />
            {label}
          </Button>
          <Button type="button" variant="ghost" size="sm" density="compact" onClick={onClose}>
            <X size={ICON_SIZE.sm} aria-hidden="true" />
            Close
          </Button>
        </div>
      </div>

      {/* `print:grid-cols-3` is scannability, not taste. On A4 the screen `sm:`
          breakpoint would resolve to 4-up, giving a 38.21 mm code — 0.72 mm per
          module once the crest forces level H (49 modules). 3-up gives 54.66 mm
          = 1.03 mm per module, well clear of the ~0.6 mm practical floor for a
          phone at arm's length, which the crest knockout, the rounded-module ink
          loss and printer dot gain all draw against. */}
      <div className="mx-auto grid max-w-[210mm] grid-cols-3 gap-4 p-8 sm:grid-cols-4 print:grid-cols-3">
        {passports.map((p) => (
          /* The `p-3` is load-bearing quiet zone: the renderer only bakes in 2
             modules of margin, half the spec's 4. Do not trim it, and do not
             guillotine the cards to the code edge. */
          <figure
            key={p.id}
            className="break-inside-avoid rounded-lg border border-neutral-300 p-3 text-center"
          >
            {qrByToken[p.token] ? (
              <img
                src={qrByToken[p.token]}
                /* No serial here either — alt text renders in place of a failed
                   image, including on paper. */
                alt={`Passport QR code — ${p.productName}`}
                width={PRINT_QR_PX}
                height={PRINT_QR_PX}
                className="h-auto w-full"
              />
            ) : (
              <div className="aspect-square w-full animate-pulse bg-neutral-100" />
            )}
            <figcaption className="mt-2">
              {/* No serial on the printed card — it reaches the customer
                  (final product decision: serials are internal-only). */}
              <p className="text-sm font-bold uppercase tracking-[0.14em]">ANVL</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-neutral-500">
                {p.productName}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
