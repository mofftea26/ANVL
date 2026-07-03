/**
 * Void dust — slow bone-grey motes drifting through the dark, parted by the
 * pointer. All motion lives in the vertex shader (no CPU buffer writes).
 * Motes shy away from the pointer (`uPointer` world-space + force), drift
 * slows as scenes dim (`uLift`), and the field breathes faintly brighter on
 * cue (`uGlint`) — always subtle, never a glow layer. The single canonical
 * dust shader for the whole site (global layer, The Oath, About).
 */

export const DUST_VERTEX = /* glsl */ `
precision highp float;

attribute float aPhase;
attribute float aSpeed;
attribute float aSize;
attribute float aDepth;

uniform float uTime;
uniform float uLift;
uniform float uGlint;
uniform vec2 uPointer;
uniform float uPointerForce;
uniform float uPixelRatio;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform vec3 uColorHighlight;

varying float vAlpha;
varying vec3 vColor;

void main() {
  vec3 pos = position;

  // Theme-aware tint: mostly primary, an occasional secondary mote, a rare
  // highlight spark — keeps the field subtle and never a bright cluster.
  float tone = fract(aPhase * 7.0 + aDepth * 3.0);
  vColor = uColorPrimary;
  if (tone > 0.82) vColor = uColorHighlight;
  else if (tone > 0.58) vColor = uColorSecondary;

  // Slow lissajous drift, unique per mote.
  float t = uTime * aSpeed * uLift * 0.12;
  pos.x += sin(t + aPhase * 31.0) * 0.5;
  pos.y += sin(t * 0.7 + aPhase * 17.0) * 0.35;
  pos.z += cos(t * 0.5 + aPhase * 23.0) * 0.3;

  // The hand pushes the dust aside.
  vec2 toPointer = uPointer - pos.xy;
  float push = exp(-dot(toPointer, toPointer) * 0.7) * uPointerForce;
  pos.xy -= normalize(toPointer + 0.0001) * push * 0.5;

  // Depth-faded, breathing alpha.
  float twinkle = 0.75 + 0.25 * sin(uTime * 0.8 + aPhase * 47.0);
  vAlpha = (0.05 + 0.07 * aDepth) * twinkle * (1.0 + uGlint * 0.6);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z);
}
`

export const DUST_FRAGMENT = /* glsl */ `
precision highp float;

varying float vAlpha;
varying vec3 vColor;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float soft = exp(-d * 2.6);
  gl_FragColor = vec4(vColor, vAlpha * soft);
}
`
