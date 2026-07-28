import { describe, expect, it } from 'vitest'
import { FORGE_DURATION_MS } from '@/shared/lib/forge/emberForge'
import { ALTAR_FORGE, ALTAR_MODAL, ALTAR_STRIKE } from '../altarForgeTiming'

/**
 * The clock is pure data, so these are the *invariants* of the choreography —
 * the relationships `AboutAltar` and `AboutOrbModal` both depend on but which
 * neither can enforce (they only read numbers). Retuning a beat is fine; a
 * change that breaks one of these is a visible bug in the hand-off.
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

  it('hands off only once the shroud is fully released and has hung a beat', () => {
    expect(ALTAR_FORGE.shroudHold).toBeGreaterThan(0)
    expect(ALTAR_FORGE.handoffAfterImpact).toBeCloseTo(
      ALTAR_FORGE.scatterDuration + ALTAR_FORGE.shroudHold,
    )
    expect(ALTAR_FORGE.handoffAfterImpact).toBeGreaterThan(ALTAR_FORGE.scatterDuration)
    // The stone must finish dissolving before its embers are all out.
    expect(ALTAR_FORGE.explodeDuration).toBeLessThan(ALTAR_FORGE.scatterDuration)
  })

  it('runs the DOM swarm on the shared engine’s canonical duration', () => {
    expect(ALTAR_FORGE.swarmDuration).toBeCloseTo(FORGE_DURATION_MS / 1000)
  })

  it('overlaps the 3D cross-fade with the DOM swarm rather than sequencing them', () => {
    expect(ALTAR_FORGE.emberFadeDuration).toBeGreaterThan(0)
    expect(ALTAR_FORGE.emberFadeDuration).toBeLessThan(ALTAR_FORGE.swarmDuration)
  })

  it('never blurs the backdrop while the in-canvas embers are still alive', () => {
    expect(ALTAR_MODAL.backdropDelay).toBeGreaterThanOrEqual(ALTAR_FORGE.emberFadeDuration)
  })

  it('materializes the panel inside the swarm’s pass, after the cross-fade', () => {
    expect(ALTAR_MODAL.panelDelay).toBeGreaterThanOrEqual(ALTAR_FORGE.emberFadeDuration)
    expect(ALTAR_MODAL.panelDelay).toBeLessThan(ALTAR_FORGE.swarmDuration)
  })

  it('derives the ring-out’s end from the swing table it actually plays', () => {
    const swings = ALTAR_STRIKE.ringOut.reduce((total, swing) => total + swing.duration, 0)
    expect(ALTAR_STRIKE.ringOut.length).toBeGreaterThan(1)
    expect(ALTAR_STRIKE.ringOutEndAfterImpact).toBeCloseTo(ALTAR_STRIKE.hitStop + swings)
    // The chain has to come to rest, or the hammer never rejoins its idle sway.
    expect(ALTAR_STRIKE.ringOut[ALTAR_STRIKE.ringOut.length - 1].to).toBe(0)
  })

  it('parks the 3D loop only once nothing in the canvas is animating', () => {
    // After the hammer has rung out AND the shroud has fully crossfaded away…
    expect(ALTAR_FORGE.stageSettleAfterImpact).toBeGreaterThanOrEqual(
      ALTAR_STRIKE.ringOutEndAfterImpact,
    )
    expect(ALTAR_FORGE.stageSettleAfterImpact).toBeGreaterThanOrEqual(
      ALTAR_FORGE.handoffAfterImpact + ALTAR_FORGE.emberFadeDuration,
    )
    // …but before the DOM swarm's pass ends, or parking buys the swarm nothing.
    expect(ALTAR_FORGE.stageSettleAfterImpact).toBeLessThan(
      ALTAR_FORGE.handoffAfterImpact + ALTAR_FORGE.swarmDuration,
    )
  })

  it('orders the panel reveal: ignite → panel → content → stats', () => {
    expect(ALTAR_MODAL.igniteDelay).toBeLessThanOrEqual(ALTAR_MODAL.panelDelay)
    expect(ALTAR_MODAL.contentDelay).toBeGreaterThan(ALTAR_MODAL.panelDelay)
    expect(ALTAR_MODAL.statsDelay).toBeGreaterThan(ALTAR_MODAL.contentDelay)
  })
})
