import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import type { BookSpread } from '@/features/story/lib/bookSpreads'
import { resolveBookCover } from '@/features/story/components/book3d/bookConfig'
import { useCoverTexture } from '@/features/story/components/book3d/coverTexture'
import { useBookTextures } from '@/features/story/components/book3d/useBookTextures'
import { BookPagesHtml } from '@/features/story/components/book3d/BookPagesHtml'
import {
  applyCornerPeel,
  BLOCK_T,
  BOOK_T,
  clamp,
  COVER_H,
  COVER_T,
  COVER_W,
  easeInOutCubic,
  FLICK_VELOCITY,
  FLUTTER_COUNT,
  LEAF_DROOP,
  easeInOutQuint,
  makeGutterPageGeometry,
  makeLeafGeometry,
  makeRadialShadowTexture,
  OPEN_DURATION,
  PAGE_FULL_W,
  PAGE_H,
  PAGE_PLANE_Z,
  PAGE_W,
  SETTLE_RATE,
  SPINE_X,
  TOP_Z,
  TURN_SPEED,
} from '@/features/story/components/book3d/bookGeometry'

/** Tiny scale that keeps a mesh rendered (shaders stay compiled) but sub-pixel
    and parked inside the opaque page block — pre-warmed, never visible. */
const WARM = 0.0001

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
  /** Last drag sample time for flick detection. */
  lastTime: number
  velocity: number
  /** onTurned already fired for this turn (frames keep running until the
      parent's index lands — the commit must not fire twice). */
  notified: boolean
}

/** Which spreads the two sides show while a leaf is in flight. */
interface TurnInfo {
  dir: 1 | -1
  from: number
  to: number
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
 * swings its cover open and pages turn as curling parchment leaves — either
 * programmatically (arrows) or **grabbed with the cursor**. The opening is a
 * multipage flourish: the cover swings, then thin leaves flutter open in its
 * wake onto the resting spread. The open book is alive: hovering paper peels
 * its corner up in invitation, a turning leaf catches a traveling sheen + casts
 * a shadow on the sheet below, the side not covered keeps its content (and the
 * incoming side inks in mid-turn), and the two sheets dive into a shared gutter
 * crease. The right page is laid in before the cover finishes lifting so the
 * binding is never seen empty; once open the book sits perfectly still (the page
 * DOM rides the meshes, so idle drift would float the text). Every interactive
 * mesh is pre-warmed so no shader compiles mid-gesture.
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
  const leafShadow = useRef<THREE.Mesh>(null)
  const rightPage = useRef<THREE.Mesh>(null)
  const leftPage = useRef<THREE.Mesh>(null)
  /** Decaying roll kick when a leaf turns — the book carries the paper's weight. */
  const turnRoll = useRef(0)

  // Open-book page surfaces curve into the binding (soft gutter, no hard ridge).
  const geos = useMemo(() => {
    const right = makeGutterPageGeometry('right')
    const left = makeGutterPageGeometry('left')
    const leaf = makeLeafGeometry()
    return {
      right,
      left,
      leaf,
      // Undeformed snapshots — corner peel and leaf curl rebuild from these.
      rightBase: Float32Array.from((right.attributes.position as THREE.BufferAttribute).array),
      leftBase: Float32Array.from((left.attributes.position as THREE.BufferAttribute).array),
      leafBase: Float32Array.from((leaf.attributes.position as THREE.BufferAttribute).array),
      // Baked gutter shade of the leaf — the flip sheen modulates a copy of it.
      leafBaseColor: Float32Array.from((leaf.attributes.color as THREE.BufferAttribute).array),
    }
  }, [])
  const shadowTex = useMemo(() => makeRadialShadowTexture(), [])
  useEffect(
    () => () => {
      geos.right.dispose()
      geos.left.dispose()
      geos.leaf.dispose()
      shadowTex.dispose()
    },
    [geos, shadowTex],
  )
  const { cloth, parchment, pageEdge } = useBookTextures()
  const cover = resolveBookCover(chapter)
  const coverTex = useCoverTexture(cover)
  const clothColor = cover.colors.cover
  const edgeColor = cover.colors.pageEdge

  const openT = useRef(open ? 1 : 0)
  const [shown, setShown] = useState(current)
  const [revealed, setRevealed] = useState(open)
  const [turnInfo, setTurnInfo] = useState<TurnInfo | null>(null)
  const [leafOnLeft, setLeafOnLeft] = useState(false)
  const revealedRef = useRef(open)
  const leafOnLeftRef = useRef(false)
  const turning = turnInfo !== null

  const { camera, gl } = useThree()

  // Thin leaves that flutter open in the cover's wake (the multipage opening).
  const flutters = useRef<Array<THREE.Group | null>>([])

  // Curling-leaf turn — shared by programmatic turns and cursor drags.
  const leafHinge = useRef<THREE.Group>(null)
  const turn = useRef<TurnState | null>(null)
  const suppressNextTurn = useRef(false)
  const prevCurrent = useRef(current)

  // Corner-peel invitation — hovered paper lifts its outer-bottom corner.
  const peel = useRef({ nextT: 0, prevT: 0, next: 0, prev: 0, lastNext: 0, lastPrev: 0 })

  const lastIndex = (spreads?.length ?? 1) - 1
  const canNext = open && current >= 1 && current < lastIndex
  const canPrev = open && current > 1

  function startTurn(info: TurnInfo) {
    leafOnLeftRef.current = info.dir === -1
    setLeafOnLeft(info.dir === -1)
    setTurnInfo(info)
    peel.current.nextT = 0
    peel.current.prevT = 0
    // The book takes the paper's weight: a small roll kick that decays.
    turnRoll.current = info.dir * 0.016
  }

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
      setTurnInfo(null)
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
        lastTime: 0,
        velocity: 0,
        notified: false,
      }
      startTurn({ dir, from: prev, to: current })
      setShown(current)
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
      lastTime: performance.now(),
      velocity: 0,
      notified: false,
    }
    startTurn({ dir, from: current, to: current + dir })
    gl.domElement.style.cursor = 'grabbing'

    const onMove = (ev: PointerEvent) => {
      const t = turn.current
      if (!t || t.mode !== 'drag') return
      const x = cursorSpineX(ev.clientX, ev.clientY)
      const next = Math.acos(clamp(x / t.grab, -1, 1))
      const now = performance.now()
      const dt = Math.max(1, now - t.lastTime) / 1000
      t.velocity = (next - t.angle) / dt
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
      if (!t.notified) {
        t.notified = true
        suppressNextTurn.current = true
        onTurned?.(t.dir) // parent advances `current`; effect lands the content
      }
      return
    }
    turn.current = null
    setTurnInfo(null)
  }

  useFrame((state, delta) => {
    // --- Cover swing: ceremonial — slow crack, grand mid-sweep, long soft
    //     landing (quint), finished by the settle bounce below. ---
    const dirOpen = open ? 1 : -1
    openT.current = clamp(openT.current + (dirOpen * delta) / OPEN_DURATION, 0, 1)
    const t = openT.current
    const oa = easeInOutQuint(t)
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

    // Lay the page sheets in as the cover uncovers them. The right sheet rides
    // on the gilded block, so it appears early (while the barely-cracked cover
    // still hides it) — that is what fills the spine before the cover lifts, so
    // the binding is never seen empty. The left sheet only exists once the cover
    // has swung flat beneath it (nothing to rest on before that). Scaling to a
    // sub-pixel point keeps both meshes rendered every frame (shaders stay
    // compiled — no hitch on first show) without being visible.
    if (rightPage.current) rightPage.current.scale.setScalar(t > 0.16 ? 1 : WARM)
    if (leftPage.current) leftPage.current.scale.setScalar(t > 0.95 ? 1 : WARM)

    // Multipage opening: a few thin leaves flutter over the resting right sheet
    // in the cover's wake, each a beat behind the last — hard-clamped to stay
    // BEHIND the cover so none ever reads as a second cover flipping.
    const coverAngle = Math.PI * 0.99 * oa
    flutters.current.forEach((g, i) => {
      if (!g) return
      const visible = t > 0.2 && t < 0.99
      g.visible = visible
      if (!visible) return
      const fp = clamp((t - 0.26 - i * 0.11) / 0.5, 0, 1)
      const own = Math.PI * easeInOutCubic(fp)
      const angle = Math.min(own, Math.max(0, coverAngle - 0.06 * (i + 1)))
      g.rotation.y = -angle
      g.position.z = TOP_Z + 0.014 + i * 0.006 + Math.sin(angle) * 0.05
    })

    // Reveal page content + interaction only once the cover has fully landed.
    if (t >= 0.97 && open && !revealedRef.current) {
      revealedRef.current = true
      setRevealed(true)
    } else if ((t <= 0.9 || !open) && revealedRef.current) {
      revealedRef.current = false
      setRevealed(false)
    }

    // --- Corner peel: hovered paper lifts its outer corner in invitation. ---
    const pl = peel.current
    const kp = Math.min(1, delta * 9)
    pl.next += (pl.nextT - pl.next) * kp
    pl.prev += (pl.prevT - pl.prev) * kp
    if (Math.abs(pl.next - pl.lastNext) > 0.0015) {
      applyCornerPeel(geos.right, geos.rightBase, pl.next, 'right')
      pl.lastNext = pl.next
    }
    if (Math.abs(pl.prev - pl.lastPrev) > 0.0015) {
      applyCornerPeel(geos.left, geos.leftBase, pl.prev, 'left')
      pl.lastPrev = pl.prev
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

      // The side the leaf occupies swaps mid-flight (with hysteresis so a
      // wavering hand never strobes the page content).
      const onLeft = p > (leafOnLeftRef.current ? 0.45 : 0.55)
      if (onLeft !== leafOnLeftRef.current) {
        leafOnLeftRef.current = onLeft
        setLeafOnLeft(onLeft)
      }

      // Traveling contact shadow under the airborne paper — it carries weight.
      if (leafShadow.current) {
        const mid = SPINE_X + (PAGE_FULL_W / 2) * Math.cos(tn.angle)
        leafShadow.current.position.set(mid, 0, BOOK_T / 2 + 0.02)
        leafShadow.current.scale.set(0.45 + 0.85 * Math.abs(Math.cos(tn.angle)), 1.15, 1)
        const mat = leafShadow.current.material as THREE.MeshBasicMaterial
        mat.opacity = 0.3 * Math.sin(tn.angle)
      }

      const geo = geos.leaf
      const pos = geo.attributes.position as THREE.BufferAttribute
      const col = geo.attributes.color as THREE.BufferAttribute
      const w = PAGE_FULL_W
      const q = tn.dir === 1 ? p : 1 - p // curl shape mirrors going back
      const amp = 0.19 * Math.sin(p * Math.PI)
      const center = 0.8 - 0.6 * q
      const b = geos.leafBase
      const bc = geos.leafBaseColor
      for (let i = 0; i < pos.count; i++) {
        const x = b[i * 3]
        const u = (x + w / 2) / w
        const wave = Math.exp(-((u - center) * (u - center)) / 0.085)
        const bow = Math.sin(u * Math.PI) * 0.35
        // The hinge edge stays drooped into the binding — paper is sewn in.
        const droop = -LEAF_DROOP * Math.exp(-((x + w / 2) * (x + w / 2)) / (2 * 0.1 * 0.1))
        pos.setXYZ(i, x, b[i * 3 + 1], b[i * 3 + 2] + droop + amp * (wave + bow))
        // Traveling sheen: the curl's lit crest brightens, its far flank falls
        // into self-shadow — the flipping sheet reads as dimensional paper, not
        // a flat card. Modulates the baked gutter shade (clamped to stay paper).
        const sheen = clamp(1 + amp * (1.7 * wave - 0.9 * bow), 0.72, 1.32)
        col.setXYZ(i, bc[i * 3] * sheen, bc[i * 3 + 1] * sheen, bc[i * 3 + 2] * sheen)
      }
      pos.needsUpdate = true
      col.needsUpdate = true
      geo.computeVertexNormals()

      if (tn.mode === 'anim' && tn.prog >= 1) finishTurn(tn.dir === 1)
      else if (tn.mode === 'settle' && tn.angle === tn.target) finishTurn(tn.target === Math.PI)
    } else if (leafShadow.current) {
      ;(leafShadow.current.material as THREE.MeshBasicMaterial).opacity = 0
    }

    // --- Whole-book pose: recenter when open, idle/hover when shelved. ---
    const r = root.current
    if (!r) return
    r.position.x = (COVER_W / 2) * oa
    r.position.z = -PAGE_PLANE_Z * oa // pages land on z=0 (see PAGE_PLANE_Z)
    const k = Math.min(1, delta * 5)
    if (open) {
      // Lifts gently as it opens, then sits still while reading — the page DOM
      // tracks the meshes per frame, so idle drift would make the text float.
      // The one exception: each leaf turn kicks a small decaying roll, so the
      // book visibly takes the paper's weight while the spread is already in
      // motion (never while the reader is on still text).
      turnRoll.current *= Math.exp(-delta * 2.6)
      const lift = Math.sin(oa * Math.PI) * 0.07
      r.rotation.y += (0 - r.rotation.y) * k
      r.rotation.x += (0 - r.rotation.x) * k // dead-on — tilt also skews the CSS layer
      r.rotation.z += (turnRoll.current - r.rotation.z) * k
      r.position.y += (lift - r.position.y) * k
    } else {
      const ty = hovered ? 0.1 : 0.5 + (spin ? Math.sin(state.clock.elapsedTime * 0.5) * 0.12 : 0)
      r.rotation.y += (ty - r.rotation.y) * k
      r.rotation.x += (-0.06 - r.rotation.x) * k
      r.position.y += ((hovered ? 0.12 : 0) - r.position.y) * k
    }
  })

  // Which spread each side shows. While a leaf is airborne the side it covers
  // shows nothing; the free side keeps the outgoing spread until the leaf
  // crosses the spine, then the incoming spread inks in under the settling
  // paper (DOM paints above WebGL, so covered sides must truly unmount).
  const leftIndex = !turnInfo
    ? shown
    : leafOnLeft
      ? null
      : turnInfo.dir === 1
        ? turnInfo.from
        : turnInfo.to
  const rightIndex = !turnInfo
    ? shown
    : leafOnLeft
      ? turnInfo.dir === 1
        ? turnInfo.to
        : turnInfo.from
      : null

  return (
    <group ref={root}>
      {/* Back cover */}
      <RoundedBox args={[COVER_W, COVER_H, COVER_T]} radius={0.03} smoothness={4} position={[0, 0, -BOOK_T / 2]}>
        <meshPhysicalMaterial map={cloth} color={clothColor} roughness={0.62} clearcoat={0.2} sheen={0.5} sheenColor="#6b5640" envMapIntensity={0.7} />
      </RoundedBox>

      {/* Gilded page block — narrowed at the spine so the dipped page can
          curve past its corner without the block poking through the paper. */}
      <mesh position={[0.08, 0, 0]}>
        <boxGeometry args={[PAGE_W - 0.16, PAGE_H, BLOCK_T]} />
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

      {/* Parchment page surfaces — laid at their open layout and scaled in by
          the frame loop as the cover uncovers each side (pre-warmed via a
          sub-pixel scale while closed, so the reveal never compiles a shader). */}
      <mesh ref={rightPage} position={[0, 0, TOP_Z + 0.002]} geometry={geos.right}>
        <meshStandardMaterial map={parchment} vertexColors roughness={0.96} side={THREE.DoubleSide} envMapIntensity={0.3} />
      </mesh>
      <mesh ref={leftPage} position={[-COVER_W, 0, BOOK_T / 2 + 0.012]} geometry={geos.left}>
        <meshStandardMaterial map={parchment} vertexColors roughness={0.96} side={THREE.DoubleSide} envMapIntensity={0.3} />
      </mesh>

      {/* Thin leaves that flutter open in the cover's wake (visible mid-swing
          only) — the multipage opening, hinged at the spine over the right sheet. */}
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
            <planeGeometry args={[PAGE_W * (1 - i * 0.01), PAGE_H * (1 - i * 0.008)]} />
            <meshStandardMaterial map={parchment} color="#efe5c9" roughness={0.97} side={THREE.DoubleSide} envMapIntensity={0.25} />
          </mesh>
        </group>
      ))}

      {/* Grab zones — the paper is what you grab, never the book itself.
          Hovering peels the page corner up: an invitation to turn. */}
      {revealed && !turning && canNext ? (
        <mesh
          position={[0, 0, TOP_Z + 0.004]}
          onPointerDown={(e) => beginDrag(e, 1)}
          onPointerOver={() => {
            gl.domElement.style.cursor = 'grab'
            peel.current.nextT = 1
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = ''
            peel.current.nextT = 0
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
            peel.current.prevT = 1
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = ''
            peel.current.prevT = 0
          }}
        >
          <planeGeometry args={[PAGE_W, PAGE_H]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {/* Facing page content — each side holds its spread independently so a
          turn keeps the uncovered side alive and inks the new side mid-flight. */}
      {revealed && spreads ? (
        <BookPagesHtml
          chapter={chapter}
          cover={cover}
          spreads={spreads}
          leftIndex={leftIndex}
          rightIndex={rightIndex}
        />
      ) : null}

      {/* Curling turning leaf + its traveling shadow — pre-warmed when idle. */}
      <group scale={turning ? 1 : WARM}>
        <mesh ref={leafShadow} position={[0, 0, BOOK_T / 2 + 0.02]} renderOrder={1}>
          <planeGeometry args={[PAGE_FULL_W, PAGE_H * 1.04]} />
          <meshBasicMaterial map={shadowTex} transparent opacity={0} depthWrite={false} />
        </mesh>
        <group ref={leafHinge} position={[SPINE_X, 0, TOP_Z]}>
          <mesh position={[PAGE_FULL_W / 2, 0, 0.03]} geometry={geos.leaf}>
            <meshStandardMaterial map={parchment} vertexColors roughness={0.96} side={THREE.DoubleSide} envMapIntensity={0.3} />
          </mesh>
        </group>
      </group>

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
