import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    const { default: tailwindcss } = await import('@tailwindcss/vite')
    // The app's own vite.config.ts (with the TanStack Start plugin) gets
    // auto-merged in by Storybook's Vite builder. `tanstackStart()` expands
    // into several sibling plugins (manifest capture, router code-splitter,
    // router generator, ...) that all assume a full SSR app build and error
    // out (or crash) in a plain client build — strip anything TanStack-
    // router/start-flavored (and devtools/analyzer, irrelevant here) while
    // keeping everything Storybook itself added (React, docgen, etc.).
    const DROP_PLUGIN_NAME_PATTERN = /tanstack|devtools|visualizer/i
    const flattened = (await Promise.all(viteConfig.plugins ?? [])).flat(Infinity)
    viteConfig.plugins = flattened.filter((p) => {
      const name = p && typeof p === 'object' && 'name' in p ? String(p.name) : ''
      return !DROP_PLUGIN_NAME_PATTERN.test(name)
    })
    viteConfig.plugins.push(tailwindcss())
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: {
        ...viteConfig.resolve?.alias,
        '@': fileURLToPath(new URL('../src', import.meta.url)),
        '#': fileURLToPath(new URL('../src', import.meta.url)),
      },
    }
    return viteConfig
  },
}

export default config
