/**
 * Re-export of the canonical WebGL capability probe — the implementation
 * moved to `src/shared/webgl/isWebglAvailable.ts` when the site-wide dust
 * layer landed (shared code must not import features). Kept so existing
 * story/landing imports stay stable.
 */
export { isWebglAvailable } from '@/shared/webgl/isWebglAvailable'
