/**
 * Aurora — a slow shimmer of ember/bone/steel light breathing above the
 * anvil. A transparent, additive glow layer (no opaque fill) so it reads as
 * a magical atmosphere *over* the forge backdrop photo behind it, never
 * covering it. Pure fragment-shader gradient noise (no textures); colors
 * come in as theme uniforms so the CMS palette drives it.
 */

export const AURORA_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const AURORA_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uColorA; // ember
uniform vec3 uColorB; // bone
uniform vec3 uColorC; // steel

varying vec2 vUv;

// Cheap value noise — enough for soft bands, no texture fetch.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 p = vUv;

  // Slow drifting band field — two octaves, offset in time so the bands
  // weave instead of scrolling.
  float t = uTime * 0.03;
  float band1 = noise(vec2(p.x * 2.2 + t, p.y * 1.1 - t * 0.6));
  float band2 = noise(vec2(p.x * 3.6 - t * 0.8, p.y * 1.8 + t * 0.4));
  float veil = smoothstep(0.35, 0.9, band1 * 0.65 + band2 * 0.35);

  // Aurora lives in the upper half, fading toward the horizon behind the anvil.
  float height = smoothstep(0.18, 0.85, p.y);
  float glow = veil * height;

  // Hue drift across the band: ember → bone → steel.
  float hueMix = noise(vec2(p.x * 1.4 + t * 0.5, t * 0.3));
  vec3 aurora = mix(uColorA, uColorB, smoothstep(0.2, 0.7, hueMix));
  aurora = mix(aurora, uColorC, smoothstep(0.75, 1.0, hueMix) * 0.6);

  // Soft vignette so the plane never shows a hard edge — shapes the alpha,
  // not a color fill, since there is no opaque base anymore.
  float vig = smoothstep(1.05, 0.45, length(p - vec2(0.5, 0.42)));

  // A whisper over the photo behind it: additive, never opaque.
  float alpha = glow * vig * 0.4;
  gl_FragColor = vec4(aurora, alpha);
}
`
