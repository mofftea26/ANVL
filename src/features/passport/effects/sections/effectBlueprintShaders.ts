/**
 * The pure half of the Blueprint Jarvis projection (the ONE sibling module
 * the effect seam allows): GLSL shader sources and the stage maths
 * (`buildProjectionData` — the body bake, typed-array attribute builds, and
 * the layout everything clamps to). No React, no three.js imports, so every
 * piece is testable/reviewable in isolation and `EffectBlueprintCanvas` stays
 * under the file-size hard limit.
 *
 * The spec plates — their strings, their raster and where they hang — moved
 * to the shared `../lib/holoTags`, alongside the other pure effect solvers
 * (`fitLayout`, `markerGeometry`), when the plates learned to honour authored
 * marker coordinates: this file was already over the hard limit, so that work
 * had to land as extraction rather than accretion.
 *
 * Still over the 500-line limit by written reason: the flagship projection
 * spans five GLSL programs (garment cloud, emitter disc, light shaft) plus
 * the body-bake/layout maths, and folding any of it into
 * `EffectBlueprintCanvas.tsx` would push THAT file over instead. Roughly a
 * third of the length is GLSL comment lines documenting the choreography
 * contract.
 */

import {
  TAG_HEIGHT,
  TAG_WIDTH,
  layoutHoloTags,
  type HoloImageBox,
  type HoloTagAnchor,
  type HoloTagSpec,
  type HoloWorldMap,
} from '../lib/holoTags'

/**
 * Steel-blueprint blue — THE one sanctioned deviation from the champagne/bone
 * particle palette, per explicit user direction 2026-07-30: the Blueprint
 * section must read as drafting film, not ember. Themeable via
 * `--pp-blueprint`; champagne stays reserved for the accents (emitter dashes,
 * tag corner ticks, the second data ring).
 */
export const BLUEPRINT_FALLBACK = '#7fb2d9'
/** Champagne accent fallback (`--color-highlight-bright`). */
export const CHAMPAGNE_FALLBACK = '#e08a4a'

/**
 * The garment cloud. Assembly streams every particle UP from the emitter ring
 * into its silhouette slot (y leads, footprint condenses behind it, with an
 * unwinding transit swirl around the shaft axis — the projector *printing*
 * the piece, never a teleport). Carried over from the liked first hologram:
 * the sweeping scan ring's flare + outward push, and the idle instrument-hum
 * shimmer. The glitch slice is a one-tick horizontal displacement of a thin
 * y-band (uGlitchAmp is zero outside the tick frames).
 */
export const GARMENT_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uScanY;
  uniform float uSize;
  uniform float uGlitchY;
  uniform float uGlitchAmp;

  attribute vec3 aFrom;
  attribute float aSeed;
  attribute float aRise;
  attribute float aShade;
  attribute float aEdge;
  attribute float aDim;

  varying float vShade;
  varying float vEdge;
  varying float vRing;
  varying float vY;
  varying float vForm;
  varying float vFlight;
  varying float vDim;

  void main() {
    // Staggered print order: bottom-up (aRise is height-weighted at build
    // time), seeded — the particle-forge aFrom→target + uAssemble idiom.
    float t = clamp(uAssemble * (1.45 + aRise * 0.7) - aRise * 0.62, 0.0, 1.0);
    // Height leads (the stream rises off the ring first)...
    float tY = 1.0 - pow(1.0 - t, 2.4);
    // ...while the footprint condenses onto the silhouette behind it.
    float tXZ = t * t * (3.0 - 2.0 * t);
    vec3 pos = vec3(
      mix(aFrom.x, position.x, tXZ),
      mix(aFrom.y, position.y, tY),
      mix(aFrom.z, position.z, tXZ)
    );
    // Transit swirl: in-flight points spiral around the shaft axis and unwind
    // to zero as they land (aFrom sits on a ring, so rotating it stays on the
    // ring — the stream corkscrews up out of the emitter).
    float swirl = (1.0 - t) * (1.8 + aSeed * 2.8);
    float ca = cos(swirl);
    float sa = sin(swirl);
    pos.xz = mat2(ca, sa, -sa, ca) * pos.xz;

    // Scan ring: points inside the sweeping band flare and push outward —
    // the projector re-tracing the form.
    float ring = 1.0 - smoothstep(0.0, 0.17, abs(pos.y - uScanY));
    pos += normalize(vec3(pos.x, 0.0, pos.z + 1e-4)) * ring * 0.02 * t;

    // Glitch tick: displace one thin horizontal slice for a frame or two.
    float glitch = step(abs(pos.y - uGlitchY), 0.09);
    pos.x += glitch * uGlitchAmp * (0.4 + aSeed * 0.6);

    // Idle shimmer — an instrument hum, orders quieter than the forge embers.
    pos.x += sin(uTime * (0.7 + aSeed) + aSeed * 31.4) * 0.006 * t;
    pos.z += cos(uTime * (0.6 + aSeed * 0.8) + aSeed * 17.2) * 0.006 * t;

    vShade = aShade;
    vEdge = aEdge;
    vRing = ring;
    vY = pos.y;
    vForm = smoothstep(0.02, 0.3, t);
    vFlight = t * (1.0 - t) * 4.0;
    vDim = aDim;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Mild luminance-keyed size (~±30%) sharpens the internal read; interior
    // fill runs a touch smaller than the shells; in-flight points swell
    // slightly so the stream sparkles. Hard cap — a near-camera additive
    // point would rasterize screen-sized.
    float sizePx = uSize * (0.6 + aSeed * 0.8) * (0.85 + 0.45 * aShade)
      * (0.75 + 0.25 * aDim)
      * (1.0 + ring * 0.9 + vFlight * 0.5) * (170.0 / max(-mvPosition.z, 0.5));
    gl_PointSize = min(sizePx, 9.0);
  }
`

/**
 * Garment fragment — the shader wins carried over verbatim in spirit from the
 * liked first pass: luminance-shaded interior (`ink = base + k·shade²`), rim
 * emphasis from the occupancy-grid edge bake, fixed contour slices, drifting
 * scanline banding, and the scan ring burning brightest of all.
 */
export const GARMENT_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uFlicker;
  uniform vec3 uHoloColor;
  uniform vec3 uHoloBright;

  varying float vShade;
  varying float vEdge;
  varying float vRing;
  varying float vY;
  varying float vForm;
  varying float vFlight;
  varying float vDim;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d2 = dot(uv, uv);
    if (d2 > 0.25) discard;
    float core = smoothstep(0.25, 0.0, d2);
    // Scanline banding — the signature hologram raster, drifting upward.
    float band = 0.7 + 0.3 * sin(vY * 22.0 - uTime * 1.6);
    // Interior definition: squared source luminance so collar, seams, folds
    // and graphics burn through while flat fabric recedes.
    float ink = 0.15 + 0.85 * vShade * vShade;
    // Contour slices: fixed latitude lines (unlike the drifting raster) —
    // the schematic-wireframe read.
    float contour = 1.0 - smoothstep(0.02, 0.1, abs(fract(vY * 4.2 + 0.5) - 0.5));
    // Rim above interior — holograms read through their silhouette edge; the
    // in-flight stream flashes toward the bright stop too.
    float lift = clamp(
      vRing * 0.9 + vShade * 0.5 + vEdge * 0.45 + contour * 0.3 + vFlight * 0.8,
      0.0, 1.0
    );
    vec3 color = mix(uHoloColor, uHoloBright, lift);
    float alpha = core * band
      * (0.2 + 0.34 * ink + 0.45 * vEdge + 0.25 * contour + 0.55 * vRing)
      * max(vForm, vFlight * 0.85) * uFlicker * vDim;
    gl_FragColor = vec4(
      color * (0.95 + vRing * 1.5 + ink * 0.55 + vEdge * 0.7 + contour * 0.4 + vFlight * 1.2),
      alpha
    );
  }
`

export const EMITTER_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * The ground emitter: a flat disc patterned in polar space — primary band,
 * thin inner guide ring, counter-rotating champagne calibration dashes,
 * sparse long ticks, and a pooled floor glow. The mesh itself never rotates;
 * `uSpin` turns the pattern, so the world-space z-squash (the projector
 * ellipse) stays put.
 */
export const EMITTER_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uSpin;
  uniform float uEmitter;
  uniform float uFlicker;
  uniform vec3 uColor;
  uniform vec3 uAccent;

  varying vec2 vUv;

  const float PI = 3.14159265;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    if (r > 1.0) discard;
    float ang = atan(p.y, p.x);
    // Primary emitter band (r 0.78 ≙ the layout's emitterR) + inner guide.
    float mainBand = 1.0 - smoothstep(0.02, 0.07, abs(r - 0.78));
    float inner = (1.0 - smoothstep(0.008, 0.03, abs(r - 0.52))) * 0.45;
    // Champagne calibration dashes on the outer rim, slowly rotating.
    float dashSeg = fract((ang + uSpin * 0.7) / (2.0 * PI) * 44.0);
    float dashes = step(dashSeg, 0.42) * (1.0 - smoothstep(0.015, 0.05, abs(r - 0.9)));
    // Sparse long ticks sweeping the other way.
    float tickSeg = fract((ang - uSpin * 0.4) / (2.0 * PI) * 8.0);
    float ticks = step(tickSeg, 0.06) * step(0.56, r) * step(r, 0.74) * 0.5;
    // The pooled light on the floor inside the ring.
    float pool = (1.0 - smoothstep(0.0, 0.85, r)) * 0.14;
    float blue = mainBand + inner + ticks + pool;
    float champ = dashes * 0.9;
    vec3 color = uColor * blue + uAccent * champ;
    float alpha = (blue * 0.55 + champ * 0.5) * uEmitter * uFlicker;
    gl_FragColor = vec4(color, alpha);
  }
`

export const SHAFT_VERTEX = /* glsl */ `
  uniform float uH;
  varying float vH;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vH = position.y / uH + 0.5;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

/**
 * The volumetric-feel light shaft: an open cone, alpha keyed to view-facing
 * (cheap path-length fake — densest through the beam's middle, gone at its
 * silhouette) times a height fade, with slow rising bands for drift. Reads at
 * very low alpha; deliberately cheap fakery.
 */
export const SHAFT_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uEmitter;
  uniform float uFlicker;
  uniform vec3 uColor;

  varying float vH;
  varying vec3 vNormal;
  varying vec3 vViewPos;

  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(-vViewPos)));
    float body = pow(facing, 1.6);
    float fade = pow(clamp(1.0 - vH, 0.0, 1.0), 1.5);
    // Slow rising bands — dust drifting up the beam.
    float bands = 0.82 + 0.18 * sin(vH * 26.0 - uTime * 1.4);
    float alpha = body * fade * bands * 0.14 * uEmitter * uFlicker;
    gl_FragColor = vec4(uColor, alpha);
  }
`

/* ---------------------------------------------------------------------------
 * Stage maths — pure layout + typed-array computation for the projection.
 * ------------------------------------------------------------------------- */

export const CAMERA_Z = 5.6
/** Lift the piece so the emitter ring fits beneath the hem. */
export const CLOUD_LIFT = 0.26
/**
 * Tube depth: the minor axis is ~42% of the LOCAL (per-row) garment width —
 * a torso's front-to-back depth relative to its width, not a bas-relief.
 * (`zHalf = rowHalfWidth * ratio`, so full depth ≈ 0.84 × the row's width
 * fraction of 0.5 — i.e. ~42% of the full row width.)
 */
const SHELL_DEPTH_RATIO = 0.42
/** Fraction of the pool that fills the interior between the two shells. */
const INTERIOR_FRAC = 0.32
/** Height bins for the per-row width profile the tube cross-section follows. */
const PROFILE_ROWS = 48
/** World z-squash of emitter + shaft — the projector ellipse's minor axis. */
export const EMITTER_SQUASH = 0.5
/**
 * Render trim on the spec plates: DRAWN at 88% of the size `holoTags` budgets.
 * That budget is a LAYOUT figure (rail clearance, same-rail gaps, viewport
 * clamps) and an earlier pass grew the plates ~40% to read at console
 * distance — which overshot; they crowd the piece they annotate. Trimming
 * here rather than in `holoTags` leaves every clamp solved for a LARGER plate
 * than we draw, so the trimmed pair only gains clearance. The canvas draws the
 * sprite AND the leader line's inner end from these, so the line still meets
 * the glass exactly.
 */
export const TAG_RENDER_TRIM = 0.88
export const TAG_DRAW_WIDTH = TAG_WIDTH * TAG_RENDER_TRIM
export const TAG_DRAW_HEIGHT = TAG_HEIGHT * TAG_RENDER_TRIM

export interface HoloLayout {
  minY: number
  maxY: number
  height: number
  halfW: number
  emitterY: number
  /** Plane edge length — the pattern's r=0.78 lands on the emitter radius. */
  emitterSize: number
  shaftH: number
  shaftBottomR: number
  shaftTopR: number
  ringR1: number
  ringR2: number
  ring1Y: number
  ring2Y: number
  /** 0–3 anchored plates — as many as the passport has real facts for. */
  tags: HoloTagAnchor[]
}

export interface ProjectionData {
  positions: Float32Array
  from: Float32Array
  seeds: Float32Array
  rises: Float32Array
  edges: Float32Array
  shades: Float32Array
  /** Per-point alpha weight: 1 = shell crust, ~0.4–0.55 = interior fill. */
  dims: Float32Array
  layout: HoloLayout
}

/**
 * Turn a sampled silhouette into the projection's buffers + stage layout.
 *
 * - Re-centers on the garment's TIGHT bounds (the sampler centers the image
 *   box — asymmetric padding would wobble the spin axis) and lifts the piece
 *   so the emitter fits beneath.
 * - Bakes the body: front/back shells on an elliptic tube whose cross-section
 *   follows the garment's own per-row width (wider at chest, narrower at
 *   waist), minor axis ~42% of the local width, plus an interior population
 *   between the shells (`aDim` < 1, so the rim/luminance hierarchy survives)
 *   — edge-on the revolution shows a solid garment with internal structure,
 *   not two curved sheets with a gap.
 * - Births every particle ON the emitter ellipse (`from`), with a bottom-up
 *   height-weighted print order (`rises`).
 * - Occupancy-grid rim bake (`edges`): a point with an empty 4-neighbour cell
 *   sits on the silhouette boundary — outer edge, neck line, sleeve gaps —
 *   and carries the outline glow.
 * - Lays out the stage clamped to the visible world box (`vpW`/`vpH`): the
 *   canvas edge is a straight line the projection must never reveal — in
 *   particular the emitter ellipse's NEAR rim projects lowest on screen and
 *   must clear the bottom edge.
 * - Hangs one plate per supplied spec (`tagsFromFacts`), at the height its
 *   marker was authored at when `imageBox` is known, else on the fixed slots.
 *
 * `imageBox` is the sampled image's world box (`imageBoxWorldSize`). It is
 * what makes an authored percent recoverable: the cloud arrives in image-box
 * space and is re-centred here on the garment's TIGHT bounds, so mapping a
 * percent against those bounds instead would drift by exactly the render's
 * padding. Null (undecodable aspect) ⇒ every plate takes its frozen slot.
 */
export function buildProjectionData(
  cloud: { positions: Float32Array; shades: Float32Array },
  count: number,
  vpW: number,
  vpH: number,
  tagSpecs: HoloTagSpec[],
  imageBox: HoloImageBox | null,
): ProjectionData {
  const positions = cloud.positions.slice()
  let minX = Infinity
  let maxX = -Infinity
  let sMinY = Infinity
  let sMaxY = -Infinity
  for (let i = 0; i < count; i += 1) {
    const x = positions[i * 3]
    const y = positions[i * 3 + 1]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < sMinY) sMinY = y
    if (y > sMaxY) sMaxY = y
  }
  const cx = (minX + maxX) / 2
  const cy = (sMinY + sMaxY) / 2
  const halfW = Math.max((maxX - minX) / 2, 1e-3)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] -= cx
    positions[i * 3 + 1] += CLOUD_LIFT - cy
  }
  const minY = sMinY - cy + CLOUD_LIFT
  const maxY = sMaxY - cy + CLOUD_LIFT
  const height = Math.max(maxY - minY, 1e-3)

  // Per-row width profile: bin the silhouette by height and track each row's
  // x-extent, so the tube's cross-section follows the garment's own width
  // (wider at chest, narrower at waist) instead of one global ellipse.
  const rowHalf = new Float32Array(PROFILE_ROWS).fill(halfW * 0.3)
  const rowCx = new Float32Array(PROFILE_ROWS)
  {
    const rowMin = new Float32Array(PROFILE_ROWS).fill(Infinity)
    const rowMax = new Float32Array(PROFILE_ROWS).fill(-Infinity)
    for (let i = 0; i < count; i += 1) {
      const row = Math.min(
        PROFILE_ROWS - 1,
        Math.max(0, Math.floor(((positions[i * 3 + 1] - minY) / height) * PROFILE_ROWS)),
      )
      const x = positions[i * 3]
      if (x < rowMin[row]) rowMin[row] = x
      if (x > rowMax[row]) rowMax[row] = x
    }
    for (let r = 0; r < PROFILE_ROWS; r += 1) {
      if (rowMax[r] >= rowMin[r]) {
        rowHalf[r] = Math.max((rowMax[r] - rowMin[r]) / 2, halfW * 0.08)
        rowCx[r] = (rowMin[r] + rowMax[r]) / 2
      }
    }
    // Smooth so sleeve-hem rows can't step the depth (3 binomial passes).
    for (let pass = 0; pass < 3; pass += 1) {
      for (let r = 0; r < PROFILE_ROWS; r += 1) {
        const prev = rowHalf[Math.max(0, r - 1)]
        const next = rowHalf[Math.min(PROFILE_ROWS - 1, r + 1)]
        rowHalf[r] = (prev + rowHalf[r] * 2 + next) / 4
        const prevC = rowCx[Math.max(0, r - 1)]
        const nextC = rowCx[Math.min(PROFILE_ROWS - 1, r + 1)]
        rowCx[r] = (prevC + rowCx[r] * 2 + nextC) / 4
      }
    }
  }

  // The body bake. A true-ellipse profile (sqrt) keeps depth toward the
  // flanks — the earlier cosine profile thinned them and the piece read
  // hollow edge-on. Interior points sit anywhere between the shells and
  // carry aDim < 1 so the crust/rim hierarchy survives.
  const dims = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    const x = positions[i * 3]
    const y = positions[i * 3 + 1]
    const row = Math.min(
      PROFILE_ROWS - 1,
      Math.max(0, Math.floor(((y - minY) / height) * PROFILE_ROWS)),
    )
    const rHalf = rowHalf[row]
    const zHalf = Math.min(Math.max(rHalf * SHELL_DEPTH_RATIO, 0.12), halfW * 0.55)
    const nx = Math.min(1, Math.max(-1, (x - rowCx[row]) / Math.max(rHalf, 0.05)))
    const profile = Math.sqrt(Math.max(0.04, 1 - nx * nx))
    if (Math.random() < INTERIOR_FRAC) {
      positions[i * 3 + 2] = zHalf * profile * (Math.random() * 2 - 1) * 0.85
      dims[i] = 0.4 + Math.random() * 0.15
    } else {
      positions[i * 3 + 2] =
        (Math.random() < 0.5 ? 1 : -1) * zHalf * profile * (0.86 + Math.random() * 0.14) +
        (Math.random() * 2 - 1) * 0.02
      dims[i] = 1
    }
  }

  const tanHalf = vpH / (2 * CAMERA_Z)
  const emitterR = Math.min(Math.max(halfW * 1.05, 0.85), (vpW / 2 - 0.1) * 0.78)
  const emitterSize = (emitterR / 0.78) * 2
  const rimZ = (emitterSize / 2) * EMITTER_SQUASH
  const emitterFloor = -0.94 * (CAMERA_Z - rimZ) * tanHalf
  const emitterY = Math.max(minY - 0.36, emitterFloor)
  const ringR1 = Math.min(Math.max(halfW * 1.45, 0.9), vpW / 2 - 0.12)
  const centerY = (minY + maxY) / 2
  /* Percent-of-image-box → this cloud's world space: undo the box centering,
     then apply the same recentre + lift the positions above received. The
     plates are camera-facing sprites at fixed anchors and the turning cloud's
     silhouette only ever narrows from its face-on half-width, so a placement
     resolved once here holds for the whole 24s revolution. */
  const toWorld: HoloWorldMap | null = imageBox
    ? (place) => ({
        x: (place.x / 100 - 0.5) * imageBox.width - cx,
        y: (0.5 - place.y / 100) * imageBox.height - cy + CLOUD_LIFT,
      })
    : null
  const tags: HoloTagAnchor[] = layoutHoloTags(
    tagSpecs,
    { minY, height, halfW, vpW, vpH },
    toWorld,
  )
  const layout: HoloLayout = {
    minY,
    maxY,
    height,
    halfW,
    emitterY,
    emitterSize,
    shaftH: Math.max(maxY - emitterY, 0.5),
    shaftBottomR: emitterR * 0.8,
    shaftTopR: emitterR * 0.5,
    ringR1,
    ringR2: ringR1 * 0.8,
    ring1Y: centerY + height * 0.06,
    ring2Y: centerY - height * 0.1,
    tags,
  }

  const from = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const rises = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2
    const r = emitterR * (0.75 + Math.random() * 0.3)
    from[i * 3] = Math.cos(a) * r
    from[i * 3 + 1] = emitterY + Math.random() * 0.08
    from[i * 3 + 2] = Math.sin(a) * r * EMITTER_SQUASH
    seeds[i] = Math.random()
    rises[i] = Math.min(1, ((positions[i * 3 + 1] - minY) / height) * 0.65 + Math.random() * 0.35)
  }

  const GRID = 26
  const spanX = Math.max(halfW * 2, 1e-3)
  const occ = new Uint8Array(GRID * GRID)
  const cellIx = new Int16Array(count)
  const cellIy = new Int16Array(count)
  for (let i = 0; i < count; i += 1) {
    const ix = Math.min(GRID - 1, Math.max(0, Math.floor(((positions[i * 3] + halfW) / spanX) * GRID)))
    const iy = Math.min(GRID - 1, Math.max(0, Math.floor(((positions[i * 3 + 1] - minY) / height) * GRID)))
    cellIx[i] = ix
    cellIy[i] = iy
    occ[iy * GRID + ix] = 1
  }
  const emptyCell = (ix: number, iy: number) =>
    ix < 0 || iy < 0 || ix >= GRID || iy >= GRID || occ[iy * GRID + ix] === 0
  const edges = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    const ix = cellIx[i]
    const iy = cellIy[i]
    edges[i] =
      emptyCell(ix - 1, iy) || emptyCell(ix + 1, iy) || emptyCell(ix, iy - 1) || emptyCell(ix, iy + 1)
        ? 1
        : 0
  }

  return { positions, from, seeds, rises, edges, shades: cloud.shades.slice(), dims, layout }
}
