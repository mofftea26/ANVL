import { describe, expect, it } from 'vitest'
import {
  OATH_DESKTOP_CINEMATIC_MQ,
  OATH_DESKTOP_MIN_PX,
  OATH_FINE_POINTER_DESKTOP_MQ,
  OATH_STATIC_MQ,
} from '../oathBreakpoints'

describe('oathBreakpoints', () => {
  it('uses xl (1280px) as the desktop cinematic threshold', () => {
    expect(OATH_DESKTOP_MIN_PX).toBe(1280)
    expect(OATH_DESKTOP_CINEMATIC_MQ).toContain('1280px')
    expect(OATH_FINE_POINTER_DESKTOP_MQ).toContain('1280px')
    expect(OATH_STATIC_MQ).toContain('1279.98px')
  })
})
