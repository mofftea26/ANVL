# ANVL Storage & GLB Upload Audit

**Audit phase:** 5 (GLB upload investigation and hardening)
**Status:** Root cause fixed (Phase 0), hardening applied (Phase 5).

---

## 1. Upload-flow diagram

```
Two upload entry points, one shared bucket:

┌─ Path A: Drop-scoped (asset-slot picker) ─────────────┐   ┌─ Path B: Media library ────────────────┐
│ MediaPickerField.tsx                                  │   │ MediaUploadZone.tsx                    │
│   handleFile(file)                                    │   │   uploadFiles(files)                   │
│   → validateFile(file, kind, maxBytes)  [type + size] │   │   → validateUploadFile(file) [NEW,     │
│   → uploadCmsMediaFile({file, dropSlug, role, ...})   │   │      Phase 5 — was previously absent]  │
│     [uploadCmsMedia.ts]                               │   │   → uploadMutation.mutateAsync(file)   │
│   → contentType: resolveUploadMimeType(file)          │   │     → uploadLibraryMediaFile(file)     │
│     [FIXED Phase 0 — was raw file.type]               │   │       [mediaAssets.service.ts]         │
│   → Storage.upload(objectPath, file, {contentType})   │   │   → contentType: resolveUploadMimeType │
│   → optional registerUploadedCmsMedia()               │   │     (file)  [already correct]          │
│     mime: resolveUploadMimeType(file)                 │   │   → Storage.upload(...)                │
│     [FIXED Phase 0 — was raw file.type]               │   │   → insertMediaAssetRecord()           │
└────────────────────────────────────────────────────────┘   └─────────────────────────────────────────┘
                              │                                              │
                              ▼                                              ▼
                     both share src/features/admin/media/mediaMime.ts (extensionFor,
                     resolveUploadMimeType) — de-duplicated in Phase 0 (MAINT-30)
                              │
                              ▼
                  Supabase Storage bucket `cms-media`
                  allowed_mime_types incl. model/gltf-binary, model/gltf+json
                  file_size_limit: 50MB (52,428,800 bytes)
                              │
                              ▼
                  publicCmsMediaUrl() → {SUPABASE_URL}/storage/v1/object/public/cms-media/{path}
                              │
                              ▼
        Storefront: About Forge Altar (src/features/about/altar/**) — useFittedGltf() → drei's
        useGLTF(url) — GLTFLoader under the hood, cached, scene cloned + bounding-box normalized
```

---

## 2. Root-cause investigation (as performed)

Ordered by what was actually checked, most-likely-cause first (confirmed on the first hypothesis):

1. **Bucket MIME allowlist** — queried `storage.buckets` directly. **Already correct**: `model/gltf-binary` and `model/gltf+json` present (added by migration `cms_media_mime_types`, 2026-06-08, well before this audit). Ruled out as the cause.
2. **Client-supplied `contentType`** — read both upload call sites. Found the divergence: library path already used `resolveUploadMimeType()` (added in an earlier 2026-07-03 fix per `docs/changelog.md`), but the drop-scoped path (`uploadCmsMediaFile`) still passed raw `input.file.type || undefined`. **This was the root cause** — confirmed by matching the reported error message (`application/octet-stream`) exactly against what Windows Chrome reports for `.glb` files (documented in the existing code comment on `resolveUploadMimeType`, which predates this audit).
3. **Storage RLS policies** — confirmed insert/update/delete correctly scoped to `editor`/`admin` roles; not a contributing factor.
4. **Browser-reported MIME for `.glb`** — confirmed via the existing test suite (`mediaAssets.service.test.ts`) and code comments: Windows Chrome reports `application/octet-stream` (not empty) for `.glb`. This is why a naive `file.type || undefined` fallback never triggers — the `||` only catches falsy/empty, not the generic-but-truthy `application/octet-stream`.

**Conclusion:** the bucket was never the problem. The 415 was 100% a client-side bug in exactly one of the two upload code paths, now fixed.

---

## 3. Fixes applied

### Frontend fix (Phase 0)
`uploadCmsMediaFile()` (`uploadCmsMedia.ts`) and `registerUploadedCmsMedia()` (`mediaAssets.service.ts`) now both call `resolveUploadMimeType(file)` from the new shared `src/features/admin/media/mediaMime.ts`, instead of using `file.type` raw. No bucket configuration was changed — the allowlist was already correct and remains a strict allowlist (not broadened to accept `application/octet-stream`).

### Client-side validation (Phase 5, new)
`MediaUploadZone.tsx` (the media-library upload path) had **no client-side extension or size check** before this audit — it relied entirely on the server round-trip to reject bad files, giving users only the raw Supabase error message. Added `validateUploadFile()`: checks extension against an explicit allowlist and size against the bucket's known 50MB limit, before the network call. `MediaPickerField.tsx` (drop-scoped path) already had equivalent validation (`validateFile()`) — this fix brings the library path to parity. Both now fail fast with a clear message instead of round-tripping to Supabase for an upload that was always going to be rejected.

### Not changed (by design)
- Bucket `allowed_mime_types` — remains a strict allowlist. **Recommendation confirmed: do not allow `application/octet-stream`** — that would defeat the purpose of an allowlist (any file type could then be uploaded by just letting the generic fallback through).
- No magic-byte/content-sniffing validation added — see §6.

---

## 4. Storage policy checks (verified, no changes needed)

- Insert/update/delete on `storage.objects` for `cms-media` scoped to `bucket_id = 'cms-media' AND cms_profiles.role IN ('editor','admin')` — correct.
- Public SELECT policy allows fetch-by-URL (required for the storefront to load the GLB) but also allows **listing** all objects in the bucket (SEC-25, tracked separately in the security audit — a product decision, not a GLB-specific issue).
- `deleteMediaAsset()` removes both the Storage object and the `cms_media_assets` row together — verified no orphan on library-path delete.

---

## 5. File naming, cache invalidation, preview cleanup

- **Drop-scoped path naming:** `drops/{slug}/{role}-{epoch}.{ext}` — `Date.now()` epoch makes each upload's path unique; `upsert: false` means a same-millisecond collision would error rather than silently overwrite (astronomically unlikely in practice, acceptable).
- **Library path naming:** `library/{sanitized-filename-stem}-{epoch}.{ext}` — same collision-avoidance property.
- **Cache invalidation:** `cacheControl: '31536000'` (1 year) is set on every upload — correct for content-addressed-by-epoch paths (each upload gets a new path, so there's no stale-cache risk from long cache headers; a *replaced* slot points at a brand-new URL, not the old cached one).
- **Orphan risk on replace (MAINT-31, still open):** `MediaPickerField`'s `applyNextValue()` does call `deleteCmsMediaByPublicUrl(prev)` when `replaceRemoteAsset` is true (the default) and the previous value was a Supabase-hosted URL — so **most replace flows are actually already cleaned up**, correcting an earlier, more pessimistic read of this during Phase 0. The remaining gap is narrower than first described: it only applies when a caller explicitly passes `replaceRemoteAsset={false}`, or when a slot's value is changed through a path that bypasses `applyNextValue` entirely. Downgraded from "likely" to "narrow, needs a caller-site audit" — deferred to the cleanup register rather than fixed blind.
- **Preview cleanup / object URLs:** `MediaPickerField` doesn't create blob/object URLs for previews (it uploads first, then previews the resulting Supabase public URL directly) — so there's no `URL.createObjectURL`/`revokeObjectURL` leak risk in this component. `readImageDimensions()` (`mediaAssets.service.ts`) does use `URL.createObjectURL` for image dimension probing and correctly calls `URL.revokeObjectURL` in both the `onload` and `onerror` callbacks — verified clean.

---

## 6. Security validation for uploads

- **Extension/MIME spoofing:** possible in principle (rename a non-GLB file to `.glb`) — both `resolveUploadMimeType()` (server contentType) and the new `validateUploadFile()` (client pre-check) trust the file extension, not file contents. This is a known, industry-standard limitation of allowlist-by-extension upload systems; Supabase Storage itself does not perform magic-byte sniffing.
- **Should magic-byte validation be added?** Not recommended as a priority: the uploaded files are GLB models loaded exclusively by `@react-three/drei`'s `useGLTF`/three.js `GLTFLoader` on the client, which will simply fail to parse a non-GLB file renamed to `.glb` (no code-execution risk from a malformed GLB — it's a data format parsed by a well-audited, sandboxed WebGL pipeline, not `eval`'d or server-executed). The realistic worst case is a broken 3D preview, not a security compromise. If the CMS ever accepts uploads that get server-side processed (e.g. a future image-resize pipeline), that surface would warrant magic-byte validation — GLBs specifically do not, given the current architecture.
- **Virus scanning:** not implemented, not recommended as a near-term priority for the same reason (small admin-only user base, files aren't executed server-side, `editor`/`admin` role required to upload).
- **Filename normalization:** both paths sanitize filenames/slugs before building the storage path (`sanitizeSlugPart`, `sanitizeFilename`) — no raw user filename ever reaches the storage path unescaped.
- **Unique storage paths / overwrite prevention:** `upsert: false` on every upload call — confirmed no code path enables overwrite.

---

## 7. Database metadata

`cms_media_assets.mime` now correctly reflects the resolved MIME (not the raw browser-reported value) for both upload paths, closing GLB-02. No schema change was needed — the column was already `text`, unconstrained by an enum, so no migration was required to store `model/gltf-binary`/`model/gltf+json` values (they were already valid data, just never written correctly before the fix).

---

## 8. Test coverage

| Test | File | Status |
|---|---|---|
| `.glb` with empty `file.type` → `model/gltf-binary` | `mediaAssets.service.test.ts` | Pre-existing |
| `.glb` with `application/octet-stream` reported → `model/gltf-binary` | `mediaAssets.service.test.ts` | Pre-existing (this is the exact reported-bug scenario) |
| `.gltf` → `model/gltf+json` | `mediaAssets.service.test.ts` | Pre-existing |
| Unrecognized generic upload → stays `application/octet-stream` | `mediaAssets.service.test.ts` | Pre-existing |
| `formatCmsLibraryMediaObjectPath` sanitizes filename | `mediaAssets.service.test.ts` | Pre-existing |
| Valid GLB accepted by client-side validation | `MediaUploadZone.test.ts` | **New, Phase 5** |
| Valid image accepted by client-side validation | `MediaUploadZone.test.ts` | **New, Phase 5** |
| Unsupported extension rejected client-side | `MediaUploadZone.test.ts` | **New, Phase 5** |
| Oversized file (>50MB) rejected client-side | `MediaUploadZone.test.ts` | **New, Phase 5** |
| File at exactly the 50MB boundary accepted | `MediaUploadZone.test.ts` | **New, Phase 5** |

**Not covered by automated tests (would require a live Supabase project + browser, out of scope for Vitest/jsdom):**
- Actual end-to-end upload against the live `cms-media` bucket (manually verified the fix logic is correct via unit tests + direct code read; did not have admin credentials this session to click through the real CMS UI — see the Phase 3 CMS audit note on this same limitation).
- Renamed-malicious-file behavior in a real browser (the GLTFLoader-parse-failure argument in §6 is a code-level argument, not an executed test).
- Replace/delete round-trip against live Storage (unit-level `deleteMediaAsset`/`applyNextValue` logic was read and confirmed correct, not executed against live Storage this session).

**Recommendation for Phase 11 (test matrix):** add these as manual QA checklist items for the next person with admin credentials, rather than as automated tests (they require either a live Supabase project or heavy mocking of the Storage SDK that would test the mock more than the real behavior).

---

## 9. Rollback

Both Phase 0 and Phase 5 GLB-related changes are pure application code (no migrations) — rollback is a plain `git revert` of the relevant commits. No Supabase bucket configuration was touched at any point in this investigation.
