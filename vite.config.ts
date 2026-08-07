import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { devtools } from '@tanstack/devtools-vite'
import { visualizer } from 'rollup-plugin-visualizer'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const analyze = process.env.ANVL_ANALYZE === '1'

const config = defineConfig(({ isSsrBuild }) => ({
  resolve: { tsconfigPaths: true },
  server: {
    watch: {
      // Design-sync (claude.ai/design) writes hundreds of build artifacts into
      // these gitignored dirs. Vite otherwise watches them and fires a full
      // page reload per file, flooding HMR (and causing aborted/ECONNRESET
      // requests mid-reload). They're not app source — never watch them.
      ignored: [
        '**/ds-bundle/**',
        '**/.ds-sync/**',
        '**/.design-sync/**',
        '**/dist-ui/**',
      ],
    },
  },
  plugins: [
    // Runs the SSR environment on the Cloudflare Workers runtime (workerd) for
    // dev, preview, and build — bound to the `ssr` environment so the server
    // build targets the Worker while the client build stays a browser bundle.
    // Keeping it on in dev too gives dev↔prod parity with the deployed Worker.
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    devtools({
      // R3F cannot apply DOM `data-tsd-source` attributes to three.js
      // elements (<points>, <shaderMaterial>, …) — the injected attribute
      // crashes CanvasImpl in dev. Skip source injection for every file
      // that renders inside an R3F <Canvas>.
      injectSource: {
        enabled: true,
        ignore: {
          files: [
            /[\\/]src[\\/]shared[\\/]webgl[\\/]/,
            /[\\/]src[\\/]features[\\/]comingSoon[\\/]scene[\\/]/,
            /[\\/]src[\\/]features[\\/]about[\\/]altar[\\/]/,
            /[\\/]src[\\/]features[\\/]story[\\/]components[\\/]/,
            /[\\/]TheOathLanding[\\/]webgl[\\/]/,
          ],
        },
      },
    }),
    tailwindcss(),
    tanstackStart({
      router: {
        // `src/routes/` holds a couple of non-route files co-located with real
        // routes: the `storefrontMainLayout.ts` helper (imported directly by
        // `__root.tsx`) and `__tests__/` specs. Without this they trigger a
        // "does not export a Route" warning on every generator run.
        routeFileIgnorePattern: 'storefrontMainLayout|__tests__',
      },
    }),
    viteReact(),
    // Prints the real static/dynamic importers of the Supabase client modules
    // straight from the bundler's module graph. Source-level greps miss
    // multi-line imports and `export … from` re-exports — both hid the real
    // culprit during the F-06b work. Run: ANVL_IMPORTERS=1 pnpm build
    ...(process.env.ANVL_IMPORTERS
      ? [
          {
            name: 'anvl-importer-probe',
            buildEnd(this: {
              getModuleIds: () => Iterable<string>
              getModuleInfo: (
                id: string,
              ) => { importers?: string[]; dynamicImporters?: string[] } | null
            }) {
              const short = (s: string) => s.replace(/^.*[/\\]src[/\\]/, '')
              for (const id of this.getModuleIds()) {
                if (!/[Ss]upabase.*[Cc]lient|supabaseOrders/.test(id)) continue
                const info = this.getModuleInfo(id)
                if (!info) continue
                console.error('\n[TARGET]', short(id))
                for (const i of info.importers ?? []) console.error('   STATIC  <-', short(i))
                for (const i of info.dynamicImporters ?? []) console.error('   dynamic <-', short(i))
              }
            },
          } as unknown as import('vite').Plugin,
        ]
      : []),
    ...(analyze
      ? [
          visualizer({
            // Split by isSsrBuild so a client-targeted pass can never
            // silently overwrite a server-targeted one's report under a
            // shared filename. Note: as of this TanStack Start version,
            // `pnpm analyze` only produces one of these two files (observed:
            // stats-client.html, but its contents describe the *server*
            // chunk graph) — TanStack Start's build orchestration doesn't
            // appear to route both its internal Vite passes through this
            // plugin the way a plain Vite app would. Getting a real client-
            // bundle treemap needs a different approach (e.g. invoking Vite's
            // client build directly, bypassing the Start wrapper) — not
            // solved here; flagging so the next person doesn't lose time
            // re-discovering the same dead end.
            filename: isSsrBuild ? 'dist/stats-server.html' : 'dist/stats-client.html',
            gzipSize: true,
            brotliSize: true,
            open: false,
            template: 'treemap',
          }),
        ]
      : []),
  ],
  build: {
    sourcemap: process.env.ANVL_SOURCEMAP === '1',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Admin CMS write/publish path (cmsWriteThrough + adminCmsRemoteSync).
          // It is only ever reached via `await import(...)` from the save
          // functions, so pin it to its own chunk: this keeps the admin runtime
          // out of the storefront entry (PERF-01) AND gives the bundler a stable
          // static reference so it can't be tree-shaken away (the cause of the
          // "n is not a function" save failure in production).
          if (id.includes('/features/admin/cmsRemote/')) return 'admin-cms-remote'
          // Both of these are reached via `await import(...)` AND are otherwise
          // entry-graph modules, so Rolldown merged them into the entry chunk and
          // rewrote the dynamic import to target the entry — whose namespace does
          // NOT re-export their bindings. `runtimeClients` and
          // `getAdminSessionServerFn` both came back `undefined` at runtime.
          // Verified in a built bundle: the entry exposes 307 exports and neither
          // name is among them. Pinning them off the entry restores a real module
          // namespace. `scripts/check-dynamic-import-entry.mjs` guards this.
          if (id.includes('/app/config/runtime')) return 'app-runtime'
          if (id.includes('/features/admin/auth/adminAuth.ts')) return 'admin-auth'
          // Same failure, third site: `lazySupabaseAccountClient` does
          // `import('./supabaseAccountClient').then((m) => m.supabaseAccountClient)`.
          // Merged into the entry, that resolved to `undefined`, so EVERY account
          // method (profile read/write, order list) threw. Pin only this module —
          // pinning the whole `auth/` folder would drag `storefrontSupabaseClient`
          // (and with it all of supabase-js) back onto the eager entry graph.
          // Every module that touches the Supabase SDK, in one chunk.
          //
          // Two things were verified here and are worth not re-deriving:
          //   1. `vendor-supabase` (node_modules/@supabase) is REQUESTED below
          //      but never emitted — Rolldown merges it into this chunk, because
          //      these wrappers statically `import { createClient }` and are
          //      therefore always loaded with it.
          //   2. The entry keeps ONE static edge to this chunk even though the
          //      bundler's own module graph reports every external importer as
          //      dynamic. That edge is why supabase-js is still fetched on first
          //      paint. Splitting wrappers from vendor code does NOT help (tried:
          //      they just re-merge). See docs/deployment.md for the one change
          //      that would close it — making `createAnvlSupabaseClient` load the
          //      SDK via `await import()`, which turns the client factories async.
          if (
            id.includes('/auth/supabaseAccountClient') ||
            id.includes('/auth/storefrontSupabaseClient') ||
            id.includes('/auth/supabaseOrders') ||
            id.includes('/features/cms/api/createAnvlSupabaseClient') ||
            id.includes('/features/cms/api/supabasePublicationClient')
          ) {
            return 'supabase-clients'
          }
          // --- Keeping supabase-js OFF the eager storefront graph (F-06b) ---
          //
          // These two are the only storefront-side modules that reach the SDK.
          // They live under `features/cms/api/`, so the `cms-core` rule below
          // would claim them — and since the entry imports `cms-core` for its
          // schemas, either one alone puts all of supabase-js back on the eager
          // graph. Every consumer of both is lazy, so they belong with the SDK.
          // Must come BEFORE the `cms-core` rule (first match wins).
          // Storefront CMS read models. Shared between the entry and the admin
          // write path; without their own chunk Rolldown parked them inside
          // `admin-cms-remote`, forcing the entry to statically import that admin
          // chunk — which is what dragged supabase-js along behind it.
          if (id.includes('/features/cms/')) return 'cms-core'
          // Site-wide toast layer, shared by storefront chrome AND admin. Same
          // story: without its own chunk it landed in `admin-cms-remote` and kept
          // the entry tied to that admin chunk.
          if (id.includes('node_modules/sonner')) return 'vendor-sonner'
          // The GSAP seam (`src/shared/lib/gsap.ts`) MUST share a chunk with the
          // gsap vendor code and must never be merged into the entry.
          //
          // WHY: `useLenisScroll` reaches it via `await import('@/shared/lib/gsap')`
          // and destructures `{ gsap, ScrollTrigger }`. When Rolldown merges the
          // seam into the entry chunk, that dynamic import resolves to the ENTRY's
          // namespace, which does not re-export those bindings — so `ScrollTrigger`
          // came back `undefined` and every desktop page load threw
          // "Cannot read properties of undefined (reading 'scrollerProxy')",
          // silently disabling the Lenis↔ScrollTrigger integration in production.
          // (Dev was fine; this only reproduced in a built bundle.)
          //
          // Same failure mode, and same fix, as the `admin-cms-remote` pin above.
          if (id.includes('/shared/lib/gsap')) return 'vendor-gsap'
          if (id.includes('node_modules/gsap')) return 'vendor-gsap'
          if (id.includes('node_modules/lenis')) return 'vendor-lenis'
          if (
            id.includes('node_modules/three/') ||
            id.includes('node_modules/@react-three/') ||
            id.includes('node_modules/troika-three-text') ||
            id.includes('node_modules/maath')
          ) {
            return 'vendor-three'
          }
          // pdf.js is only reached from the admin techpack parser via a lazy
          // `await import()`. It is ~1 MB with its worker, so it gets its own
          // chunk: nothing else in the admin should pay for it, and it must
          // never appear in the storefront entry.
          if (id.includes('node_modules/pdfjs-dist')) return 'vendor-pdfjs'
          if (id.includes('node_modules/zod')) return 'vendor-zod'
          // supabase-js (GoTrue + Realtime) is deferred off the storefront
          // entry (lazy account client) — keep it in one cacheable chunk for
          // the auth / account routes that do load it.
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase'
          if (id.includes('node_modules/fuse.js')) return 'vendor-fuse'
          if (id.includes('node_modules/@tanstack')) return 'vendor-tanstack'
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/')
          ) {
            return 'vendor-react'
          }
        },
      },
    },
  },
}))

export default config
