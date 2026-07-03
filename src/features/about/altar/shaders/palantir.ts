/**
 * Palantír — a seeing-stone. Near-black polished crystal with a slow storm of
 * smoke and fire swirling in its depths (domain-warped fbm over object-space
 * coords, concentrated toward the visible disc's centre to fake volume), a
 * buried flickering core in the orb's own color, a glassy fresnel rim, and a
 * fixed key-light specular point so the surface reads as polished stone.
 * One material per orb; everything animates through uniforms.
 */

export const PALANTIR_VERTEX = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vViewDir;
varying vec3 vLocalPos;

void main() {
  vNormalV = normalize(normalMatrix * normal);
  vLocalPos = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

export const PALANTIR_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;   // swirl clock (hover accelerates it on the CPU side)
uniform float uSeed;   // per-orb phase so no two stones storm in sync
uniform vec3 uColor;   // the stone's inner-fire tint
uniform float uIntensity; // dim/hover/flash composite
uniform float uDissolve;  // 1 = intact, 0 = exploded away

varying vec3 vNormalV;
varying vec3 vViewDir;
varying vec3 vLocalPos;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), u.x),
        mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), u.x), u.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), u.x),
        mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), u.x), u.y),
    u.z
  );
}
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.1 + vec3(11.3);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 n = normalize(vNormalV);
  vec3 v = normalize(vViewDir);
  float facing = clamp(dot(n, v), 0.0, 1.0);

  // — The storm inside: object-space coords slowly rotating about Y, warped
  //   by a second octave band so the smoke folds instead of scrolling.
  float t = uTime * 0.22 + uSeed * 7.0;
  vec3 lp = normalize(vLocalPos);
  float ca = cos(t * 0.35);
  float sa = sin(t * 0.35);
  vec3 sp = vec3(ca * lp.x - sa * lp.z, lp.y, sa * lp.x + ca * lp.z);
  float storm = fbm(sp * 2.6 + vec3(0.0, -t * 0.4, 0.0));
  storm += 0.5 * fbm(sp * 5.2 + vec3(t * 0.25, 0.0, -t * 0.18));
  storm = smoothstep(0.38, 1.05, storm);

  // Concentrate the fire toward the disc centre — you look INTO the stone.
  float depth = pow(facing, 1.6);

  // The buried flame breathes.
  float flicker = 0.82 + 0.18 * sin(uTime * 2.3 + uSeed * 13.0) * sin(uTime * 1.1 + uSeed * 5.0);

  vec3 glass = vec3(0.012, 0.011, 0.016); // near-black crystal
  vec3 fire = uColor * (storm * depth * 1.35 + pow(facing, 5.0) * 0.5) * flicker;

  // Polished-stone rim + fixed key-light glint.
  float rim = pow(1.0 - facing, 3.2);
  vec3 rimCol = mix(uColor, vec3(0.91, 0.89, 0.85), 0.55) * rim * 0.55;
  vec3 l = normalize(vec3(-0.45, 0.65, 0.6));
  float spec = pow(clamp(dot(reflect(-l, n), v), 0.0, 1.0), 90.0) * 0.9;

  vec3 col = glass + (fire + rimCol) * uIntensity + vec3(spec) * (0.35 + 0.65 * uIntensity);
  gl_FragColor = vec4(col, (0.94 + rim * 0.06) * uDissolve);
}
`
