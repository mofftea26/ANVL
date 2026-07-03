# About Page ("The Forge Altar") — Generated Assets Manifest

Generated via Higgsfield (`nano_banana_2` 2K stills; Meshy `image_to_3d` for the GLBs).
These are **pre-upload originals**. The two GLBs also ship as bundled code defaults in
`public/about/` so the desktop altar works before any CMS upload — uploading a GLB to the
media library and assigning its slot **overrides** the bundled default.

**Upload flow:** `/admin/assets` → Media Library → upload → assign under scope
**"Page — About"**. Before uploading stills, convert PNG → WebP (~80 quality) to hit the
per-slot weight budgets (hero < 350 KB, section images < 450 KB); the repo keeps these PNG
originals.

| File | What it is | CMS slot (Page — About) |
|---|---|---|
| `about-anvil.glb` | The altar centrepiece — 3D anvil (also bundled at `public/about/anvil.glb`) | **Anvil 3D model (GLB)** (`anvilModel`) |
| `about-anvil-source-2048x2048.png` | Source still the anvil GLB was reconstructed from (for regeneration) | — |
| `about-hammer.glb` | The strike warhammer — Warcraft-style (oversized runed head, bronze trim; also bundled at `public/about/hammer.glb`) | **Hammer 3D model (GLB)** (`hammerModel`) |
| `about-hammer-source-2048x2048.png` | Source still the warhammer GLB was reconstructed from (vertical, head up) | — |
| `about-hero-backdrop-2752x1536.png` | Forge-hall establishing shot — mobile/tablet hero image (and OG source) | **Hero backdrop** (`heroImage`) |
| `about-creed-smoke-2752x1536.png` | Near-abstract smoke — The Creed orb modal backdrop | **Philosophy backdrop** (`manifestoBackdrop`) |
| `about-materials-2752x1536.png` | Fabric weave macro — Materials card (mobile) + strike modal (desktop) | **Materials image** (`materialsBackdrop`) |
| `about-construction-2752x1536.png` | Flat-lock seam macro — Construction card + strike modal | **Construction image** (`constructionBackdrop`) |
| `about-testing-2752x1536.png` | Tension-rig wide shot — Testing card + strike modal | **Testing image** (`testingBackdrop`) |
| `about-finale-embers-2752x1536.png` | Cooling ember field — The Oath modal + mobile closing block | **Finale backdrop** (`finaleBackdrop`) |
| `about-forge-backdrop-2752x1536.png` | Blacksmith forge interior with an empty centre floor — sits behind the 3D anvil on the desktop altar (also bundled as `public/about/forge-backdrop.webp`, 2400px WebP) | **Forge backdrop** (`forgeBackdrop`) |

## Copy vs. imagery — two different editors

- **Copy** (headline, creed lines, process steps + detail lines, fun facts, marquee text,
  finale) is edited at **`/admin/about`** — every field optional, blank keeps the designed
  default.
- **Imagery + GLBs** are assigned at **`/admin/assets`**, scope **"Page — About"**.

## Notes

- The bundled GLBs are textured bakes: anvil ~3.9 MB (15k tris), warhammer ~6.8 MB
  (25k tris — the ornate head needs the budget).
- The desktop altar only downloads GLBs on ≥1280px screens with WebGL and motion enabled;
  phones/tablets never fetch them.
- **GLB uploads work today** — the `cms-media` Supabase bucket already allows
  `model/gltf-binary` / `model/gltf+json` (50 MB limit) with the same editor-role RLS as
  every other asset. Drag a `.glb` into `/admin/assets` → Media Library like any image; the
  Anvil/Hammer slot pickers now only list GLB/GLTF files (uploads of the wrong kind for a
  model slot no longer show up in that slot's dropdown).
- A small header pill (brand mark + "About") appears just under the site nav on
  altar-capable devices (desktop, WebGL, motion allowed) with a two-icon switch — Sparkles
  for the animated altar, rows for the classic scrolling page (the same layout mobile/tablet
  always get). The choice is remembered per browser (`localStorage`); an incapable device
  always gets the classic page regardless of a stored preference.
