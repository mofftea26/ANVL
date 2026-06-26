import { describe, expect, it } from 'vitest'
import { cameraForProgress } from '../oathModernCamera'

describe('cameraForProgress', () => {
  it('starts high and far at the threshold (descent)', () => {
    const a = cameraForProgress(0)
    expect(a.py).toBeGreaterThan(1.5) // up high
    expect(a.pz).toBeGreaterThan(5.5) // far back
    expect(a.px).toBeCloseTo(0, 1) // centred
  })

  it('converges centred and pulled back for commerce at the end', () => {
    const z = cameraForProgress(1)
    expect(z.px).toBeCloseTo(0, 1)
    expect(z.pz).toBeGreaterThan(6) // pulled back to frame the grid
    expect(z.ty).toBeLessThan(0.5) // target drifts down into the grid
  })

  it('swings off-axis during the orbital oath phase', () => {
    const orbit = cameraForProgress(0.7)
    // Somewhere on the arc — not centred on x.
    expect(Math.abs(orbit.px)).toBeGreaterThan(0.5)
  })

  it('clamps out-of-range input and always returns finite poses', () => {
    for (const p of [-1, 0, 0.25, 0.5, 0.75, 1, 2, Number.NaN]) {
      const pose = cameraForProgress(p)
      for (const v of [pose.px, pose.py, pose.pz, pose.tx, pose.ty, pose.tz]) {
        expect(Number.isFinite(v)).toBe(true)
      }
    }
  })
})
