# PDP assets (Higgsfield-generated) — upload to the CMS

These four images were generated for the redesigned product detail page and
optimized to WebP. They are **not** wired into the app automatically — upload
each one through the admin so it lives in Supabase storage and the PDP picks it
up.

## How to upload
1. Open **/admin/assets**.
2. Set the scope to **Product detail** (the `pdp` page).
3. For each file below, upload it and assign it to the matching **slot**.
4. Save. The PDP reads the slot from the published projection.

Until a slot is assigned the PDP degrades gracefully (themed CSS panel / text
only), so the page is never broken.

## File → CMS slot

| File | Slot (Assets → Product detail) | Where it shows |
|---|---|---|
| `pdp-ambient-backdrop.webp` (16:9, ~40 KB) | **Ambient backdrop** (`ambientBackdrop`) | Behind the "Forged details" section |
| `pdp-material-macro.webp` (4:5, ~66 KB) | **Fabric material macro** (`materialMacro`) | Materials showcase image |
| `pdp-lifestyle.webp` (4:5, ~20 KB) | **Editorial lifestyle image** (`lifestyleImage`) | Story section |
| `pdp-size-guide.webp` (4:3, ~9 KB) | **Size-guide diagram** (`sizeGuideDiagram`) | Fit & sizing block |

> The size-guide diagram is an AI rendering — review its labels and replace with
> a measured diagram if you need exact spec accuracy.

These also work as the `/shop` armory assets pattern: the same Assets editor
controls the shop hero, card material, empty-state, and social-share slots.
