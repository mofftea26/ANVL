import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Printer, X } from '@/shared/icons'
import { Button } from '@/shared/components/ui/Button'
import { BRAND } from '@/shared/constants/brand'
import type { AdminPassport } from './passports.service'

/**
 * Print-ready QR sheet for one generation batch. Rendered as a full-screen
 * overlay; the embedded @media print rules hide everything else on the page so
 * the browser's "Save as PDF" produces a clean A4 grid for the card printer.
 */
export default function PassportPrintSheet({
  passports,
  onClose,
}: {
  passports: AdminPassport[]
  onClose: () => void
}) {
  const [qrByToken, setQrByToken] = useState<Record<string, string>>({})
  const first = passports[0]

  useEffect(() => {
    let active = true
    void Promise.all(
      passports.map(async (p) => {
        const url = `${BRAND.canonicalBaseUrl}/p/${p.token}`
        const dataUrl = await QRCode.toDataURL(url, {
          width: 384,
          margin: 1,
          errorCorrectionLevel: 'M',
        })
        return [p.token, dataUrl] as const
      }),
    ).then((entries) => {
      if (active) setQrByToken(Object.fromEntries(entries))
    })
    return () => {
      active = false
    }
  }, [passports])

  const ready = passports.every((p) => qrByToken[p.token])

  return (
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
            <Printer size={16} aria-hidden="true" />
            {ready ? 'Print / Save as PDF' : 'Rendering QRs…'}
          </Button>
          <Button type="button" variant="ghost" size="sm" density="compact" onClick={onClose}>
            <X size={16} aria-hidden="true" />
            Close
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[210mm] grid-cols-3 gap-4 p-8 sm:grid-cols-4">
        {passports.map((p) => (
          <figure
            key={p.id}
            className="break-inside-avoid rounded-lg border border-neutral-300 p-3 text-center"
          >
            {qrByToken[p.token] ? (
              <img
                src={qrByToken[p.token]}
                alt={`QR code for passport ${p.serialNumber} of ${p.editionTotal}`}
                width={384}
                height={384}
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
