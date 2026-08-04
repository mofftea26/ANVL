# Share rework — passport, armory, feats

**Date:** 2026-08-03
**Status:** Shipped, then partly superseded — see the note below
**Supersedes:** the "Create a share image" studio in
`src/features/storefront-account/account/panels/armory/` (`armoryShare.ts`,
`ArmoryShareModal.tsx`, `ArmoryShareButton.tsx`)

> **Superseded on 2026-08-04 — the two preset families were collapsed into one.**
> This document is the point-in-time design record and is left as written. The
> `presets/backdrops.ts` file and its `forge` / `champagne` / `stealth` keys no
> longer exist, and neither does the backdrop-vs-HUD family split: a look now
> describes arrangement only and composes over the self-resolving stage
> (`image/presets/stage.ts`), so all seven work with or without a photo. Read
> `docs/features/product-passport.md` for the shipped design.

---

## Why

The share studio shipped with four defects and one wrong mental model:

1. Picking a photo from gallery/camera leaves the preview unchanged on both
   mobile and desktop.
2. The "what to share" dropdown does nothing once a photo is picked — HUD
   templates render only the owner's name, rank and stats, ignoring the subject
   entirely.
3. Sharing to the places people actually post (Instagram Story, WhatsApp
   status, Facebook Story) is not wired at all — the tiles for those apps
   resolve to `href: () => null` and silently fall through.
4. "Create a share image" is framed as a side feature. It is the main event.
5. The subject model asks the user to pick "a piece" while they are standing
   inside that piece's passport.

## What we are building

One **Share** sheet, opened by a share icon, with three tabs: **Image**,
**Link**, **QR**. The piece is context, never a menu choice. The only content
choice is which feat rides along.

---

## Platform constraints (these bound the design)

- **Instagram Stories / Reels and Facebook Stories cannot be pre-filled from a
  web page.** `instagram-stories://share` requires a native app registered with
  a Facebook App ID; from mobile web it fails or opens an empty camera.
- **WhatsApp deep links carry text only.** Never an image.
- The only route that delivers an image into those apps is
  `navigator.share({ files })` (Web Share Level 2) — iOS Safari 15+, Chrome
  Android, Chrome/Edge on Windows. Not desktop Safari, not Firefox.

Therefore: every app tile resolves at click time to the best available route
and **always tells the user what happened**. No tile may silently do nothing.

---

## Architecture

New storefront-safe feature. It must be a feature, not `shared/**`, because it
imports `ArmoryFeat` / `ArmoryRank` types from `features/passport`.

```
src/features/share/
  types.ts                  ShareContext, ShareCanvas, format/preset keys
  captions.ts               caption + filename derivation
  targets.ts                send-to registry + resolveShareRoute()
  useShareCapabilities.ts   post-mount navigator.share / canShare({files})
  useShareContext.ts        assembles ShareContext from existing queries
  useShareLauncher.ts       open()/isPending/modal props; mints the handle
  useImagePick.ts           photo seam: objectURL -> decoded, downscaled bitmap
  ShareButton.tsx           the share-icon entry point
  ShareModal.tsx            3-tab shell
  tabs/ShareImageTab.tsx
  tabs/ShareLinkTab.tsx
  tabs/ShareQrTab.tsx
  socialIcons.tsx           moved from armory/
  image/
    drawKit.ts              cover/contain/wrap/roundRect/loadImage/cssColor
    shareImage.ts           format table + preset dispatch + PNG encode
    presets/index.ts        registry (backdrop family + hud family)
    presets/bottomRail.ts   NEW default photo preset
    presets/{modern,minimal,premium,luxe,game,jarvis}.ts
    presets/backdrops.ts    forge / champagne / stealth (no photo)
  qr/anvlQr.ts              branded QR renderer + pure geometry helpers
```

`armoryShare.ts` (691 lines) and `ArmoryShareModal.tsx` (455 lines) are
deleted. Both exceed the 500-line hard limit; one-preset-per-file is what makes
ten presets maintainable.

### Content model

```ts
interface ShareContext {
  url: string                       // https://<base>/armory/<handle>
  owner: { name; rankTitle; rankEmblemSrc; memberSince: string | null }
  stats: { pieceCount; featCount; totalWears }
  piece: { slug; name; imageUrl: string | null; wearCount } | null
  feat:  { id; title; achievedOn } | null
}
```

`useShareContext({ pieceSlug, pieceImageUrl? })` assembles it from the queries
that already exist (`useOwnedPassportsQuery`, `useArmoryFeatsQuery`,
`useGamificationRules`, `useCustomerProfileQuery`, `useArmoryShareQuery`) plus
the shop catalog for piece imagery. The passport passes its hero render as
`pieceImageUrl` because it is better art than the catalog thumbnail.

`piece` is null only in the Armory sheet before a piece is chosen; that sheet
shows a piece picker above the feat picker.

---

## Tab 1 — Image

Live preview (debounced regenerate, as today), then:

- **Photo** — pick from gallery/camera, or clear.
- **Format** — Story 1080×1920 · Post 1080×1350 · Message 1080×1080.
- **Preset** — backdrop family without a photo, HUD family with one.
- **Add a feat** — `No feat` plus the feats logged in this piece.
- **Send to** — the app tiles.
- **Download**.

### The photo pipeline (fixes defect 1)

`FileReader` → multi-megabyte data URL held in React state *and* used as an
effect dependency is replaced by:

1. `URL.createObjectURL(file)`
2. `img.decode()`
3. one-time downscale to ≤2160px long edge into an offscreen canvas
4. the bitmap lives in a ref; only a monotonic `photoVersion` number enters
   effect deps
5. object URL revoked on replace/unmount

A decode failure sets a visible error ("That photo couldn't be read — try
another"), never a silent no-op. HEIC on desktop is the known trap.

**Before writing this code, reproduce the current failure in a real browser and
record the actual root cause in the plan.** If it lies outside this path, fix
that too rather than let the rewrite paper over it.

### Presets (fixes defect 2)

Every preset — backdrop and HUD alike — renders the piece and the selected
feat. A preset is a module exporting
`draw(args: PresetDrawArgs): void`, where `ctx` is typed as `ShareCanvas` (the
exact subset of `CanvasRenderingContext2D` we use) so tests can pass a
recorder.

**Bottom Rail** (new default, chosen from four mockups): champagne hairline
across the base; piece thumbnail left; piece name with the feat beneath it;
headline stat right; host + record on the closing line. Sits clear of
Instagram's own UI furniture.

Retrofit — each existing preset gains the piece thumbnail and feat in its own
language: framed for Luxe, a `> PIECE:` readout row for Jarvis, a bracketed
slot for Game, a hairline block for Premium, one quiet line for Minimal, an
editorial block for Modern.

### Send-to routing (fixes defect 3)

```ts
interface ShareRoute {
  kind: 'os-share-file' | 'open-url' | 'download-only'
  href?: string
  downloadImage: boolean
  copyCaption: boolean
  hint: string | null
}
resolveShareRoute(target, capabilities, { url, caption }): ShareRoute
```

Order: OS sheet with the PNG if `canShare({ files })` → else the target's web
intent → else its app deep link (mobile) or web composer (desktop), always with
`downloadImage` + `copyCaption` and a hint strip stating what happened.

Tiles: Instagram Story, WhatsApp, Facebook Story, TikTok, X, Telegram,
Discord, More.

---

## Tab 2 — Link

The armory URL with copy, the derived caption with copy, and the plain
link-share intents. Nothing here ever carries the image.

## Tab 3 — QR

QR of the **public armory URL**. Never `/p/<token>`: that token is the claim
secret and the transfer surface, and must not travel on a public post.

Renderer (`qr/anvlQr.ts`), built on the module matrix from
`QRCode.create(url, { errorCorrectionLevel: 'H' })` — verified 37×37 for an
armory URL:

- Neighbour-aware rounded modules: a corner keeps its radius only where both
  adjacent neighbours are light, so runs read as continuous curved strokes.
- The three finder eyes as champagne rounded-square rings with a rounded dot.
- A centre knockout of ~24% of the width (≈5.8% of module area, well inside
  H-level's 30% budget) carrying `AnvlCrest` in champagne on brand black,
  behind a hairline ring.
- Pure helpers (`qrGeometry`, `isFinderModule`, `knockoutBounds`) are exported
  and unit-tested.
- Scan-verify on a real phone before this is called done.

The crest path data moves to a shared constant consumed by both the React
component and the canvas renderer, so there is one source of truth.

---

## Feats (fixes the celebration gap)

`PieceFeats` gains a share icon on every feat row. A successful create opens
the sheet immediately with that feat preselected. Both mount sites (the
passport's owner tools and each Armory piece card) inherit this.

---

## Entry points

| Where | Before | After |
|---|---|---|
| Passport → Armory tab | 4 social icons + native button + "Create a share image" | one share icon |
| Account → Armory panel | `ArmoryShareButton` | same icon, new sheet |
| Any feat row | — | share icon; auto-opens on create |

---

## Testing

Pure and unit-tested:

- `resolveShareRoute` across the capability × target matrix — every combination
  yields an actionable route, never a no-op.
- QR geometry: finder placement, knockout bounds vs. the error-correction
  budget, module rounding decisions.
- Caption/filename derivation for each context shape.
- Downscale math in the image pick.

Component tests: tab switching, the feat picker changing the render input, a
feat row's share icon preselecting that feat, the photo error state.

Presets draw through a recording `ShareCanvas` so jsdom can assert that the
piece thumbnail and feat text actually reach the canvas.

## Risks

- App deep-link schemes (`instagram://`, `snssdk1233://`) are undocumented and
  can change. Mitigated by never depending on them for correctness: the image
  is already saved and the caption already copied before the link fires.
- `canShare({ files })` is feature-detected post-mount, so SSR renders the
  conservative branch and hydration upgrades it.
- Canvas output cannot be asserted pixel-wise in jsdom; the recording context
  covers structure, and visual confirmation is manual.

## Documentation owed

`docs/features/product-passport.md`, `docs/project-map.md`, `CLAUDE.md`
(folder structure + feature boundary list), `docs/changelog.md`.
