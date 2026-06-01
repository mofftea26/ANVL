import { describe, expect, it } from 'vitest'

/** Pure predicate mirrored from useBrandShowcaseShell for unit tests. */
function isBrandShowcaseShell(pathname: string, mode: 'default' | 'custom'): boolean {
  return pathname === '/' && mode === 'default'
}

describe('isBrandShowcaseShell', () => {
  it('is true on / with default mode', () => {
    expect(isBrandShowcaseShell('/', 'default')).toBe(true)
  })

  it('is false on / with custom mode', () => {
    expect(isBrandShowcaseShell('/', 'custom')).toBe(false)
  })

  it('is false on other routes even in default mode', () => {
    expect(isBrandShowcaseShell('/shop', 'default')).toBe(false)
  })
})
