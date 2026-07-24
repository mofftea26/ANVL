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
