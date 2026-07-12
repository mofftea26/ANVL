/**
 * GLSL for the hero product forge — the CMS product renders formed out of
 * ember particles in Scene 01, then resolved into the actual render.
 *
 * Same engine family as the Coming Soon anvil: a fixed particle pool morphs
 * between pre-sampled silhouette targets (`aFrom` → `aTo` by `uMorph`) with
 * per-seed stagger, all in the vertex stage. Hero-specific fields:
 *   - `aShadeFrom/aShadeTo` — source-pixel luminance, so printed graphics
 *     (crest, piping, wordmark) glow through the ember form
 *   - `uReveal` — 0..1 resolve state of the DOM product render; embers flash
 *     at the midpoint then recede to a faint halo behind the actual image
 *   - `uZoom` (hover magnetism), `uScroll` (hero scrub — loosen + dim for the
 *     creed hand-off), `uBurst` (strike heat pulse)
 */

export const HERO_FORGE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uMorph;
  uniform float uZoom;
  uniform float uScroll;
  uniform float uBurst;
  uniform float uReveal;
  uniform float uSize;

  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aScatter;
  attribute float aSeed;
  attribute float aShadeFrom;
  attribute float aShadeTo;

  varying float vGlow;
  varying float vSeed;
  varying float vFade;
  varying float vShade;
  varying float vForm;

  void main() {
    float seed = aSeed;

    // Re-forge morph: per-seed stagger so the cloud dissolves and reforms
    // shape-to-shape rather than sliding as a rigid block.
    float m = clamp(uMorph * (1.25 + seed * 0.5) - seed * 0.35, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    vec3 target = mix(aFrom, aTo, m);

    // Staggered assembly from the scatter nebula (entry choreography).
    float t = clamp(uAssemble * (1.35 + seed * 0.6) - seed * 0.55, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 pos = mix(aScatter, target, t);

    // Mid-morph spark puff — embers bloom outward at the transition midpoint.
    float morphBurst = sin(clamp(uMorph, 0.0, 1.0) * 3.14159265);
    pos += normalize(target + vec3(0.0, 0.0, 1e-4)) * morphBurst * 0.26 * (0.4 + seed) * t;

    // Scroll hand-off: the forged piece loosens back toward ember drift as the
    // hero pin ends (position spread; alpha fades via vFade below).
    float loosen = smoothstep(0.55, 1.0, uScroll);
    pos += normalize(pos + vec3(1e-4)) * loosen * (0.5 + seed * 1.3);
    pos.y += loosen * (0.3 + seed * 0.5);

    // Reveal = fusion: the embers CONDENSE into the render — the slab
    // flattens onto the image plane and every spark stills, so the cloud
    // visibly solidifies into the product instead of drifting beside it.
    pos.z *= 1.0 - uReveal * 0.85;

    // Hover magnetism — the whole piece breathes toward the cursor's attention.
    pos *= uZoom;

    // Living shimmer — larger while scattered, stilled as the render fuses.
    float wobble =
      (0.012 + 0.075 * (1.0 - t) + loosen * 0.04) * (1.0 - uReveal * 0.9);
    pos += vec3(
      sin(uTime * (0.6 + seed) + seed * 31.4),
      cos(uTime * (0.5 + seed * 0.7) + seed * 17.2),
      sin(uTime * (0.8 + seed * 0.4) + seed * 11.7)
    ) * wobble;

    // Reveal flash — a heat pulse as the render crosses into visibility.
    float revealPulse = sin(clamp(uReveal, 0.0, 1.0) * 3.14159265);

    float breath = 0.05 + 0.06 * (0.5 + 0.5 * sin(uTime * 0.55 + seed * 2.0));
    vGlow = clamp(
      morphBurst * 0.8 + uBurst + revealPulse * 0.55 + breath * t + (uZoom - 1.0) * 5.0,
      0.0,
      1.0
    );
    vSeed = seed;
    // As the render fuses in, the embers all but vanish INTO it — only a
    // whisper of heat survives, so the particles read as having become the
    // product rather than parking behind it.
    vFade = (1.0 - loosen) * (1.0 - uReveal * 0.94);
    vShade = mix(aShadeFrom, aShadeTo, m);
    vForm = t * (1.0 - loosen);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Hard cap: a particle drifting near the camera plane would otherwise
    // rasterize as a screen-sized additive point and wedge the GPU. Sparks
    // also shrink as they condense into the resolved render.
    float sizePx = uSize * (0.55 + seed * 0.9) * (1.0 + vGlow * 1.35)
      * (1.0 - uReveal * 0.35) * (170.0 / max(-mvPosition.z, 0.5));
    gl_PointSize = min(sizePx, 18.0);
  }
`

export const HERO_FORGE_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColdColor;
  uniform vec3 uEmberColor;
  uniform vec3 uHotColor;

  varying float vGlow;
  varying float vSeed;
  varying float vFade;
  varying float vShade;
  varying float vForm;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d2 = dot(uv, uv);
    if (d2 > 0.25) discard;
    float core = smoothstep(0.25, 0.0, d2);
    float twinkle = 0.75 + 0.25 * sin(uTime * (1.5 + vSeed * 3.0) + vSeed * 40.0);
    // Bright source pixels (crest, piping, wordmark) burn hotter than fabric —
    // the formed cloud reads as the product, not a generic ember blob.
    float shadeGlow = vShade * vShade * 0.85 * vForm;
    vec3 base = mix(uColdColor, uEmberColor, 0.3 + 0.7 * vSeed);
    vec3 color = mix(base, uHotColor, clamp(vGlow + shadeGlow, 0.0, 1.0));
    float alpha = core * (0.6 + 0.4 * twinkle) * (0.72 + 0.25 * vGlow + 0.18 * shadeGlow) * vFade;
    gl_FragColor = vec4(color * (1.2 + twinkle * 0.5 + vGlow * 1.8 + shadeGlow * 0.9), alpha);
  }
`
