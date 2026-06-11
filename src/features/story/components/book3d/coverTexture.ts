import { useEffect, useState } from 'react'
import * as THREE from 'three'
import type { BookCover } from '@/features/story/components/book3d/bookConfig'

/**
 * Bakes the book cover (drop label + logo/crest + foil title + brand) to a
 * canvas texture stamped on the cloth. Replaces the old drei `<Html>` cover,
 * which flickered/jumped on mount — a baked texture is placed once, correctly,
 * and is lit like a real foil stamp. SVG logos are tinted to the foil colour.
 */

function isSvg(src: string): boolean {
  return /\.svg(\?|#|$)/i.test(src)
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return [200, 164, 90]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(hex: string, other: [number, number, number], t: number): string {
  const [r, g, b] = hexToRgb(hex)
  const r2 = Math.round(r + (other[0] - r) * t)
  const g2 = Math.round(g + (other[1] - g) * t)
  const b2 = Math.round(b + (other[2] - b) * t)
  return `rgb(${r2},${g2},${b2})`
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function ensureFonts(): Promise<void> {
  try {
    if (typeof document === 'undefined' || !document.fonts) return
    await Promise.all([
      document.fonts.load('400 96px "Anton"'),
      document.fonts.load('600 30px "Cinzel"'),
    ])
  } catch {
    /* fall back to system fonts */
  }
}

function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number,
): void {
  const widths = [...text].map((ch) => ctx.measureText(ch).width + spacing)
  const total = widths.reduce((a, b) => a + b, 0) - spacing
  let x = cx - total / 2
  ctx.textAlign = 'left'
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], x, y)
    x += widths[i]
  }
  ctx.textAlign = 'center'
}

/** Word-wrap centred text; returns the y just below the last line. */
function wrapTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  top: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  let y = top
  for (const l of lines) {
    ctx.fillText(l, cx, y)
    y += lineHeight
  }
  return y
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: boolean,
): void {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x, y + r)
  ctx.lineTo(x - r, y)
  ctx.closePath()
  if (fill) ctx.fill()
  else ctx.stroke()
}

/** Corner bracket + inward scroll curl + diamond — one ancient corner piece. */
function drawCornerFlourish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sx: 1 | -1,
  sy: 1 | -1,
): void {
  ctx.beginPath()
  ctx.moveTo(x + sx * 96, y)
  ctx.lineTo(x + sx * 20, y)
  ctx.quadraticCurveTo(x, y, x, y + sy * 20)
  ctx.lineTo(x, y + sy * 96)
  ctx.stroke()
  // Scroll curl spiralling inward from the horizontal arm.
  ctx.beginPath()
  ctx.moveTo(x + sx * 70, y + sy * 12)
  ctx.quadraticCurveTo(x + sx * 28, y + sy * 14, x + sx * 24, y + sy * 44)
  ctx.quadraticCurveTo(x + sx * 22, y + sy * 64, x + sx * 38, y + sy * 62)
  ctx.quadraticCurveTo(x + sx * 50, y + sy * 60, x + sx * 46, y + sy * 48)
  ctx.stroke()
  drawDiamond(ctx, x + sx * 13, y + sy * 13, 8, true)
}

/** A small side ornament: diamond flanked by short rules. */
function drawSideOrnament(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vertical: boolean,
): void {
  drawDiamond(ctx, x, y, 9, false)
  drawDiamond(ctx, x, y, 4, true)
  ctx.beginPath()
  if (vertical) {
    ctx.moveTo(x, y - 50)
    ctx.lineTo(x, y - 16)
    ctx.moveTo(x, y + 16)
    ctx.lineTo(x, y + 50)
  } else {
    ctx.moveTo(x - 50, y)
    ctx.lineTo(x - 16, y)
    ctx.moveTo(x + 16, y)
    ctx.lineTo(x + 50, y)
  }
  ctx.stroke()
}

/**
 * Ancient ornamental layer — double frame, corner scrollwork, side diamonds,
 * and a faint compass medallion behind the logo. All foil, alpha-tuned so the
 * stamp reads as worn tooling rather than print.
 */
function drawOrnaments(ctx: CanvasRenderingContext2D, W: number, H: number, foil: string): void {
  ctx.save()
  ctx.strokeStyle = foil
  ctx.fillStyle = foil

  // Double frame: heavier outer rule, fine inner rule.
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 3
  ctx.strokeRect(34, 34, W - 68, H - 68)
  ctx.globalAlpha = 0.4
  ctx.lineWidth = 1.5
  ctx.strokeRect(56, 56, W - 112, H - 112)

  // Corner flourishes on the inner frame.
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 2.5
  drawCornerFlourish(ctx, 56, 56, 1, 1)
  drawCornerFlourish(ctx, W - 56, 56, -1, 1)
  drawCornerFlourish(ctx, 56, H - 56, 1, -1)
  drawCornerFlourish(ctx, W - 56, H - 56, -1, -1)

  // Side + top/bottom midpoint ornaments.
  ctx.globalAlpha = 0.45
  ctx.lineWidth = 2
  drawSideOrnament(ctx, 56, H / 2, true)
  drawSideOrnament(ctx, W - 56, H / 2, true)
  drawSideOrnament(ctx, W / 2, H - 56, false)

  // Faint compass medallion behind the logo block.
  const my = H * 0.32
  const r1 = W * 0.355
  const r2 = W * 0.305
  ctx.globalAlpha = 0.13
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(W / 2, my, r1, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(W / 2, my, r2, 0, Math.PI * 2)
  ctx.stroke()
  // Tick marks between the rings, every 15°.
  ctx.globalAlpha = 0.11
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(W / 2 + Math.cos(a) * r2, my + Math.sin(a) * r2)
    ctx.lineTo(W / 2 + Math.cos(a) * r1, my + Math.sin(a) * r1)
    ctx.stroke()
  }
  // Cardinal diamonds on the outer ring.
  ctx.globalAlpha = 0.2
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    drawDiamond(ctx, W / 2 + Math.cos(a) * r1, my + Math.sin(a) * r1, 10, true)
  }

  ctx.restore()
}

async function drawCover(cover: BookCover): Promise<HTMLCanvasElement> {
  const W = 1024
  const H = 1448 // matches the cover plane aspect (≈ 1.41)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  await ensureFonts()
  const foil = cover.colors.foil
  const cx = W / 2

  // Ancient tooling behind everything else.
  drawOrnaments(ctx, W, H, foil)

  // Drop label (top).
  ctx.fillStyle = foil
  ctx.textBaseline = 'alphabetic'
  ctx.font = '600 30px "Cinzel", serif'
  drawSpaced(ctx, cover.dropLabel.toUpperCase(), cx, H * 0.14, 9)

  // Logo / crest (tinted foil for SVGs).
  const logoSrc = cover.logoSrc ?? '/brand/mark.svg'
  let y = H * 0.18
  const img = await loadImage(logoSrc)
  if (img && img.width > 0) {
    const maxW = W * 0.62
    const maxH = H * 0.28
    const r = Math.min(maxW / img.width, maxH / img.height)
    const lw = img.width * r
    const lh = img.height * r
    const lx = cx - lw / 2
    if (isSvg(logoSrc)) {
      const tint = document.createElement('canvas')
      tint.width = Math.max(1, Math.round(lw))
      tint.height = Math.max(1, Math.round(lh))
      const tctx = tint.getContext('2d')
      if (tctx) {
        tctx.drawImage(img, 0, 0, tint.width, tint.height)
        tctx.globalCompositeOperation = 'source-in'
        tctx.fillStyle = foil
        tctx.fillRect(0, 0, tint.width, tint.height)
        ctx.drawImage(tint, lx, y)
      }
    } else {
      ctx.drawImage(img, lx, y, lw, lh)
    }
    y += lh + H * 0.04
  } else {
    y += H * 0.3
  }

  // Title (foil gradient, wrapped).
  const titleSize = Math.round(W * 0.115)
  ctx.font = `400 ${titleSize}px "Anton", sans-serif`
  const grad = ctx.createLinearGradient(0, y, 0, y + titleSize * 1.3)
  grad.addColorStop(0, mix(foil, [255, 255, 255], 0.45))
  grad.addColorStop(0.55, foil)
  grad.addColorStop(1, mix(foil, [0, 0, 0], 0.45))
  ctx.fillStyle = grad
  ctx.textAlign = 'center'
  y = wrapTitle(ctx, cover.title.toUpperCase(), cx, y + titleSize, W * 0.84, titleSize * 0.95)

  // Foil rule.
  ctx.strokeStyle = foil
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - W * 0.14, y + 16)
  ctx.lineTo(cx + W * 0.14, y + 16)
  ctx.stroke()

  // Brand line (bottom).
  ctx.font = '600 26px "Cinzel", serif'
  ctx.globalAlpha = 0.8
  ctx.fillStyle = foil
  drawSpaced(ctx, 'ANVL ATHLETICS', cx, H * 0.9, 10)
  ctx.globalAlpha = 1

  return canvas
}

export function useCoverTexture(cover: BookCover): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    let active = true
    void drawCover(cover).then((canvas) => {
      if (!active) return
      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      tex.needsUpdate = true
      setTexture(tex)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cover.title, cover.dropLabel, cover.logoSrc, cover.colors.foil])

  useEffect(() => () => texture?.dispose(), [texture])

  return texture
}
