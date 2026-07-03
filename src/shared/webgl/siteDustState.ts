/**
 * Global modulation targets for the site-wide dust layer — a plain mutable
 * singleton (zero React state). Any page may write to it to still or brighten
 * the field (e.g. a cinematic scene lowering `lift` while pinned, or a strike
 * pulsing `glint`); the dust lerps toward these targets every frame and
 * `glint` writes above the resting value decay back on the read side.
 */
export interface SiteDustState {
  /** 1 = full drift; 0..1 stills the field. */
  lift: number
  /** 0..1 breath brightness — pulse it, the field decays it back. */
  glint: number
}

export const siteDustState: SiteDustState = { lift: 1, glint: 0 }

/** One-shot brightness kick (clamped) — the field decays it back to rest. */
export function pulseSiteDust(strength = 1): void {
  siteDustState.glint = Math.min(1, Math.max(siteDustState.glint, strength))
}
