import { afterEach, describe, expect, it } from 'vitest'
import type Lenis from 'lenis'
import { getActiveLenis, setActiveLenis } from '../lenisRegistry'

/** The registry is a plain slot — set, read, clear. */
describe('lenisRegistry', () => {
  afterEach(() => {
    setActiveLenis(null)
  })

  it('starts empty', () => {
    expect(getActiveLenis()).toBeNull()
  })

  it('hands back the registered instance and clears it', () => {
    const fake = { scrollTo: () => {} } as unknown as Lenis
    setActiveLenis(fake)
    expect(getActiveLenis()).toBe(fake)
    setActiveLenis(null)
    expect(getActiveLenis()).toBeNull()
  })
})
