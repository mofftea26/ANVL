# About Page — Generated Assets Manifest

Generated via Higgsfield (`nano_banana_2` for stills, `sam_3_3d`/`image_to_3d` (Meshy) for the
3D conversion). These are **pre-upload originals** — they are not shipped in `public/` and are
not referenced by any code default. Upload each one into the CMS media library
(`/admin/assets` → **Media Library**), then assign it to the listed slot under
**scope "Page — About"** in the same editor's slot-assignment rail.

Until a slot is assigned, that scene's image falls back to a themed duotone gradient (or, for
the monolith, the 3D layer simply doesn't mount) — the page never renders blank, so it's safe to
ship code now and assign these whenever you're ready.

| File | Dimensions | Purpose | CMS field / slot |
|---|---|---|---|
| `about-hero-backdrop-1376x768.png` | 1376×768 (16:9) | Hero scene backdrop — dark industrial monolith establishing shot behind "Forged Under Pressure" | `/admin/assets` → Page — About → **Hero backdrop** (`heroImage`) |
| `about-monolith-source-1024x1024.png` | 1024×1024 (1:1) | Source still of the sculptural monolith emblem — kept for reference / regenerating the GLB later | Not a slot itself — source for `about-monolith.glb` |
| `about-monolith.glb` | — (3D mesh) | The persistent 3D monolith that drifts through the whole page (hero → recedes through the forge scenes → returns enlarged + color-shifted at the finale) | `/admin/assets` → Page — About → **Monolith 3D model (GLB)** (`monolithModel`) |
| `about-philosophy-backdrop-1376x768.png` | 1376×768 (16:9) | Smokey/abstract backdrop behind the pinned "Pressure. Repetition. Discipline." manifesto lines | `/admin/assets` → Page — About → **Philosophy backdrop** (`manifestoBackdrop`) |
| `about-materials-cotton-928x1152.png` | 928×1152 (4:5) | Heavy cotton fleece weave macro — Forge Part I: Materials, primary image | `/admin/assets` → Page — About → **Materials — image 1** (`materialsImage1`) |
| `about-materials-compression-knit-928x1152.png` | 928×1152 (4:5) | Compression knit macro — Forge Part I: Materials, secondary/offset image | `/admin/assets` → Page — About → **Materials — image 2** (`materialsImage2`) |
| `about-construction-seam-928x1152.png` | 928×1152 (4:5) | Flat-lock seam macro — Forge Part II: Construction, primary image (carries the 3 annotated hotspot markers authored in `/admin/about`) | `/admin/assets` → Page — About → **Construction — image 1** (`constructionImage1`) |
| `about-construction-stress-test-928x1152.png` | 928×1152 (4:5) | Reinforcement/grommet macro under tension — Forge Part II: Construction, secondary/offset image | `/admin/assets` → Page — About → **Construction — image 2** (`constructionImage2`) |
| `about-testing-rig-1376x768.png` | 1376×768 (16:9) | Industrial pressure-testing rig — Forge Part III: Testing backdrop, behind the fun-facts/stat counters | `/admin/assets` → Page — About → **Testing image** (`testingImage`) |
| `about-finale-backdrop-1376x768.png` | 1376×768 (16:9) | Triumphant ember/glow backdrop — closing "The Oath Continues" scene | `/admin/assets` → Page — About → **Finale backdrop** (`finaleBackdrop`) |

## Copy vs. imagery — two different editors

- **Copy** (headline, philosophy lines, process step titles/body, fun-fact labels/values, finale
  body) is edited at **`/admin/about`** — every field is optional; leave it blank to keep the
  designed default.
- **Imagery** (all ten files above) is assigned at **`/admin/assets`**, scope **"Page — About"** —
  same picker used for every other storefront page (shop, PDP, cart, etc.).

## Other placeholder assets in the app worth generating next (not included in this batch)

Flagged during this pass, not generated — confirm before spending credits on these, since they're
outside the About page scope:

- `public/brand/placeholder-product.svg` — generic fallback used by mock product data
  (`src/features/products/data/products.mock.ts`) and `ProductGallery`'s empty state. Real product
  photography (or Higgsfield-generated stand-ins) would look far more premium than the current flat
  placeholder icon.
- `public/videos/WarriorHero1.mp4` — The Oath's default hero video. Still actively used and
  works fine; only flagged as a sibling "generated media" candidate if you ever want a refreshed cut.
