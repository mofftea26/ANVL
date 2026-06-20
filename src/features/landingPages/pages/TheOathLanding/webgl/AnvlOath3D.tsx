import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import type { ThreeElements } from '@react-three/fiber'

/**
 * Extrudes a (drop-mark) SVG into a layered 3D emblem: each path is classified
 * by fill into primary / mid / highlight tones and extruded with bevel, then
 * the whole logo is centered and normalized to `size` world units. Lights,
 * camera, and animation are the caller's responsibility — this renders only the
 * emblem group.
 */

type LogoTone = 'primary' | 'mid' | 'highlight'

type LogoMesh = {
  key: string
  geometry: THREE.ExtrudeGeometry
  tone: LogoTone
  zLift: number
  renderOrder: number
}

export type AnvlOath3DColors = {
  /** Main emblem body. Original SVG: rgb(43,43,43). */
  primary?: string
  /** Secondary grey details. Original SVG: rgb(186,186,186). */
  mid?: string
  /** Small bright detail cuts. Original SVG: rgb(255,255,255). */
  highlight?: string
}

export type AnvlOath3DProps = ThreeElements['group'] & {
  /** URL to the SVG file. */
  svgUrl?: string
  /** Raw SVG markup (e.g. Vite `import logoSvg from './logo.svg?raw'`). */
  svgMarkup?: string
  colors?: AnvlOath3DColors
  /** Final max width/height of the centered logo in Three.js units. */
  size?: number
  /** Extrusion depth in SVG units before normalization. */
  depth?: number
  bevelEnabled?: boolean
  bevelThickness?: number
  bevelSize?: number
  bevelSegments?: number
  curveSegments?: number
  /** Lifts the highlight/inlay pieces slightly forward to avoid z-fighting. */
  detailLift?: number
  metalness?: number
  roughness?: number
  emissive?: string
  emissiveIntensity?: number
}

const DEFAULT_COLORS: Required<AnvlOath3DColors> = {
  primary: '#2b2b2b',
  mid: '#bababa',
  highlight: '#ffffff',
}

function normalizeFill(fill?: string): string {
  if (!fill || fill === 'none') return ''
  const lower = fill.trim().toLowerCase()
  if (lower.startsWith('#')) {
    if (lower.length === 4) {
      return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`
    }
    return lower
  }
  const rgbMatch = lower.match(/rgba?\(([^)]+)\)/)
  if (!rgbMatch) return lower
  const [r, g, b] = rgbMatch[1]
    .split(',')
    .slice(0, 3)
    .map((value) => Math.round(Number.parseFloat(value.trim())))
  if ([r, g, b].some((value) => Number.isNaN(value))) return lower
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

function classifyFill(fill?: string): LogoTone {
  const normalized = normalizeFill(fill)
  if (normalized === '#ffffff' || normalized === 'white') return 'highlight'
  if (normalized === '#bababa' || normalized === '#babab9') return 'mid'
  return 'primary'
}

type BuildOptions = Required<
  Pick<
    AnvlOath3DProps,
    | 'depth'
    | 'bevelEnabled'
    | 'bevelThickness'
    | 'bevelSize'
    | 'bevelSegments'
    | 'curveSegments'
    | 'detailLift'
  >
>

function hasNonFiniteVertex(geo: THREE.BufferGeometry): boolean {
  const pos = geo.getAttribute('position')
  if (!pos) return true
  const arr = pos.array
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) return true
  }
  return false
}

function buildLogoMeshes(svgText: string, options: BuildOptions) {
  const loader = new SVGLoader()
  // `currentColor` is not a value THREE.Color understands; SVGLoader warns on
  // it. Tone is decided by classifyFill below, so swap it for a neutral grey
  // before parsing to keep the console clean.
  const data = loader.parse(svgText.replace(/currentColor/g, '#9a9a9a'))
  const box = new THREE.Box3()
  const meshes: LogoMesh[] = []

  data.paths.forEach((path, pathIndex) => {
    const fill = path.userData?.style?.fill
    // Only an explicit `fill="none"` is skipped. A missing fill or
    // `currentColor` (the brand crest paints via a parent <g fill>) still
    // extrudes — classified as the primary tone — so the whole mark renders.
    if (fill === 'none') return

    const tone = classifyFill(fill)
    const shapes = SVGLoader.createShapes(path)

    shapes.forEach((shape, shapeIndex) => {
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: options.depth,
        bevelEnabled: options.bevelEnabled,
        bevelThickness: options.bevelThickness,
        bevelSize: options.bevelSize,
        bevelSegments: options.bevelSegments,
        curveSegments: options.curveSegments,
      })
      // A bevel on a self-intersecting contour can emit NaN vertices, which
      // makes three.js warn every frame; skip those pieces.
      if (hasNonFiniteVertex(geometry)) {
        geometry.dispose()
        return
      }

      // SVG Y grows downward. Flip so the model is upright in Three.js.
      geometry.scale(1, -1, 1)
      geometry.computeVertexNormals()
      geometry.computeBoundingBox()
      if (geometry.boundingBox) box.union(geometry.boundingBox)

      const isDetail = tone !== 'primary'
      meshes.push({
        key: `${pathIndex}-${shapeIndex}-${tone}`,
        geometry,
        tone,
        zLift: isDetail ? options.detailLift : 0,
        renderOrder: isDetail ? 2 : 1,
      })
    })
  })

  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDimension = Math.max(size.x, size.y, 1)

  meshes.forEach((mesh) => {
    mesh.geometry.translate(-center.x, -center.y, -center.z + mesh.zLift)
    mesh.geometry.computeBoundingBox()
    mesh.geometry.computeBoundingSphere()
  })

  return { meshes, maxDimension }
}

export function AnvlOath3D({
  svgUrl,
  svgMarkup,
  colors,
  size = 4,
  depth = 70,
  bevelEnabled = true,
  bevelThickness = 8,
  bevelSize = 5,
  bevelSegments = 2,
  curveSegments = 12,
  detailLift = 3,
  metalness = 0.35,
  roughness = 0.42,
  emissive,
  emissiveIntensity = 0,
  ...groupProps
}: AnvlOath3DProps) {
  const [loadedSvgText, setLoadedSvgText] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (svgMarkup) {
      setLoadedSvgText(svgMarkup)
      return
    }
    if (!svgUrl) {
      setLoadedSvgText(null)
      return
    }
    fetch(svgUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load SVG: ${response.status}`)
        return response.text()
      })
      .then((text) => {
        if (!cancelled) setLoadedSvgText(text)
      })
      .catch(() => {
        if (!cancelled) setLoadedSvgText(null)
      })
    return () => {
      cancelled = true
    }
  }, [svgMarkup, svgUrl])

  const resolvedColors = {
    primary: colors?.primary ?? DEFAULT_COLORS.primary,
    mid: colors?.mid ?? DEFAULT_COLORS.mid,
    highlight: colors?.highlight ?? DEFAULT_COLORS.highlight,
  }

  const builtLogo = useMemo(() => {
    if (!loadedSvgText) return { meshes: [] as LogoMesh[], maxDimension: 1 }
    return buildLogoMeshes(loadedSvgText, {
      depth,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments,
      curveSegments,
      detailLift,
    })
  }, [
    loadedSvgText,
    depth,
    bevelEnabled,
    bevelThickness,
    bevelSize,
    bevelSegments,
    curveSegments,
    detailLift,
  ])

  useEffect(() => {
    return () => {
      builtLogo.meshes.forEach((mesh) => mesh.geometry.dispose())
    }
  }, [builtLogo])

  const materials = useMemo(() => {
    const base = {
      metalness,
      roughness,
      side: THREE.DoubleSide,
      ...(emissive
        ? { emissive: new THREE.Color(emissive), emissiveIntensity }
        : {}),
    } satisfies THREE.MeshStandardMaterialParameters
    const built = {
      primary: new THREE.MeshStandardMaterial({
        ...base,
        color: new THREE.Color(resolvedColors.primary),
      }),
      mid: new THREE.MeshStandardMaterial({
        ...base,
        color: new THREE.Color(resolvedColors.mid),
      }),
      highlight: new THREE.MeshStandardMaterial({
        ...base,
        color: new THREE.Color(resolvedColors.highlight),
      }),
    }
    // Tag the tone so consumers (e.g. the finale gradient tint) can target the
    // right band without re-deriving it from the live (animated) colour.
    built.primary.userData.tone = 'primary'
    built.mid.userData.tone = 'mid'
    built.highlight.userData.tone = 'highlight'
    return built
  }, [
    resolvedColors.primary,
    resolvedColors.mid,
    resolvedColors.highlight,
    metalness,
    roughness,
    emissive,
    emissiveIntensity,
  ])

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((material) => material.dispose())
    }
  }, [materials])

  const normalizedScale = size / builtLogo.maxDimension

  return (
    <group {...groupProps} scale={normalizedScale}>
      {builtLogo.meshes.map((mesh) => (
        <mesh
          key={mesh.key}
          geometry={mesh.geometry}
          material={materials[mesh.tone]}
          renderOrder={mesh.renderOrder}
        />
      ))}
    </group>
  )
}

export default AnvlOath3D
