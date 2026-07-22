# CMS + Storefront Manual Testing Checklist

The canonical manual-test checklist for the whole CMS (admin editing → storefront
reflection → Supabase persistence). Report results per item ("Section E task 4
passed" / what's wrong). **Batch 1 = Sections A–G + the additional findings**;
statuses below reflect the batch-1 fix round (2026-07-20…22). Sections H–T await
user testing (batch 2).

Conventions: *Save = publish* (dual write to `cms_settings` +
`storefront_publication`). "True published check" = different browser/incognito.
Statuses: ✅ passed (user-verified) · 🔧 fixed (was failing / change requested —
re-test) · ✨ enhanced (passed before; behavior intentionally improved — re-test)
· ⏳ untested.

---

## Section A — Admin access & session
| # | Item | Original | Final | Notes |
|---|---|---|---|---|
| 1–7 | Login/guard/remember-me/sign-out flows | ✅ | ✅ regression-safe | No changes requested. A4 (remember me) and A5–A6 (sign-out confirm) were fixed in the pre-batch round; covered by tests (`AdminSidebar.test`, checkbox forwardRef). |

## Section B — Shell, sidebar, navigation, header
| # | Item | Original | Final | What changed / how tested |
|---|---|---|---|---|
| B1 | Sidebar categories render | ✅ | ✅ | Regression-covered by `adminNav.test` + `AdminSidebar.test`. |
| B2 | Shell persists during navigation | 🔁 change requested | 🔧 **Fixed** | Shell hoisted to `routes/admin/route.tsx` → `AdminShellLayout`; sidebar/topbar/preview-panel mounted once; loading renders in-content (`AdminEditorLoading`). Test proves sidebar DOM node identity + preview panel survive `/admin/theme → /admin/fonts`; `/admin/login` renders no chrome. |
| B3 | Collapsible categories + collapsed-rail category pages | 🔁 enhance | 🔧 **Done** | Collapsible headers (persisted `anvl.adminSidebarCats.v1`, active auto-expand); rail shows one icon per category → `/admin/category/$categoryKey` landing tiles (single-editor categories deep-link straight to the editor). Tests: sidebar persistence, category tiles, unknown slug → `/admin`. |
| B4 | Responsive breadcrumbs | 🔁 change requested | 🔧 **Fixed** | Current page never truncates (wraps; `aria-current="page"`); category ancestor collapses below `sm`; category crumb links to its landing page. |
| B5 | Save button | 🔁 change to icon | 🔧 **Done** | `AdminSaveAction`: icon-only, aria-label + tooltip, spinner while saving, ✓ flash on success, copper dot when dirty. All 11 editors converted. |
| B6 | Native browser alert | ❌ failed | 🔧 **Fixed** | The theme editor's `prompt`/`confirm` cluster (new/reset/delete theme) → `AdminPromptDialog`/`AdminConfirmDialog`. Nav guard's `window.confirm` → `AdminConfirmDialog` (native `beforeunload` kept for real tab close — sanctioned). Repo sweep: zero native dialogs remain in app code. |

## Section C — Preview & element inspection
| # | Item | Original | Final | Notes |
|---|---|---|---|---|
| C1–C4, C6–C7 | Panel open/live drafts/resize/devices | ✅ | ✅ | Regression: preview panel now also survives navigation (B2). |
| C5 | Bidirectional inspection | ❌ inconsistent | 🔧 **Rebuilt** | Editor hover/focus → outline **+ translucent overlay** on the exact element (everywhere incl. assets/theme/fonts). New **inspector mode** button in the panel (except when opened from Assets/Theme/Fonts per spec): hover highlights both sides; click locates the editor control — same-page scroll+ring+focus, cross-page navigate→wait→ring; unmapped elements → info toast. Registry: `previewTargetRegistry.ts` (stable ids, no DOM indexes). Protocol v2 (`inspect-mode`/`inspect-hover`/`inspect-click`), v1-tolerant. |

## Section D — Dashboard, status, wizards, forms
| # | Item | Original | Final | What changed |
|---|---|---|---|---|
| D1, D3, D4, D7 | | ✅ | ✅ | Regression-tested. |
| D2 | Storefront link + clickable drop status | 🔁 change requested | 🔧 **Done** | "View storefront" removed from dashboard strip/session chip/status panel (sidebar only; the Drop wizard's review-step CTA kept as a flow link). Active-drop tile → `DropStatusModal`: all drops grid (thumbnails, ACTIVE badge), confirm-gated activation, **plus Banner + Coming Soon switches** with live status text. |
| D5 | Wizard/editor parity | ❌ several | 🔧 **Fixed** | **About orbs**: add works in wizard + editor; unsaved edits now render live in the docked preview; per-orb image via `MediaLibrarySlotField` in both; orb modal unified/redesigned (`AboutOrbContent` + hero image band, shared with mobile sections). **Marquee**: root cause was silent no-op saves (keystone, below) + desktop-altar-has-no-marquee confusion — hint added; saves now honest. **GLBs after hard refresh**: keystone fix (silent save + hydration revert) — persists now. **Ranks**: create/edit/delete + per-rank emblem ("badge") assignment in editor AND wizard (migration `20260720120000`, applied). **Phone input**: shared `PhoneInput` (241 dial codes, searchable) in account/checkout/support editor + wizard. |
| D6 | Wizard unsaved changes | 🔁 requested | 🔧 **Done** | `AdminChoiceDialog` (Save / Discard / Continue editing) on wizard close AND step change; aggregate registered with the route guard; no dialog when clean; no natives. |
| — | Desktop wizard step previews (finding 4) | 🔁 requested | 🔧 **Done** | ≥1280px wizards dock LEFT as a sheet; the live preview panel auto-opens beside them, routes per step, highlights the step's target, and renders unsaved edits live. Below xl: centered modal as before. |

## Section E — Themes & palette
| # | Item | Original | Final | What changed |
|---|---|---|---|---|
| E1–E3 | Slow operations | ✅ but slow | 🔧 **Optimized** | Save path: media-index rebuild skipped for non-asset saves (was a full table read per save), the two table writes parallelized, role check cached per session. Editor: palette mockup memoized + deferred (no full recompute per keystroke). Shell fix (B2) removed the preview-iframe teardown on navigation. |
| E4 | Theme reverts to Graphite Champagne | ❌ failed | 🔧 **Fixed (keystone)** | Root cause: `flushAdminCmsRemoteSync` had seven silent success early-exits — an expired session/RLS-filtered write toasted "Saved" while writing nothing, and the next hydration reverted local state. Saves now verify row counts, recover the session once, and THROW human messages on failure. Plus explicit "Editing vs Live on storefront" UX + "Make this the live theme" + outcome-stating toast. Regression tests at component + storage level. |
| E5 | Rename preview, remove device controls | 🔁 requested | 🔧 **Done** | "Palette Mockup"; device toggle + mode plumbing removed; component internally responsive. |
| E6 | Reload admin → palette persisted | ❌ failed | 🔧 **Fixed** | Same root cause as E4 (documented here per the batch requirement): the reload revert was hydration overwriting a silently-unsaved local state. Fixed by the keystone save-integrity work; persistence regression test added. |

## Section F — Fonts
| # | Item | Original | Final | What changed |
|---|---|---|---|---|
| F1 | Active font indication | 🔁 requested | 🔧 **Done** | Per role: "Active: <family>" from the SAVED value, "Unsaved change" chip, active option marked in the dropdown, aria-describedby wiring. Tests cover load/change/save states. |
| F2–F3 | | ✅ | ✅ | Regression-tested. |

## Section G — Assets
| # | Item | Original | Final | What changed |
|---|---|---|---|---|
| G1–G3, G5, G7–G10 | | ✅ | ✅ | Regression-tested. |
| G4 | Stale Assigned badge | ❌ failed | 🔧 **Fixed** | Root cause: the badge collected EVERY string from six blobs, so ids lingered via landing/PDP/passport content + hidden `visibleWhen` slot leftovers. Now: precise per-blob media-id allowlists, hidden-slot pruning on save, and a "Used by: …" tooltip. Required A→B regression test (assign A, assign B, A unassigned, survives re-read) added. |
| G6 | Unused "social" slot | 🔁 requested | 🔧 **Done** | It was the reusable `ogImage` ("Social share image") slot rendered as a dead control on pages whose routes never read it — removed from those 13; kept on shop + PDP (the only consumers). Saved leftovers are harmless (unread keys); no migration needed. |

## Additional findings (batch 1)
| # | Finding | Final | Notes |
|---|---|---|---|
| 1 | Repo-wide native dialogs | 🔧 **Clean** | Sweep verified: zero `alert/confirm/prompt` in app code (only XSS test fixtures); `beforeunload` kept for tab close per spec. |
| 2 | Story chapter product uniqueness | 🔧 **Fixed** | Unique index dropped (migration applied); many chapters per product; PDP/passport embed first-by-sort_order; friendly error mapping; docs updated. |
| 3 | Cast name/rank | 🔧 **Done** | Searchable profile combobox (`admin_search_profiles` RPC, applied) with **snapshot** rank derived from claim count via the live gamification rules (does not live-update — stated in UI); free-text kept for lore characters; rank read-only when profile-derived. |
| 4 | Desktop wizard step previews | 🔧 **Done** | See D6/D5 row — docked sheet + live panel per step. |
| 5 | Passport QR auth return flow | 🔧 **Done** | Email + OAuth + sign-up all preserve the validated internal return URL; arrival toast; `already_claimed` → info toast + public view; open-redirect blocked via `sanitizeInternalRedirect`. |
| 6 | About orbs & orb assets | 🔧 **Done** | Per-orb asset in wizard/editor/preview/storefront; ONE redesigned orb presentation (modal + mobile sections). |
| 7 | Reusable care selector | 🔧 **Done** | Structured `CareSelector` (18 presets, icons at the seam, contextual temperature/level values, notes, reorder, duplicate guard) in support editor + wizard; legacy lines preserved + one-click convert; storefront + PDP render structured-first. |
| 8 | Product size-guide table | 🔧 **Done** | Fixed XS–XXL × 7-measurement structured table per product (half-measurement flag, decimals, keyboard cell nav, mobile scroll); measurement diagram (`size-diagram.svg`) + textual explanations on /size-guide and the PDP; legacy tables preserved + convert; `sizeRecommendation` compat kept. |

## Sections H–T — ⏳ awaiting user testing (batch 2)
Shop experience · Products (PDP) · Landing content · About · Story · Coming Soon
· Banner · Passports · Gamification · Legal · Support · Settings/footer ·
Supabase persistence & publish integrity. (Definitions live in the batch-1
conversation; they will be appended here with statuses as batches complete.)

---

**Known limitations after batch 1**
- E1–E3 perf work is structural (eliminated requests/recomputes), not profiler-measured — re-test the feel.
- Cast rank snapshot derives from claim count only (drop-completion unknown at that surface), so completion-gated top levels can't be reached from the picker.
- Wizard reorder for ranks lives in the full editor (wizard links there).
- The marquee only exists on the tablet/mobile About layout by design — the desktop Forge Altar has no marquee band.
