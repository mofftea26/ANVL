import { ForgeEmberCanvas } from './ForgeEmberCanvas'

/**
 * The shared modal's ember materialization — every dialog in the app forges
 * open the way the armory bentos do: a swarm of theme-ramp embers converges
 * from a scattered ring onto the panel's rectangle (perimeter first, a sparse
 * face fill behind it), holds a beat, and dissolves as the real panel fades
 * in underneath (see `.anvl-modal-forge` in styles.css for the panel's side
 * of the handshake).
 *
 * A thin wrapper over the shared `ForgeEmberCanvas` (`src/shared/lib/forge/emberForge.ts`
 * has the maths). Deliberately canvas-2D, not three.js: the Modal lives in
 * the shared UI chunk that admin and storefront both load, and ~500 arcs for
 * under a second is far below canvas-2D's budget — no `vendor-three` in the
 * shared path. Callers must skip rendering this under reduced motion.
 */

const COUNT = 520
/** Share of embers tracing the panel's border (the rest dust its face). */
const EDGE_SHARE = 0.62

export function ModalForgeEffect({
  targetRef,
}: {
  /** The panel the embers form — measured once on mount. */
  targetRef: React.RefObject<HTMLDivElement | null>
}) {
  // Above the panel while forming (the swarm draws the panel), below popovers.
  return (
    <ForgeEmberCanvas targetRef={targetRef} count={COUNT} edgeShare={EDGE_SHARE} zIndex={95} />
  )
}
