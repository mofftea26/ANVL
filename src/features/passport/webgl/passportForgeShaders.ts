/**
 * GLSL for the passport forge — the claimed piece formed out of ember
 * particles on the passport console's stage, shattering across the screen on
 * section transitions and re-forming.
 *
 * Same engine family as the Coming Soon anvil and The Oath hero forge (the
 * particle-forge standard, docs/animation-guidelines.md): fixed pool, morphs
 * via `aFrom → aTo` by `uMorph` with per-seed stagger, luminance shades so
 * printed graphics glow through the form, `uReveal` fusing the cloud into the
 * DOM render. No scroll uniform — the console is a no-scroll surface; section
 * transitions are morphs to/from a screen-filling shatter cloud.
 */

export const PASSPORT_FORGE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uMorph;
  uniform float uZoom;
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

    // Morph with per-seed stagger — dissolve/reform, never a rigid slide.
    float m = clamp(uMorph * (1.25 + seed * 0.5) - seed * 0.35, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    vec3 target = mix(aFrom, aTo, m);

    // Staggered entry assembly from the scatter nebula.
    float t = clamp(uAssemble * (1.35 + seed * 0.6) - seed * 0.55, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 pos = mix(aScatter, target, t);

    // Mid-morph spark puff — kept gentle so re-forges breathe, never explode.
    float morphBurst = sin(clamp(uMorph, 0.0, 1.0) * 3.14159265);
    pos += normalize(target + vec3(0.0, 0.0, 1e-4)) * morphBurst * 0.14 * (0.4 + seed) * t;

    // Reveal = fusion: condense onto the render plane and still every spark.
    pos.z *= 1.0 - uReveal * 0.85;

    // Hover magnetism.
    pos *= uZoom;

    // Living shimmer — larger while scattered, stilled as the render fuses.
    float wobble = (0.01 + 0.05 * (1.0 - t)) * (1.0 - uReveal * 0.9);
    pos += vec3(
      sin(uTime * (0.6 + seed) + seed * 31.4),
      cos(uTime * (0.5 + seed * 0.7) + seed * 17.2),
      sin(uTime * (0.8 + seed * 0.4) + seed * 11.7)
    ) * wobble;

    float revealPulse = sin(clamp(uReveal, 0.0, 1.0) * 3.14159265);
    float breath = 0.05 + 0.06 * (0.5 + 0.5 * sin(uTime * 0.55 + seed * 2.0));
    vGlow = clamp(
      morphBurst * 0.85 + uBurst + revealPulse * 0.55 + breath * t + (uZoom - 1.0) * 5.0,
      0.0,
      1.0
    );
    vSeed = seed;
    // Embers vanish completely INTO the resolved cards — they exist only
    // while something is moving (the console also stops rendering them).
    vFade = 1.0 - uReveal;
    vShade = mix(aShadeFrom, aShadeTo, m);
    vForm = t;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Hard cap — a near-camera additive point would rasterize screen-sized.
    float sizePx = uSize * (0.55 + seed * 0.9) * (1.0 + vGlow * 1.2)
      * (1.0 - uReveal * 0.35) * (170.0 / max(-mvPosition.z, 0.5));
    gl_PointSize = min(sizePx, 13.0);
  }
`

export const PASSPORT_FORGE_FRAGMENT = /* glsl */ `
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
    // Bright source pixels burn hotter than fabric.
    float shadeGlow = vShade * vShade * 0.85 * vForm;
    vec3 base = mix(uColdColor, uEmberColor, 0.3 + 0.7 * vSeed);
    vec3 color = mix(base, uHotColor, clamp(vGlow + shadeGlow, 0.0, 1.0));
    float alpha = core * (0.6 + 0.4 * twinkle) * (0.72 + 0.25 * vGlow + 0.18 * shadeGlow) * vFade;
    gl_FragColor = vec4(color * (1.2 + twinkle * 0.5 + vGlow * 1.8 + shadeGlow * 0.9), alpha);
  }
`
