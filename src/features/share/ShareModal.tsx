import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { X } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import { ShareImageTab } from './tabs/ShareImageTab'
import { ShareLinkTab } from './tabs/ShareLinkTab'
import { ShareQrTab } from './tabs/ShareQrTab'
import { buildShareContext, featsForPiece, useShareData } from './useShareData'
import { useShareCapabilities } from './useShareCapabilities'
import { useRovingRadio } from './useRovingRadio'

type TabKey = 'image' | 'link' | 'qr'

const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'image', label: 'Image' },
  { key: 'link', label: 'Link' },
  { key: 'qr', label: 'QR' },
]
const TAB_KEYS: readonly TabKey[] = TABS.map((entry) => entry.key)

/**
 * The link and QR tabs are documents, and a document has a reading measure.
 *
 * The shell is 960px wide from `lg` up so the image tab can stand a big preview
 * next to a full controls column — but a URL field, a caption box and a row of
 * send tiles stretched across all of it would read far worse than they do on a
 * phone. They keep the measure the phone sheet already gives them, centred in
 * the wider shell, which is also what stops the two tabs from feeling like a
 * different product from the third.
 *
 * The dialog is now one fixed height at every tab (see below), so these two
 * also centre VERTICALLY in it — `my-auto` rather than `justify-center`,
 * because auto margins only ever consume POSITIVE free space and so cannot
 * push the top of a long document out of its own scroll container.
 */
function ReadingColumn({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 lg:flex lg:flex-col lg:px-6 lg:pb-6">
      <div className="mx-auto w-full lg:my-auto lg:max-w-[30rem]">{children}</div>
    </div>
  )
}

/**
 * The one share surface. The piece is context — passed in by whatever opened
 * the sheet — and only the armory entry point lets it be changed. Three tabs:
 * the generated image, the link, and the branded QR.
 *
 * TWO SHAPES, ONE SHEET. Below `lg` it is a phone sheet: one column, the
 * preview pinned at the top, the primary action pinned at the bottom. From `lg`
 * it becomes a composed dialog — see {@link ShareImageTab} for the two-column
 * split and the reasoning behind the numbers.
 */
export function ShareModal({
  open,
  onClose,
  initialPieceSlug = null,
  initialFeatId = null,
  pieceImageUrl = null,
  allowPiecePicker = false,
}: {
  open: boolean
  onClose: () => void
  initialPieceSlug?: string | null
  initialFeatId?: string | null
  /** Better piece art than the catalog thumbnail (the passport hero render). */
  pieceImageUrl?: string | null
  /** True only from the armory, where no single piece is implied. */
  allowPiecePicker?: boolean
}) {
  const data = useShareData()
  const capabilities = useShareCapabilities()
  const [tab, setTab] = useState<TabKey>('image')
  const [pieceSlug, setPieceSlug] = useState<string | null>(initialPieceSlug)
  const [featId, setFeatId] = useState<string | null>(initialFeatId)
  // One tablist, one panel: `aria-controls` points at the same wrapper from
  // every tab and the panel's `aria-labelledby` follows the selection.
  const idBase = useId()
  const tabId = (key: TabKey) => `${idBase}-tab-${key}`
  const panelId = `${idBase}-panel`
  const { register, onKeyDown } = useRovingRadio(TAB_KEYS, tab, setTab)

  // Re-arm on every open: the same mount is reused for a different piece or a
  // freshly logged feat.
  useEffect(() => {
    if (!open) return
    setTab('image')
    setPieceSlug(initialPieceSlug)
    setFeatId(initialFeatId)
  }, [open, initialPieceSlug, initialFeatId])

  const context = useMemo(
    () => buildShareContext({ data, pieceSlug, featId, pieceImageUrl }),
    [data, pieceSlug, featId, pieceImageUrl],
  )
  const feats = useMemo(() => featsForPiece(data.feats, pieceSlug), [data.feats, pieceSlug])

  // A feat that does not belong to the newly chosen piece must not linger.
  useEffect(() => {
    if (featId && !feats.some((feat) => feat.id === featId)) setFeatId(null)
  }, [featId, feats])

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-label="Share"
      className={cn(
        // A flex column that does not scroll: each tab owns its own scrolling, so
        // the image tab can pin its preview and its export bar. `overflow-y-hidden`
        // rather than `overflow-hidden` on purpose — tailwind-merge groups those
        // separately, and only the `overflow-y` form displaces Modal's base
        // `overflow-y-auto`.
        'flex max-h-[92svh] w-full max-w-md flex-col overflow-y-hidden p-0 sm:max-w-lg',
        // 960px, one deliberate step, from `lg` only — and the number is
        // ARITHMETIC, not taste. The image tab spends it like this:
        //
        //   960 − 48 (`lg:px-6` on ShareImageTab) = 912 usable
        //   912 − 416 (the 26rem preview column) − 24 (`lg:gap-6`) = 472
        //
        // 472px is EXACTLY the phone sheet's content box at `sm` (512 − 40 of
        // `px-5`), so every control sized for a large phone — the 6-up send
        // grid, the filmstrip — has at least as much room here as it was
        // designed against. It also fits inside `lg` itself: 960 + Modal's own
        // 32px of wrapper padding is 992, under 1024.
        'lg:max-w-[60rem]',
        // ONE HEIGHT FOR ALL THREE TABS. Modal centres its panel, so a height
        // applied only to the image tab made the whole dialog — header, tabs,
        // and the button under the cursor — jump ~145px up the screen the
        // moment you switched to Link or QR, and back down on the way in. The
        // shorter documents centre inside the frame instead (ReadingColumn).
        'lg:h-[min(92svh,54rem)]',
      )}
    >
      <div className="shrink-0 bg-[var(--color-surface)] px-5 pb-3 pt-4 lg:px-6 lg:pb-4 lg:pt-5">
        {/* ONE tablist at every width — it changes seat, not identity. Below
            `lg` it wraps onto its own row under the title; from `lg` it rejoins
            the title row at a fixed 17rem and the header collapses to a single
            52px band, which is ~30px of extra preview height. Two separate
            tablists behind a `hidden`/`lg:flex` pair would have put two of every
            tab in the accessibility tree.

            The close button comes BEFORE the tablist in the DOM and both carry
            explicit `order`, so focus order matches reading order at BOTH
            widths — it used to reach the tabs before the button drawn above
            them on a phone. */}
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="anvl-heading text-xl text-[var(--color-heading)] lg:text-2xl">Share</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'focus-ring order-2 ml-auto grid h-11 w-11 place-items-center rounded-full',
              'text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-text)]',
              'lg:order-3 lg:ml-0',
            )}
          >
            <X size={ICON_SIZE.lg} aria-hidden="true" className="block" />
          </button>

          {/* A real tablist: roving tabindex and arrow keys (the same hook the
              format switch and the filmstrip use), and every tab wired to the
              panel it controls. The buttons carried `role="tab"` long before
              any of that existed, which promised assistive tech a keyboard
              model and a panel relationship that were not there. */}
          <div
            role="tablist"
            aria-label="What to share"
            onKeyDown={onKeyDown}
            className={cn(
              'order-3 grid w-full grid-cols-3 gap-1 rounded-full p-1',
              'bg-[var(--color-surface-elevated)]',
              'lg:order-2 lg:ml-auto lg:w-[17rem]',
            )}
          >
            {TABS.map((entry) => {
              const selected = tab === entry.key
              return (
                <button
                  key={entry.key}
                  ref={register(entry.key)}
                  id={tabId(entry.key)}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={panelId}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(entry.key)}
                  className={cn(
                    // h-11: the 44px touch floor, same as the format switch
                    // inside the image tab — two identical-looking pill rows
                    // should not disagree about how big a tap target is.
                    'focus-ring h-11 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em] motion-safe:transition-colors',
                    selected
                      ? 'bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
                      : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {entry.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* No `tabIndex={0}` on purpose: APG only asks for it when a panel has no
          focusable content of its own, and every one of these is full of
          controls. Adding it would put an extra empty stop in front of them. */}
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(tab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        {context ? (
          <>
            {tab === 'image' ? (
              <ShareImageTab
                context={context}
                pieces={data.pieces}
                feats={feats}
                capabilities={capabilities}
                pieceSlug={pieceSlug}
                onPieceChange={setPieceSlug}
                featId={featId}
                onFeatChange={setFeatId}
                allowPiecePicker={allowPiecePicker}
              />
            ) : null}
            {/* Link and QR are plain documents, so the shell scrolls them —
                only the image tab manages its own zones. */}
            {tab === 'link' ? (
              <ReadingColumn>
                <ShareLinkTab context={context} capabilities={capabilities} />
              </ReadingColumn>
            ) : null}
            {tab === 'qr' ? (
              <ReadingColumn>
                <ShareQrTab context={context} capabilities={capabilities} />
              </ReadingColumn>
            ) : null}
          </>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
            Preparing your armory link…
          </p>
        )}
      </div>
    </Modal>
  )
}
