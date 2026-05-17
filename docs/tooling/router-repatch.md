# Admin route tree repatch (`repatch-admin-route-tree.mjs`)

TanStack Router’s code generator may regenerate `src/routeTree.gen.ts` without every handwritten admin route. This repo registers **`/admin/media`** and **`/admin/settings`** (and keeps import order consistent with `/admin/seo` and `/admin/login`) via a small post-processing script.

## When it runs

- **`pnpm dev`** — before Vite starts, so the dev server always has a patched tree.
- **`pnpm typecheck`** — before `tsc`, so type-aware tooling sees the same routes as runtime.
- **`pnpm build`** — after the Vite build, because the build step can overwrite `routeTree.gen.ts`.

## Changing the script

If you add another admin route that codegen drops:

1. Add the route file under `src/routes/admin/`.
2. Run `pnpm build` once and inspect `routeTree.gen.ts` to see what disappeared.
3. Extend `scripts/repatch-admin-route-tree.mjs` with the same three edits pattern: **imports**, **route const** block, **`children` path map**, and **`AdminRouteRoute.children`** array (follow existing `AdminMedia` / `AdminSettings` anchors).

The script **exits early** if `AdminMediaRouteImport` is already present, so repeated runs are cheap.

## Longer-term

Prefer fixing the TanStack Router plugin configuration so extra admin routes are emitted automatically; until then, keep this script aligned with `routeTree.gen.ts` anchors.
