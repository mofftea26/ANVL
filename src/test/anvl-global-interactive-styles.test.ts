import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Guards the global interactive-surface layer in `src/styles.css` (cursor, motion-safe CTA translate). */
describe('anvl global interactive styles', () => {
  const cssPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'styles.css')
  const css = readFileSync(cssPath, 'utf8')

  it('defines shared transition tokens and cursor:pointer on enabled native controls', () => {
    expect(css).toContain('--anvl-control-transition-duration')
    expect(css).toContain('button:enabled')
    expect(css).toContain('cursor: pointer')
    expect(css).toContain("input:is([type='submit'], [type='button'], [type='reset'])")
  })

  it('scopes link motion translate to motion-ok users', () => {
    expect(css).toContain('@media (prefers-reduced-motion: no-preference)')
    expect(css).toContain('translateY(-1px)')
    expect(css).toContain('a.focus-ring.inline-flex')
  })
})
