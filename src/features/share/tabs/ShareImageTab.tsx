import { useState } from 'react'
import { ShareExportBar } from '../image-tab/ShareExportBar'
import { ShareFormatSwitch } from '../image-tab/ShareFormatSwitch'
import { ShareOnImagePlate } from '../image-tab/ShareOnImagePlate'
import { SharePresetFilmstrip } from '../image-tab/SharePresetFilmstrip'
import { SharePreviewStage } from '../image-tab/SharePreviewStage'
import { ShareSendPanel } from '../image-tab/ShareSendPanel'
import { SHARE_PRESET_OPTIONS, shareFormatMeta, sharePresetLabel } from '../image-tab/presetMeta'
import { useShareRender } from '../image-tab/useShareRender'
import { useSharePresetThumbnails } from '../image-tab/useSharePresetThumbnails'
import { buildShareCaption, buildShareFilename, buildShareTitle } from '../captions'
import { downloadDataUrl, runShareRoute } from '../shareActions'
import { resolveShareRoute, SHARE_TARGETS, type ShareTarget } from '../targets'
import {
  DEFAULT_SHARE_PRESET,
  type ShareCapabilities,
  type ShareContext,
  type ShareFeat,
  type ShareFormatKey,
  type SharePiece,
  type SharePresetKey,
} from '../types'
import { useImagePick } from '../useImagePick'

/**
 * Module-level so the thumbnail worker's dependency key is stable across
 * renders — the set never varies now that there is one family.
 */
const PRESET_KEYS: readonly SharePresetKey[] = SHARE_PRESET_OPTIONS.map((option) => option.key)

/**
 * The image tab.
 *
 * ONE PRESET, HELD ONCE. This used to keep two — a remembered backdrop pick and
 * a remembered HUD pick — because the renderer ran two families and swapped
 * between them whenever a photo arrived or left. There is one family of seven
 * now, every one of which composes over whatever the stage resolves to, so the
 * choice is a single piece of state and adding a photo cannot touch it.
 *
 * PHONE (below `lg`): three stacked zones — the stage and its size switch
 * pinned at the top, the choices scrolling in the middle, the export bar pinned
 * at the bottom. The preview never leaves your eye while you scrub layouts and
 * the primary action never leaves your thumb.
 *
 * DESKTOP (`lg` and up): two columns — preview left, controls right. The
 * preview column is a fixed 26rem and the stage FILLS it top to bottom, which
 * is the whole point of the wider shell: a 9:16 story renders at roughly
 * 371×660 instead of the phone sheet's ~170×300, a post at ~392×490 and a
 * square at ~392×392. The controls column takes the remaining 472px — exactly
 * the phone sheet's content box at `sm` — and is the only thing that scrolls.
 *
 * The column is FIXED rather than tracking the selected format. Post and square
 * are width-bound where the story is height-bound, so a per-format column would
 * buy them a little more render — at the cost of reflowing the entire controls
 * side, preset grid included, every time you tap a size. That trades a stable
 * work surface for a few percent of preview, which is the wrong way round.
 *
 * THE EXPORT BAR MOVES INTO THE CONTROLS COLUMN at `lg` rather than staying
 * pinned across both. On a phone it spans the sheet because there is one column
 * and it is the thumb zone; on a desktop there is no thumb zone, and a
 * full-width bar would rule a line under a 628px preview that has nothing to do
 * with it and push the primary action ~600px away from the last control you
 * touched. It belongs at the foot of the column whose choices it commits — and
 * keeping it out of the left column leaves the preview as one uninterrupted
 * plate, which is what makes the dialog read as composed rather than as a phone
 * layout with a gap.
 *
 * Adding a photo lives ON the stage (see `SharePhotoControls`), not in the
 * scroller — the control that changes the picture sits on the picture.
 */
export function ShareImageTab({
  context,
  pieces,
  feats,
  capabilities,
  pieceSlug,
  onPieceChange,
  featId,
  onFeatChange,
  allowPiecePicker,
}: {
  context: ShareContext
  pieces: SharePiece[]
  feats: ShareFeat[]
  capabilities: ShareCapabilities
  pieceSlug: string | null
  onPieceChange: (slug: string | null) => void
  featId: string | null
  onFeatChange: (id: string | null) => void
  allowPiecePicker: boolean
}) {
  const [format, setFormat] = useState<ShareFormatKey>('story')
  const [preset, setPreset] = useState<SharePresetKey>(DEFAULT_SHARE_PRESET)
  const [hint, setHint] = useState<string | null>(null)
  const photo = useImagePick()

  const hasPhoto = photo.version > 0 && photo.photo !== null

  const caption = buildShareCaption(context)
  const filename = buildShareFilename(context)

  const render = useShareRender({
    format,
    preset,
    content: context,
    photo: photo.photo,
    photoVersion: photo.version,
  })
  const thumbs = useSharePresetThumbnails({
    presetKeys: PRESET_KEYS,
    content: context,
    photo: photo.photo,
    photoVersion: photo.version,
    enabled: true,
  })

  const ready = Boolean(render.current?.dataUrl)

  const send = async (target: ShareTarget) => {
    const route = resolveShareRoute(target, capabilities, { url: context.url, caption })
    // A tile carries the canvas its destination wants — an Instagram Story is
    // 9:16 whatever is on screen. A cached format keeps this handler fully
    // synchronous up to the launch, which is what `openTarget` requires; a miss
    // costs one render, which is the cheaper of the two failures.
    const wanted = route.format ?? format
    const rendered = render.peek(wanted) ?? (await render.ensure(wanted))
    if (!rendered?.dataUrl) return

    const message = await runShareRoute(route, {
      blob: rendered.blob,
      dataUrl: rendered.dataUrl,
      filename,
      title: buildShareTitle(context),
      caption,
      url: context.url,
    })
    if (message) setHint(message)
  }

  const download = () => {
    if (render.current) downloadDataUrl(render.current.dataUrl, filename)
  }

  const onPrimary = () => {
    // On a phone that can share files, the OS sheet is the only route that
    // actually delivers a PNG — so that is the primary, not Download.
    const system = SHARE_TARGETS.find((target) => target.key === 'system')
    if (capabilities.canShareFiles && system) void send(system)
    else download()
  }

  // Announced once per SETTLED render, never on a pending tick — the old live
  // region flipped text every 220ms debounce and chattered constantly.
  const settledMessage = render.settled
    ? `Preview updated — ${sharePresetLabel(render.settled.preset)}, ${shareFormatMeta(render.settled.format).label}`
    : ''

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-6 lg:px-6 lg:pb-6">
      {/* The preview column. `lg:min-h-0` is load-bearing: without it the stage
          cannot shrink below its content and the row overflows the dialog. */}
      <div className="shrink-0 px-5 lg:flex lg:min-h-0 lg:w-[26rem] lg:flex-col lg:px-0">
        <SharePreviewStage
          dataUrl={render.current?.dataUrl ?? null}
          format={format}
          pending={render.pending || photo.pending}
          failed={render.failed}
          photo={{
            hasPhoto,
            previewUrl: photo.previewUrl,
            pending: photo.pending,
            error: photo.error,
            onPick: photo.pick,
            onClear: photo.clear,
          }}
        />
        <ShareFormatSwitch value={format} onChange={setFormat} />
      </div>

      {/* The controls column — the only region that scrolls at any width. */}
      <div className="flex min-h-0 flex-1 flex-col lg:min-w-0">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 lg:px-0 lg:pr-1">
          <SharePresetFilmstrip
            options={SHARE_PRESET_OPTIONS}
            value={preset}
            onChange={setPreset}
            thumbs={thumbs}
          />
          <ShareOnImagePlate
            context={context}
            pieces={pieces}
            pieceSlug={pieceSlug}
            onPieceChange={onPieceChange}
            allowPiecePicker={allowPiecePicker}
            feats={feats}
            featId={featId}
            onFeatChange={onFeatChange}
          />
          <ShareSendPanel
            capabilities={capabilities}
            disabled={!ready}
            onSend={(target) => void send(target)}
          />
        </div>

        <ShareExportBar
          capabilities={capabilities}
          ready={ready}
          failed={render.failed}
          hint={hint}
          onPrimary={onPrimary}
          onDownload={download}
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {settledMessage}
      </p>
    </div>
  )
}
