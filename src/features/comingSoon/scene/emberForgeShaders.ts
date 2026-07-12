/**
 * GLSL for the Coming Soon "ember forge" particle systems.
 *
 * The anvil system morphs ~10–24k GPU particles from a scattered nebula
 * (`aScatter`) onto a target shape, then keeps them alive with per-seed
 * shimmer. The target itself is a blend of two shapes (`aFrom` → `aTo` by
 * `uMorph`), so a hammer strike can re-forge the whole cloud from the anvil
 * into the ANVL crest, The Oath emblem, a compression shirt, a barbell, a
 * hammer, and back. Two interaction fields displace the result: the pointer (a
 * forge-poke that pushes and ignites nearby embers) and a radial hammer-strike
 * shockwave. Everything is computed in the vertex stage — zero per-frame CPU
 * work on particle data.
 */

export const EMBER_ANVIL_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uMorph;
  uniform vec3 uPointer;
  uniform float uPointerActive;
  uniform vec3 uShockCenter;
  uniform float uShockRadius;
  uniform float uShockAmp;
  uniform float uHeat;
  uniform float uSize;

  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aScatter;
  attribute float aSeed;

  varying float vGlow;
  varying float vSeed;

  void main() {
    float seed = aSeed;

    // Re-forge morph: per-seed stagger so the cloud dissolves and reforms
    // shape-to-shape rather than sliding as a rigid block.
    float m = clamp(uMorph * (1.25 + seed * 0.5) - seed * 0.35, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    vec3 target = mix(aFrom, aTo, m);

    // Staggered assembly: high-seed embers arrive last.
    float t = clamp(uAssemble * (1.35 + seed * 0.6) - seed * 0.55, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 pos = mix(aScatter, target, t);

    // Mid-morph puff: embers bloom outward at the transition midpoint, then
    // settle back onto the new shape — the visible "spark" of a re-forge.
    float morphBurst = sin(clamp(uMorph, 0.0, 1.0) * 3.14159265);
    pos += normalize(target + vec3(0.0, 0.0, 1e-4)) * morphBurst * 0.3 * (0.4 + seed) * t;

    // Living shimmer — larger while scattered, a breath once forged.
    float wobble = 0.016 + 0.09 * (1.0 - t);
    pos += vec3(
      sin(uTime * (0.6 + seed) + seed * 31.4),
      cos(uTime * (0.5 + seed * 0.7) + seed * 17.2),
      sin(uTime * (0.8 + seed * 0.4) + seed * 11.7)
    ) * wobble;

    // Forge-poke: the pointer pushes embers away and ignites them.
    vec3 fromPointer = pos - uPointer;
    float pointerDist = length(fromPointer);
    float influence = smoothstep(1.5, 0.0, pointerDist) * uPointerActive;
    pos += normalize(fromPointer + 1e-4) * influence * 0.55;

    // Hammer strike: an expanding displacement ring from the strike point.
    float shockDist = length(pos - uShockCenter);
    float ring = 1.0 - smoothstep(0.0, 0.7, abs(shockDist - uShockRadius));
    float shock = ring * uShockAmp;
    pos += normalize(pos - uShockCenter + 1e-4) * shock * 1.6;

    // Slow forge-breathing: the whole anvil swells with heat and settles —
    // motion carries visibility without brightening the text zone.
    float breath = 0.06 + 0.07 * (0.5 + 0.5 * sin(uTime * 0.55 + seed * 2.0));
    vGlow = clamp(influence * 1.3 + shock * 2.2 + uHeat + breath * t + morphBurst * 0.7, 0.0, 1.0);
    vSeed = seed;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Hard cap: a particle drifting near the camera plane would otherwise
    // rasterize as a screen-sized additive point and wedge the GPU.
    float sizePx = uSize * (0.55 + seed * 0.9) * (1.0 + vGlow * 1.4) * (280.0 / max(-mvPosition.z, 0.5));
    gl_PointSize = min(sizePx, 22.0);
  }
`

export const EMBER_ANVIL_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColdColor;
  uniform vec3 uEmberColor;
  uniform vec3 uHotColor;

  varying float vGlow;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d2 = dot(uv, uv);
    if (d2 > 0.25) discard;
    float core = smoothstep(0.25, 0.0, d2);
    float twinkle = 0.75 + 0.25 * sin(uTime * (1.5 + vSeed * 3.0) + vSeed * 40.0);
    // Brighter forge: embers sit hotter at rest (more ember, less cold-grey) and
    // carry a stronger additive core.
    vec3 base = mix(uColdColor, uEmberColor, 0.35 + 0.65 * vSeed);
    vec3 color = mix(base, uHotColor, vGlow);
    float alpha = core * (0.62 + 0.42 * twinkle) * (0.78 + 0.22 * vGlow);
    gl_FragColor = vec4(color * (1.32 + twinkle * 0.5 + vGlow * 1.9), alpha);
  }
`

/** Slow-rising ambient embers filling the room around the anvil. */
export const EMBER_DRIFT_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSize;

  attribute float aSeed;

  varying float vSeed;
  varying float vFade;

  void main() {
    float seed = aSeed;
    vec3 pos = position;

    // Endless upward drift with a slow sideways sway; wraps vertically.
    float rise = mod(pos.y + uTime * (0.12 + seed * 0.22) + seed * 12.0, 12.0) - 6.0;
    pos.y = rise;
    pos.x += sin(uTime * (0.2 + seed * 0.3) + seed * 20.0) * 0.6;
    pos.z += cos(uTime * (0.16 + seed * 0.2) + seed * 9.0) * 0.5;

    // Fade near the vertical wrap edges so respawns are invisible.
    vFade = smoothstep(6.0, 4.6, abs(rise));
    vSeed = seed;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float sizePx = uSize * (0.4 + seed * 0.9) * (240.0 / max(-mvPosition.z, 0.5));
    gl_PointSize = min(sizePx, 16.0);
  }
`

export const EMBER_DRIFT_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uEmberColor;
  uniform vec3 uHotColor;

  varying float vSeed;
  varying float vFade;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d2 = dot(uv, uv);
    if (d2 > 0.25) discard;
    float core = smoothstep(0.25, 0.0, d2);
    float twinkle = 0.6 + 0.4 * sin(uTime * (1.2 + vSeed * 4.0) + vSeed * 50.0);
    vec3 color = mix(uEmberColor, uHotColor, vSeed * twinkle);
    gl_FragColor = vec4(color * (0.9 + twinkle * 0.5), core * twinkle * vFade * 0.5);
  }
`
