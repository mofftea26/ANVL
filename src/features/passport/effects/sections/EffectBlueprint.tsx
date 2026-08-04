import { lazy, Suspense } from 'react'
import { useCanvasMountGate } from '@/shared/webgl/canvasTeardownGuard'
import { useBlueprintHologramGate, type PassportEffectProps } from '../effectTypes'

// The lazy() import IS the vendor-three boundary (PassportForgeGate pattern):
// three.js only downloads after the gate below has already passed.
const EffectBlueprintCanvas = lazy(() => import('./EffectBlueprintCanvas'))

/**
 * Blueprint section effect — the Jarvis projection, gated.
 *
 * This component is ONLY the gate; the projection lives in the lazy sibling.
 * `useBlueprintHologramGate` carries the whole capability decision (≥1280px
 * console MQ + no-reduced-motion + WebGL) and is shared with the console
 * host, which does two things off the same decision: it arms the CSS
 * `.pp-holo` treatment exactly when this renders null (the designed DOM
 * fallback, photo kept), and it dissolves the photograph entirely
 * (`data-holo-solo`) exactly when the canvas mounts — the projection IS the
 * product display, not an overlay. Returning null here is therefore never
 * "no effect": it is the hand-off that keeps the photo on stage.
 * `useCanvasMountGate` waits out another canvas's teardown window so a fast
 * section hop cannot push the browser over its live WebGL context budget.
 *
 * `facts` passes straight through: the projection's spec plates are captioned
 * with the passport's REAL authored blueprint facts (see `effectFacts.ts`),
 * and with none of them it simply projects no plates at all.
 */
export default function EffectBlueprint({ imageUrl, tier, facts }: PassportEffectProps) {
  const gateOpen = useBlueprintHologramGate()
  // The sheet tier never mounts the canvas — mobile keeps the CSS treatment.
  const active = gateOpen && tier === 'console' && imageUrl !== null
  const mountable = useCanvasMountGate(active)
  if (tier !== 'console' || imageUrl === null || !gateOpen || !mountable) return null
  return (
    <Suspense fallback={null}>
      <EffectBlueprintCanvas imageUrl={imageUrl} facts={facts} />
    </Suspense>
  )
}
