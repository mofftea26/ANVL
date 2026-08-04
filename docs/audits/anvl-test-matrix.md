# ANVL Test Matrix

**Audit phase:** 11 (Testing & observability plan)
**Baseline:** 107 test files / 646 tests passing (`pnpm test`, as of 2026-07-06 after that session's remediation round), Vitest + RTL + jsdom. No E2E framework installed — recommendations below respect that constraint rather than assuming a new one is welcome.

> ⚠️ **Point-in-time snapshot, not maintained.** The counts above are frozen at 2026-07-06. Re-measured **2026-07-29: 214 test files / 1466 tests passing.** Treat every number in this document as historical; run `pnpm test` for current figures.

---

## 1. Coverage gaps found during this audit (concrete, not hypothetical)

| Area | Gap | Found in |
|---|---|---|
| `AccountShellLayout` (`publicAccount.ui.tsx`) | No test file existed at all for the component containing the FUNC-01 redirect-gate bug fixed this session | Phase 2 |
| `MediaUploadZone.tsx` | Had zero tests before this audit; now has `MediaUploadZone.test.ts` covering the new `validateUploadFile()` (5 cases) — but no test exercises the component's drag/drop or upload-mutation wiring itself | Phase 5 |
| GLB end-to-end upload | No automated test exercises a real Supabase Storage upload (would require either a live project or heavy SDK mocking) — currently only the pure `resolveUploadMimeType`/`validateUploadFile` functions are unit-tested | Phase 5 |
| Admin editor unsaved-changes | No test (and no feature) covers navigation-away-with-unsaved-changes, since the feature itself doesn't exist yet (see cleanup/remediation docs) | Phase 3 |
| Query key factories | The 3 bare-array query keys (REU-14) have no test asserting cache invalidation correctness — a future refactor to factories should add a regression test proving invalidation still works | Phase 6 |

---

## 2. Priority test additions (by user journey, per the original audit request)

| Journey | Priority | What to add | Notes |
|---|---|---|---|
| Admin authentication | P1 | Already reasonably covered (session flow) per `docs/audit-2026-05-17.md`'s closed audit batch — verify `adminAuth.ts` server functions have direct unit tests, not just the login form component | Confirm existing coverage before adding more; don't duplicate |
| Customer authentication | P2 | Test `AccountShellLayout`'s redirect gate directly (the bug fixed this session) — assert that a signed-out visit to any `/account/*` route redirects to `/auth/sign-in?redirect=...` without relying on `requestAnimationFrame` timing | New — closes the gap that let FUNC-01 ship unnoticed |
| GLB / media upload | P1 | Already added `MediaUploadZone.test.ts` this session. **Still missing:** a test for `uploadCmsMediaFile()`/`registerUploadedCmsMedia()` asserting `resolveUploadMimeType` is actually called (a regression guard so GLB-01 can't silently regress if someone "simplifies" the code back to raw `file.type`) | New, recommended P1 given this was the reported production bug |
| CMS publishing (save/draft/publish) | P2 | A shared test for the `adminCmsRemoteSync` debounce — assert that rapid successive calls within the 850ms window collapse to one flush, and that the flush patch contains the latest value of each field (guards against the last-write-wins race flagged in Phase 3) | New |
| Theme/landing-page switching | P3 | Lower priority — no bugs found in this area during the audit | — |
| Shopify webhook processing | P2 | No test currently exercises `shopify-webhook`'s HMAC verification or order-mapping logic (it's a Deno Edge Function, outside Vitest's normal reach) — recommend a small Deno-native test file colocated with the function, or extracting the pure mapping functions (`mapStatus`, `mapPaymentMethod`, `mapItems`, `mapTotals`, `mapAddress`) into a testable module if feasible | New, P2 — these are pure functions today, easy to unit test if extracted |
| Supabase authorization (RLS) | P2 | No automated test validates RLS policies (e.g. via `pgTAP`, which is already an installed-but-unused extension per the database audit) — recommend at minimum a manual checklist (below) since standing up pgTAP tests is a larger investment | Manual checklist acceptable near-term |
| Cache invalidation | P3 | Covered indirectly by existing query-hook tests; the REU-14 factory migration (if done) should come with its own invalidation test | Bundle with that refactor |

---

## 3. Manual QA checklist (for the next session with live admin credentials + a real, focused browser)

This audit was constrained by two things noted repeatedly: no admin login credentials were available, and the preview browser session was a backgrounded/inactive tab (confirmed via `document.hidden`), which affects anything relying on `requestAnimationFrame`, real heap-snapshot timing, or genuinely leaving the page (external redirects). The following need a human (or a differently-configured automation) to close out:

- [ ] Upload a real `.glb` file via both the asset-slot picker (`MediaLibrarySlotField`, About page anvil/hammer slots — note: traced during MAINT-02 that `MediaPickerField` itself appears unused; `MediaLibrarySlotField` is what's actually rendered, see CLEAN-02) and the media library (`MediaUploadZone`) — confirm both succeed post-fix.
- [ ] Trigger the new unsaved-changes guard: dirty an editor (any of Theme/Shop/Fonts/Assets/PDP/About/Landing Content), then (a) click a different admin nav link — confirm a confirm-leave prompt appears and cancelling keeps you on the page; (b) refresh/close the tab — confirm the browser's native "leave site?" prompt appears; (c) save the editor, confirm no prompt appears when navigating away afterward.
- [ ] Upload an oversized file (>50MB) and a wrong-extension file via both paths — confirm the new client-side validation rejects them before any network call (check Network tab shows no request).
- [ ] Replace an assigned GLB asset-slot value, then check the Supabase `cms-media` bucket to confirm the old object was actually deleted (validates the MAINT-31 narrowing from Phase 5 — should already work via `applyNextValue`'s default `replaceRemoteAsset: true`).
- [ ] Complete a full Shopify checkout handoff in a real, focused browser tab (not backgrounded) — the Phase 2 test confirmed the `cartCreate` GraphQL call and redirect code are correct, but couldn't observe the actual cross-origin navigation complete in the automated environment.
- [ ] Repeat the 16-cycle `/shop` ↔ `/about` navigation memory test from Phase 9, but with Chrome DevTools Memory panel heap snapshots (3-snapshot technique) in a real, visible/focused tab, to get a conclusive leak/no-leak verdict beyond this audit's canvas-count proxy signal.
- [ ] Open `/account` in a genuinely backgrounded browser tab (middle-click a link, don't switch to the tab) and confirm the FUNC-01 fix holds — the fix removes the rAF dependency, but this exact real-world scenario (as opposed to the automated approximation used in this audit) should be spot-checked once.
- [ ] Exercise every admin editor's save/error path with the network throttled or offline, confirming the toast-based error surfacing (found compliant in Phase 3's code review) actually appears in the live UI.
- [x] Test the admin "two tabs open, editing different fields" race condition described in Phase 3 — **resolved 2026-07-06**: root cause confirmed and fixed (`adminCmsRemoteSync.ts` now scopes each save to only its own `cms_settings`/`storefront_publication` column via `CmsSettingsFieldKey`, see roadmap). 5 unit tests on the extracted scoping function cover the logic in isolation. **Still worth a live confirmation:** open the same editor in two real browser tabs, edit different fields in each, save both, and visually confirm neither overwrites the other's column — the fix is code- and unit-test-verified but not yet browser-verified end to end.
- [ ] Confirm whether the `script-src` `eval` CSP violation caught in a live dev browser (`blocked-uri: "eval"`, `node_modules/.vite/deps/core-*.js`, 2026-07-06 — see `anvl-phase-j-security-plan.md` §6) also reproduces against the real production build (`pnpm build` + a production preview server), or is confirmed dev-only Vite pre-bundling noise. Needed before ever switching CSP from report-only to enforcing. Not yet resolved this session — a manual preview server was started and stopped without completing the check (no `.claude/launch.json` production-preview config exists yet; would need one added, e.g. pointing at `vite preview`, to drive it through the browser tools rather than `curl`).

---

## 4. Existing strengths worth preserving (don't regress)

- `resolveUploadMimeType` has thorough edge-case coverage (empty type, generic octet-stream, real specific mime, unrecognized generic) — this exact test suite is what let this audit confirm the GLB fix was correct without needing a live upload.
- Story service tests confirm the parallel-fetch (not N+1) pattern for chapters→acts→cast.
- `accountQueryKeys` factory pattern (the one place it's done right) has no test gaps found.
