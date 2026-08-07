#!/usr/bin/env node
/**
 * Guards against a silent Rolldown chunking failure.
 *
 * THE BUG: when a module that is reached via `await import('...')` also gets
 * merged into the ENTRY chunk, Rolldown rewrites the dynamic import to target
 * the entry chunk itself — but does not re-export the module's bindings on that
 * namespace. The import resolves to an object missing the expected keys, so
 * destructuring silently yields `undefined` and the call site throws at runtime.
 *
 * This actually shipped: `useLenisScroll` did `await import('@/shared/lib/gsap')`
 * and destructured `{ gsap, ScrollTrigger }`. The seam was merged into the entry,
 * so `ScrollTrigger` was `undefined` and every desktop page load threw
 * "Cannot read properties of undefined (reading 'scrollerProxy')" — disabling the
 * Lenis <-> ScrollTrigger integration in production. Dev was unaffected, and the
 * whole test suite stayed green, because it only reproduces in a built bundle.
 * The fix is to pin such a module to a non-entry chunk (see `vite.config.ts`).
 *
 * The signature is easy to spot in the output: a chunk containing
 * `import("./index-<hash>.js")`. A legitimate lazy import always targets a
 * non-entry chunk, so any hit here is a bug worth investigating.
 *
 * Usage: node scripts/check-dynamic-import-entry.mjs   (run after `pnpm build`)
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ASSETS = join(process.cwd(), 'dist', 'client', 'assets')

if (!existsSync(ASSETS)) {
  console.error(`No build found at ${ASSETS}. Run \`pnpm build\` first.`)
  process.exit(2)
}

const files = readdirSync(ASSETS).filter((f) => f.endsWith('.js'))
const entryNames = files.filter((f) => /^index-[A-Za-z0-9_-]+\.js$/.test(f))

if (entryNames.length === 0) {
  console.error('Could not identify the entry chunk (no index-*.js).')
  process.exit(2)
}

const offenders = []
for (const file of files) {
  if (entryNames.includes(file)) continue
  const source = readFileSync(join(ASSETS, file), 'utf8')
  for (const entry of entryNames) {
    // Dynamic import of the entry chunk, in either quote style Rolldown emits.
    const re = new RegExp(`import\\(\\s*[\`'"]\\./${entry.replace('.', '\\.')}[\`'"]\\s*\\)`, 'g')
    const hits = source.match(re)
    if (hits) offenders.push({ file, entry, count: hits.length })
  }
}

if (offenders.length === 0) {
  console.log(`✅ No chunk dynamically imports the entry chunk (${files.length} chunks scanned).`)
  process.exit(0)
}

console.error('❌ Chunks that dynamically import the ENTRY chunk:\n')
for (const o of offenders) {
  console.error(`   ${o.file}  ->  import("./${o.entry}")  x${o.count}`)
}
console.error(
  '\nEach of these resolves to the entry namespace, which does not re-export the\n' +
    'target module\'s bindings — destructuring it yields `undefined` at runtime.\n' +
    'Pin the dynamically-imported module to its own chunk in vite.config.ts.',
)
process.exit(1)
