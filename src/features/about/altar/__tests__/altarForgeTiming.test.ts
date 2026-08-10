import { describe, expect, it } from 'vitest'
import { ALTAR_FORGE, ALTAR_STRIKE, ALTAR_SUMMON } from '../altarForgeTiming'

/**
 * The clock is pure data, so these are the *invariants* of the choreography —
 * the relationships the strike timeline and the in-canvas disintegration both
 * depend on but which neither can enforce (they only read numbers). Retuning a
 * beat is fine; a change that breaks one of these is a visible bug in the
 * strike → scroll hand-off.
 */
describe('altarForgeTiming', () => {
  it('derives the impact beat from the windup and drop', () => {
    expect(ALTAR_STRIKE.dropAt).toBeCloseTo(
      ALTAR_STRIKE.windupAt + ALTAR_STRIKE.windupDuration + ALTAR_STRIKE.windupPause,
    )
    expect(ALTAR_STRIKE.impactAt).toBeCloseTo(ALTAR_STRIKE.dropAt + ALTAR_STRIKE.dropDuration)
    // Reduced motion gets one quick arc, so its impact lands earlier.
    expect(ALTAR_STRIKE.reducedMotionImpactAt).toBeLessThan(ALTAR_STRIKE.impactAt)
  })

  it('seats the summoned anvil before the hammer winds up', () => {
    // The strike lands ON the anvil — a windup that starts while the anvil
    // is still rising would swing at empty air.
    expect(ALTAR_SUMMON.riseDuration).toBeLessThan(ALTAR_STRIKE.windupAt)
    expect(ALTAR_SUMMON.sinkDuration).toBeGreaterThan(0)
    expect(ALTAR_SUMMON.wakeFlash).toBeGreaterThan(0)
    expect(ALTAR_SUMMON.wakeFlash).toBeLessThan(1)
  })

  it('hands off only once the shroud is fully released and has hung a beat', () => {
    expect(ALTAR_FORGE.shroudHold).toBeGreaterThan(0)
    expect(ALTAR_FORGE.handoffAfterImpact).toBeCloseTo(
      ALTAR_FORGE.scatterDuration + ALTAR_FORGE.shroudHold,
    )
    expect(ALTAR_FORGE.handoffAfterImpact).toBeGreaterThan(ALTAR_FORGE.scatterDuration)
    // The stone must finish dissolving before its embers are all out.
    expect(ALTAR_FORGE.explodeDuration).toBeLessThan(ALTAR_FORGE.scatterDuration)
  })

  it('dissolves the shroud over a real window at the hand-off', () => {
    // The dissolve overlaps the scroll-away move — zero would be a hard cut,
    // and anything approaching the hand-off delay itself would leave embers
    // hanging over the next chapter.
    expect(ALTAR_FORGE.emberFadeDuration).toBeGreaterThan(0)
    expect(ALTAR_FORGE.emberFadeDuration).toBeLessThan(ALTAR_FORGE.handoffAfterImpact)
  })

  it('rings the hammer out through diminishing swings, coming to rest', () => {
    const swings = ALTAR_STRIKE.ringOut
    expect(swings.length).toBeGreaterThan(1)
    for (const swing of swings) expect(swing.duration).toBeGreaterThan(0)
    // Diminishing: each rebound overshoots less than the one before it.
    for (let i = 1; i < swings.length; i += 1) {
      expect(Math.abs(swings[i].to)).toBeLessThan(Math.abs(swings[i - 1].to))
    }
    // It has to end at rest, or the hammer never rejoins its idle sway.
    expect(swings[swings.length - 1].to).toBe(0)
  })
})
