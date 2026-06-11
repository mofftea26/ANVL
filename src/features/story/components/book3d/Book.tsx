import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { spreadPageNumbers, type BookSpread } from '@/features/story/lib/bookSpreads'
import { BookLeftPage, BookRightPage } from '@/features/story/components/BookPageView'
import { resolveBookCover } from '@/features/story/components/book3d/bookConfig'
import { useCoverTexture } from '@/features/story/components/book3d/coverTexture'
import { useBookTextures } from '@/features/story/components/book3d/useBookTextures'

/* --- One book. Closed on the shelf; the SAME object swings open to read. --- */
const COVER_W = 1.45
const COVER_H = 2.05
const BOOK_T = 0.42
const COVER_T = 0.05
const SPINE_X = -COVER_W / 2
const PAGE_W = COVER_W * 0.95
const PAGE_H = COVER_H * 0.96
const BLOCK_T = BOOK_T - COVER_T * 2
const TOP_Z = BOOK_T / 2 - COVER_T // top of the right page block
/* When open, the book recenters so the page surfaces sit on the z=0 plane —
   the CSS page layer only matches WebGL exactly there (see the Html note). */
const PAGE_PLANE_Z = (TOP_Z + 0.002 + BOOK_T / 2 + 0.012) / 2
/* drei <Html> screen-space content: world = px * factor / 400 (factor below). */
const HTML_DISTANCE = 1.24
const PAGE_PX_W = 430
const PAGE_PX_H = 610
const OPEN_DURATION = 1.05
const TURN_SPEED = 1.2
/** Released paper falls/settles with this exponential rate (per second). */
const SETTLE_RATE = 9
/** Flick this fast (rad/s) and the page commits regardless of position. */
const FLICK_VELOCITY = 1.6
const FLUTTER_COUNT = 3

function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Pages extend past their nominal width so the two sheets MEET at the spine
    (they used to stop 0.036 short on each side, exposing a cloth strip). */
const GUTTER_EXT = 0.036
/* The two page planes rest at different heights (right on the block, left on
   air above the opened cover). Their dips are tuned so both inner edges land
   at the SAME z — paper joining in one continuous valley:
   right: 0.164 − 0.012 = 0.152;  left: 0.222 − 0.070 = 0.152. */
const GUTTER_DIP_RIGHT = 0.012
const GUTTER_DIP_LEFT = 0.07

/**
 * An open-book page surface that curves down toward the spine — paper joining
 * the binding in a soft gutter instead of lying dead flat against a ridge.
 * The right page's crease is shallow/narrow (its slope faces the key light and
 * would otherwise read as a bright band); the left page carries the deep roll
 * (its slope falls in shadow, like a real gutter).
 */
/** Gutter curvature shading — paper darkens as it rolls into the binding. */
function applyGutterShade(geo: THREE.PlaneGeometry, innerEdge: number): void {
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const d = Math.abs(pos.getX(i) - innerEdge)
    const shade = 1 - 0.3 * Math.exp(-(d * d) / (2 * 0.2 * 0.2))
    colors[i * 3] = shade
    colors[i * 3 + 1] = shade
    colors[i * 3 + 2] = shade
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

function makeGutterPageGeometry(side: 'left' | 'right'): THREE.PlaneGeometry {
  const w = PAGE_W + GUTTER_EXT
  const geo = new THREE.PlaneGeometry(w, PAGE_H, 28, 1)
  const sign = side === 'right' ? -1 : 1
  geo.translate((sign * GUTTER_EXT) / 2, 0, 0)
  const innerEdge = (sign * (w + GUTTER_EXT)) / 2
  const amp = side === 'right' ? GUTTER_DIP_RIGHT : GUTTER_DIP_LEFT
  const sigma = side === 'right' ? 0.07 : 0.16
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const d = Math.abs(pos.getX(i) - innerEdge)
    pos.setZ(i, -amp * Math.exp(-(d * d) / (2 * sigma * sigma)))
  }
  applyGutterShade(geo, innerEdge)
  geo.computeVertexNormals()
  return geo
}

/** The turning leaf — reaches the spine pivot exactly (no slot at the hinge)
    and carries the same gutter shading as the resting pages. */
function makeLeafGeometry(): THREE.PlaneGeometry {
  const w = PAGE_W + GUTTER_EXT
  const geo = new THREE.PlaneGeometry(w, PAGE_H, 36, 1)
  applyGutterShade(geo, -w / 2)
  return geo
}
/** How far the leaf's hinge edge droops into the binding while turning. */
const LEAF_DROOP = 0.045

/** One leaf turn in flight — programmatic, cursor-held, or settling after release. */
interface TurnState {
  mode: 'anim' | 'drag' | 'settle'
  dir: 1 | -1
  /** Hinge angle: 0 = lying on the right stack, π = lying on the left. */
  angle: number
  /** Programmatic progress (mode 'anim'). */
  prog: number
  /** Grab distance from the spine (mode 'drag'). */
  grab: number
  /** Settle target angle (0 or π). */
  target: number
  /** Last drag samples for flick detection. */
  lastAngle: number
  lastTime: number
  velocity: number
}

interface BookProps {
  chapter: StoryChapter
  /** Closed (shelf / cover) vs. open (reading). Animated internally. */
  open: boolean
  /** Shelf idle/hover rotation (only when closed). */
  hovered?: boolean
  spin?: boolean
  /** Reading content (only used when open). */
  spreads?: BookSpread[]
  current?: number
  /** A grabbed page was carried past the spine and committed. */
  onTurned?: (dir: 1 | -1) => void
}

/**
 * The book — a cloth hardcover with a baked foil cover, gilded page block and
 * rounded spine. On the shelf it idles closed; when `open`, the *same* book
 * swings its cover open (the foil stamp dissolves first, thin pages flutter
 * after the cover) and pages turn as curling parchment leaves — either
 * programmatically (arrows) or **grabbed with the cursor**: the paper follows
 * the hand from wherever it is held, and on release it falls to whichever
 * side gravity (position + flick velocity) says.
 */
export function Book({
  chapter,
  open,
  hovered = false,
  spin = true,
  spreads,
  current = 0,
  onTurned,
}: BookProps) {
  const root = useRef<THREE.Group>(null)
  const coverHinge = useRef<THREE.Group>(null)
  const coverArtMat = useRef<THREE.MeshStandardMaterial>(null)
  const spineRef = useRef<THREE.Mesh>(null)

  // Open-book page surfaces curve into the binding (soft gutter, no hard ridge).
  const gutterGeos = useMemo(
    () => [makeGutterPageGeometry('right'), makeGutterPageGeometry('left')] as const,
    [],
  )
  const leafGeometry = useMemo(() => makeLeafGeometry(), [])
  useEffect(
    () => () => {
      gutterGeos[0].dispose()
      gutterGeos[1].dispose()
      leafGeometry.dispose()
    },
    [gutterGeos, leafGeometry],
  )
  const { cloth, parchment, pageEdge } = useBookTextures()
  const cover = resolveBookCover(chapter)
  const coverTex = useCoverTexture(cover)
  const clothColor = cover.colors.cover
  const edgeColor = cover.colors.pageEdge

  const openT = useRef(open ? 1 : 0)
  const [shown, setShown] = useState(current)
  const [revealed, setRevealed] = useState(open)
  const [turning, setTurning] = useState(false)
  const revealedRef = useRef(open)

  /* Page content uses drei <Html> in SCREEN-SPACE mode (no `transform`):
     position comes from a true camera projection of the anchor — the exact
     math WebGL paints with — so the content tracks the page meshes on every
     screen size. (transform-mode CSS-3D placed the scene ~4.6px from the CSS
     eye plane, where Chromium's compositor paints diverge canvas-dependently.)
     The scale must include the canvas height (drei's objectScale is pure
     camera math): world = px · HTML_DISTANCE/400 → factor = h·HTML_DISTANCE/400. */
  const { size, camera, gl } = useThree()
  const dfScreen = (size.height * HTML_DISTANCE) / 400

  // Flutter pages that chase the cover while it swings open.
  const flutters = useRef<Array<THREE.Group | null>>([])

  // Curling-leaf turn — shared by programmatic turns and cursor drags.
  const leafHinge = useRef<THREE.Group>(null)
  const leafBase = useRef<Float32Array | null>(null)
  const turn = useRef<TurnState | null>(null)
  const suppressNextTurn = useRef(false)
  const prevCurrent = useRef(current)

  const lastIndex = (spreads?.length ?? 1) - 1
  const canNext = open && current >= 1 && current < lastIndex
  const canPrev = open && current > 1

  useEffect(() => {
    const prev = prevCurrent.current
    prevCurrent.current = current
    if (!open) {
      setShown(current)
      return
    }
    if (prev === current) return
    if (suppressNextTurn.current) {
      // A grabbed page already physically turned — just land the content.
      suppressNextTurn.current = false
      turn.current = null
      setShown(current)
      setTurning(false)
      return
    }
    if (prev >= 1 && current >= 1) {
      const dir: 1 | -1 = current > prev ? 1 : -1
      turn.current = {
        mode: 'anim',
        dir,
        angle: dir === 1 ? 0 : Math.PI,
        prog: 0,
        grab: PAGE_W * 0.85,
        target: dir === 1 ? Math.PI : 0,
        lastAngle: 0,
        lastTime: 0,
        velocity: 0,
      }
      setTurning(true)
      setShown(current) // content stays hidden until the turn finishes
    } else {
      setShown(current)
    }
  }, [current, open])

  /** Cursor world-x relative to the spine, on the open book's page plane. */
  function cursorSpineX(clientX: number, clientY: number): number {
    const rect = gl.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector3(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1),
      0.5,
    )
    ndc.unproject(camera)
    const dir = ndc.sub(camera.position).normalize()
    if (Math.abs(dir.z) < 1e-6) return 0
    const t = -camera.position.z / dir.z
    return camera.position.x + dir.x * t // spine sits at world x = 0 when open
  }

  function beginDrag(e: ThreeEvent<PointerEvent>, dir: 1 | -1) {
    if (turning || !revealed) return
    if (dir === 1 ? !canNext : !canPrev) return
    e.stopPropagation()
    const sx = cursorSpineX(e.nativeEvent.clientX, e.nativeEvent.clientY)
    const grab = clamp(Math.abs(sx), PAGE_W * 0.25, PAGE_W)
    const angle = dir === 1 ? 0 : Math.PI
    turn.current = {
      mode: 'drag',
      dir,
      angle,
      prog: 0,
      grab,
      target: angle,
      lastAngle: angle,
      lastTime: performance.now(),
      velocity: 0,
    }
    setTurning(true)
    gl.domElement.style.cursor = 'grabbing'

    const onMove = (ev: PointerEvent) => {
      const t = turn.current
      if (!t || t.mode !== 'drag') return
      const x = cursorSpineX(ev.clientX, ev.clientY)
      const next = Math.acos(clamp(x / t.grab, -1, 1))
      const now = performance.now()
      const dt = Math.max(1, now - t.lastTime) / 1000
      t.velocity = (next - t.angle) / dt
      t.lastAngle = t.angle
      t.lastTime = now
      t.angle = next
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      gl.domElement.style.cursor = ''
      const t = turn.current
      if (!t || t.mode !== 'drag') return
      // The paper falls to whichever side it is on — a hard flick overrides.
      // (Whether that landing commits or cancels depends on the turn direction
      // and is decided in finishTurn.)
      let landsLeft = t.angle > Math.PI / 2
      if (t.velocity > FLICK_VELOCITY) landsLeft = true
      else if (t.velocity < -FLICK_VELOCITY) landsLeft = false
      t.mode = 'settle'
      t.target = landsLeft ? Math.PI : 0
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function finishTurn(landedLeft: boolean) {
    const t = turn.current
    if (!t) return
    const committed = t.dir === 1 ? landedLeft : !landedLeft
    if (committed && t.mode !== 'anim') {
      suppressNextTurn.current = true
      onTurned?.(t.dir) // parent advances `current`; effect lands the content
      return
    }
    turn.current = null
    setTurning(false)
  }

  useFrame((state, delta) => {
    // --- Cover swing: timed, eased, with a soft landing bounce. ---
    const dirOpen = open ? 1 : -1
    openT.current = clamp(openT.current + (dirOpen * delta) / OPEN_DURATION, 0, 1)
    const t = openT.current
    const oa = easeInOutCubic(t)
    if (coverHinge.current) {
      // Tiny settle: the cover lifts ~2.5° and lands again as it reaches flat.
      const bounce = t > 0.84 ? Math.sin(((t - 0.84) / 0.16) * Math.PI) * 0.045 : 0
      coverHinge.current.rotation.y = -Math.PI * 0.99 * oa + bounce
    }
    // The cloth spine sinks as the book opens — a real spine bends flat; it
    // must not stand between the open pages as a hard ridge.
    if (spineRef.current) spineRef.current.position.z = -0.14 * oa
    // The foil stamp dissolves in the first quarter of the swing — the cover
    // must read as blank cloth while the book opens (re-inks on close).
    if (coverArtMat.current) {
      coverArtMat.current.opacity = clamp(1 - t * 4, 0, 1)
    }

    // Flutter leaves follow the cover, each a beat behind the last — and are
    // hard-clamped to stay BEHIND it (a leaf overtaking the cover read as a
    // second cover flipping between the pages).
    const coverAngle = Math.PI * 0.99 * oa
    flutters.current.forEach((g, i) => {
      if (!g) return
      const visible = t > 0.18 && t < 0.97
      g.visible = visible
      if (!visible) return
      const p = clamp((t - 0.22 - i * 0.1) / 0.55, 0, 1)
      const own = Math.PI * easeInOutCubic(p)
      const angle = Math.min(own, Math.max(0, coverAngle - 0.07 * (i + 1)))
      g.rotation.y = -angle
      g.position.z = TOP_Z + 0.012 + i * 0.006 + Math.sin((angle / Math.PI) * Math.PI) * 0.04
    })

    // Reveal pages only once the cover has fully landed (and hide on close).
    if (t >= 0.97 && open && !revealedRef.current) {
      revealedRef.current = true
      setRevealed(true)
    } else if ((t <= 0.9 || !open) && revealedRef.current) {
      revealedRef.current = false
      setRevealed(false)
    }

    // --- Leaf turn: angle-driven flip + a curl wave traveling along the page. ---
    const tn = turn.current
    if (tn && leafHinge.current) {
      if (tn.mode === 'anim') {
        tn.prog = Math.min(1, tn.prog + delta * TURN_SPEED)
        const e = easeInOutCubic(tn.prog)
        tn.angle = tn.dir === 1 ? Math.PI * e : Math.PI * (1 - e)
      } else if (tn.mode === 'settle') {
        tn.angle += (tn.target - tn.angle) * Math.min(1, delta * SETTLE_RATE)
        if (Math.abs(tn.angle - tn.target) < 0.015) tn.angle = tn.target
      }

      const p = clamp(tn.angle / Math.PI, 0, 1)
      leafHinge.current.rotation.y = -Math.PI * p
      leafHinge.current.position.z = TOP_Z + Math.sin(p * Math.PI) * 0.05

      const geo = leafGeometry
      const pos = geo.attributes.position as THREE.BufferAttribute
      if (!leafBase.current) leafBase.current = Float32Array.from(pos.array as Float32Array)
      const w = PAGE_W + GUTTER_EXT
      const q = tn.dir === 1 ? p : 1 - p // curl shape mirrors going back
      const amp = 0.17 * Math.sin(p * Math.PI)
      const center = 0.8 - 0.6 * q
      const b = leafBase.current
      for (let i = 0; i < pos.count; i++) {
        const x = b[i * 3]
        const u = (x + w / 2) / w
        const wave = Math.exp(-((u - center) * (u - center)) / 0.09)
        const bow = Math.sin(u * Math.PI) * 0.35
        // The hinge edge stays drooped into the binding — paper is sewn in.
        const droop = -LEAF_DROOP * Math.exp(-((x + w / 2) * (x + w / 2)) / (2 * 0.1 * 0.1))
        pos.setXYZ(i, x, b[i * 3 + 1], b[i * 3 + 2] + droop + amp * (wave + bow))
      }
      pos.needsUpdate = true
      geo.computeVertexNormals()

      if (tn.mode === 'anim' && tn.prog >= 1) finishTurn(tn.dir === 1)
      else if (tn.mode === 'settle' && tn.angle === tn.target) finishTurn(tn.target === Math.PI)
    }

    // --- Whole-book pose: recenter when open, idle/hover when shelved. ---
    const r = root.current
    if (!r) return
    r.position.x = (COVER_W / 2) * oa
    r.position.z = -PAGE_PLANE_Z * oa // pages land on z=0 (see PAGE_PLANE_Z)
    const k = Math.min(1, delta * 5)
    if (open) {
      const lift = Math.sin(oa * Math.PI) * 0.07 // breathes up as it opens
      r.rotation.y += (0 - r.rotation.y) * k
      r.rotation.x += (0 - r.rotation.x) * k // dead-on — tilt also skews the CSS layer
      r.position.y += (lift - r.position.y) * k
    } else {
      const ty = hovered ? 0.1 : 0.5 + (spin ? Math.sin(state.clock.elapsedTime * 0.5) * 0.12 : 0)
      r.rotation.y += (ty - r.rotation.y) * k
      r.rotation.x += (-0.06 - r.rotation.x) * k
      r.position.y += ((hovered ? 0.12 : 0) - r.position.y) * k
    }
  })

  const shownSpread = spreads?.[shown]
  const numbers = spreads ? spreadPageNumbers(spreads, shown) : null
  const pageBox: CSSProperties = {
    ['--color-heading']: cover.colors.heading,
    ['--color-text']: cover.colors.text,
    ['--color-text-muted']: cover.colors.text,
    width: PAGE_PX_W,
    height: PAGE_PX_H,
    overflow: 'hidden',
  } as CSSProperties

  return (
    <group ref={root}>
      {/* Back cover */}
      <RoundedBox args={[COVER_W, COVER_H, COVER_T]} radius={0.03} smoothness={4} position={[0, 0, -BOOK_T / 2]}>
        <meshPhysicalMaterial map={cloth} color={clothColor} roughness={0.62} clearcoat={0.2} sheen={0.5} sheenColor="#6b5640" envMapIntensity={0.7} />
      </RoundedBox>

      {/* Gilded page block — narrowed at the spine so the dipped page can
          curve past its corner without the block poking through the paper. */}
      <mesh position={[0.07, 0, 0]}>
        <boxGeometry args={[PAGE_W - 0.12, PAGE_H, BLOCK_T]} />
        <meshStandardMaterial attach="material-0" map={pageEdge} color={edgeColor} roughness={0.85} />
        <meshStandardMaterial attach="material-1" color="#d9cba6" roughness={0.9} />
        <meshStandardMaterial attach="material-2" map={pageEdge} color={edgeColor} roughness={0.85} />
        <meshStandardMaterial attach="material-3" map={pageEdge} color={edgeColor} roughness={0.85} />
        <meshStandardMaterial attach="material-4" color="#e7dabb" roughness={0.9} />
        <meshStandardMaterial attach="material-5" color="#e7dabb" roughness={0.9} />
      </mesh>

      {/* Rounded cloth spine (sinks beneath the gutter when open) */}
      <RoundedBox ref={spineRef} args={[0.09, COVER_H + 0.005, BOOK_T + 0.02]} radius={0.04} smoothness={4} position={[SPINE_X, 0, 0]}>
        <meshPhysicalMaterial map={cloth} color={clothColor} roughness={0.6} clearcoat={0.2} envMapIntensity={0.6} />
      </RoundedBox>

      {/* Thin pages that flutter open behind the cover (visible mid-swing only) */}
      {Array.from({ length: FLUTTER_COUNT }, (_, i) => (
        <group
          key={i}
          ref={(g) => {
            flutters.current[i] = g
          }}
          position={[SPINE_X, 0, TOP_Z]}
          visible={false}
        >
          <mesh position={[COVER_W / 2, 0, 0]}>
            <planeGeometry args={[PAGE_W * (1 - i * 0.008), PAGE_H * (1 - i * 0.006)]} />
            <meshStandardMaterial map={parchment} color="#efe5c9" roughness={0.97} side={THREE.DoubleSide} envMapIntensity={0.2} />
          </mesh>
        </group>
      ))}

      {/* Parchment page surfaces (open only) — curving into the spine gutter */}
      {revealed ? (
        <>
          <mesh position={[0, 0, TOP_Z + 0.002]} geometry={gutterGeos[0]}>
            <meshStandardMaterial map={parchment} vertexColors roughness={0.96} side={THREE.DoubleSide} envMapIntensity={0.3} />
          </mesh>
          <mesh position={[-COVER_W, 0, BOOK_T / 2 + 0.012]} geometry={gutterGeos[1]}>
            <meshStandardMaterial map={parchment} vertexColors roughness={0.96} side={THREE.DoubleSide} envMapIntensity={0.3} />
          </mesh>
        </>
      ) : null}

      {/* Grab zones — the paper is what you grab, never the book itself. */}
      {revealed && !turning && canNext ? (
        <mesh
          position={[0, 0, TOP_Z + 0.004]}
          onPointerDown={(e) => beginDrag(e, 1)}
          onPointerOver={() => {
            gl.domElement.style.cursor = 'grab'
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = ''
          }}
        >
          <planeGeometry args={[PAGE_W, PAGE_H]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
      {revealed && !turning && canPrev ? (
        <mesh
          position={[-COVER_W, 0, BOOK_T / 2 + 0.014]}
          onPointerDown={(e) => beginDrag(e, -1)}
          onPointerOver={() => {
            gl.domElement.style.cursor = 'grab'
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = ''
          }}
        >
          <planeGeometry args={[PAGE_W, PAGE_H]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {/* Facing pages — hidden during a turn, animate in after (keyed per spread) */}
      {revealed && !turning && shownSpread && shownSpread.kind === 'spread' && numbers ? (
        <>
          {/* eps=-1 → refresh transform every frame; drei's position-guard can
              otherwise leave the overlay unscaled after its mount effect re-runs. */}
          <Html center eps={-1} distanceFactor={dfScreen} position={[-COVER_W, 0, BOOK_T / 2 + 0.012]} style={{ pointerEvents: 'none' }} occlude={false}>
            <div className="story-book-page" style={pageBox}>
              <BookLeftPage
                key={shownSpread.key}
                spread={shownSpread}
                pageNo={numbers.left}
                total={numbers.total}
                foil={cover.colors.foil}
              />
            </div>
          </Html>
          <Html center eps={-1} distanceFactor={dfScreen} position={[0, 0, TOP_Z + 0.002]} style={{ pointerEvents: 'none' }} occlude={false}>
            <div className="story-book-page" style={pageBox}>
              <BookRightPage
                key={shownSpread.key}
                spread={shownSpread}
                chapter={chapter}
                pageNo={numbers.right}
                total={numbers.total}
                foil={cover.colors.foil}
              />
            </div>
          </Html>
        </>
      ) : null}

      {/* Curling turning leaf (follows the hand or the animation, then settles) */}
      {turning ? (
        <group ref={leafHinge} position={[SPINE_X, 0, TOP_Z]}>
          <mesh position={[(PAGE_W + GUTTER_EXT) / 2, 0, 0.03]} geometry={leafGeometry}>
            <meshStandardMaterial map={parchment} vertexColors roughness={0.96} side={THREE.DoubleSide} envMapIntensity={0.3} />
          </mesh>
        </group>
      ) : null}

      {/* Front cover — hinged at the spine, baked foil cover, swings open */}
      <group ref={coverHinge} position={[SPINE_X, 0, 0]}>
        <RoundedBox args={[COVER_W, COVER_H, COVER_T]} radius={0.03} smoothness={4} position={[COVER_W / 2, 0, BOOK_T / 2]}>
          <meshPhysicalMaterial map={cloth} color={clothColor} roughness={0.6} clearcoat={0.25} clearcoatRoughness={0.6} sheen={0.5} sheenColor="#6b5640" envMapIntensity={0.8} />
        </RoundedBox>
        {coverTex ? (
          <mesh position={[COVER_W / 2, 0, BOOK_T / 2 + COVER_T / 2 + 0.004]}>
            <planeGeometry args={[COVER_W * 0.98, COVER_H * 0.98]} />
            <meshStandardMaterial ref={coverArtMat} map={coverTex} transparent roughness={0.45} metalness={0.2} envMapIntensity={1.1} />
          </mesh>
        ) : null}
      </group>
    </group>
  )
}
