/**
 * The chapter-boundary ember burst — the particle-forge standard's uniform
 * vocabulary (`uMorph` / `uBurst` / `uTime`, per-seed stagger on `aFrom→aTo`)
 * applied to the film's transitions: the outgoing chapter's silhouette lets
 * go into embers mid-flight and condenses into the incoming chapter's.
 *
 * `vAlpha` rides `uBurst`, so the whole population exists only while a burst
 * is decaying — idle frames draw nothing (the mesh is also hidden).
 */

export const BOUNDARY_VERTEX = /* glsl */ `
precision highp float;

attribute vec3 aFrom;
attribute vec3 aTo;
attribute float aSeed;
attribute float aSize;
attribute float aShadeFrom;
attribute float aShadeTo;

uniform float uTime;
uniform float uMorph;
uniform float uBurst;
uniform float uPixelRatio;

varying float vAlpha;
varying float vSeed;
varying float vGlow;

void main() {
  // Per-seed stagger (particle-forge rule 3): each ember leaves and lands on
  // its own beat, so the form never moves as one rigid sheet.
  float prog = clamp(uMorph * (1.25 + aSeed * 0.5) - aSeed * 0.35, 0.0, 1.0);
  float eased = prog * prog * (3.0 - 2.0 * prog);
  vec3 pos = mix(aFrom, aTo, eased);

  // Mid-flight the embers loosen into living drift — peak displacement at the
  // morph's midpoint, settling to zero as the new form lands.
  float flight = sin(eased * 3.14159265);
  pos += flight * (0.28 + aSeed * 0.34) * vec3(
    sin(uTime * 1.3 + aSeed * 21.0),
    cos(uTime * 1.1 + aSeed * 17.0),
    sin(uTime * 0.9 + aSeed * 29.0) * 0.45
  );

  // Heat: the burst ignites everything; flight keeps airborne embers hot.
  vGlow = clamp(uBurst * (0.55 + aSeed * 0.45) + flight * 0.5, 0.0, 1.0);

  // The source pixel's brightness carries through the flight, so a chapter's
  // highlights hand over to the next chapter's highlights.
  float shade = mix(aShadeFrom, aShadeTo, eased);
  vAlpha = uBurst * (0.3 + 0.7 * shade);
  vSeed = aSeed;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  // Hard cap — a near-camera additive point would rasterize screen-sized.
  float sizePx = aSize * uPixelRatio * (1.0 + vGlow * 0.8) * (300.0 / -mv.z);
  gl_PointSize = min(sizePx, 16.0 * uPixelRatio);
}
`

export const BOUNDARY_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uColdColor;
uniform vec3 uEmberColor;
uniform vec3 uHotColor;

varying float vAlpha;
varying float vSeed;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d2 = dot(uv, uv);
  if (d2 > 0.25) discard;
  float core = smoothstep(0.25, 0.0, d2);
  float twinkle = 0.75 + 0.25 * sin(uTime * (1.5 + vSeed * 3.0) + vSeed * 40.0);
  vec3 base = mix(uColdColor, uEmberColor, 0.3 + 0.7 * vSeed);
  vec3 color = mix(base, uHotColor, vGlow);
  float alpha = core * (0.6 + 0.4 * twinkle) * (0.7 + 0.3 * vGlow) * vAlpha;
  gl_FragColor = vec4(color * (1.2 + twinkle * 0.4 + vGlow * 1.7), alpha);
}
`
