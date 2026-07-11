import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { visualizer } from 'rollup-plugin-visualizer'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

const analyze = process.env.ANVL_ANALYZE === '1'

const config = defineConfig(({ isSsrBuild }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [devtools({
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
  }), tailwindcss(), tanstackStart(), viteReact(), ...(analyze
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
    : []), cloudflare({
    viteEnvironment: {
      name: "ssr"
    }
  })],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) return 'vendor-gsap'
          if (id.includes('node_modules/lenis')) return 'vendor-lenis'
          if (id.includes('node_modules/framer-motion')) return 'vendor-framer-motion'
          if (
            id.includes('node_modules/three/') ||
            id.includes('node_modules/@react-three/') ||
            id.includes('node_modules/troika-three-text') ||
            id.includes('node_modules/maath')
          ) {
            return 'vendor-three'
          }
          if (id.includes('node_modules/zod')) return 'vendor-zod'
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