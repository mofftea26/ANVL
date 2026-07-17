/**
 * Sharing engine for the Armory — web share-intent links, and a client-side
 * canvas renderer that produces branded share images in three formats (story /
 * post / square), three templates, over the brand backdrop or a photo the
 * user picks from gallery/camera. Subjects: the whole armory, one piece, or
 * one feat.
 */

export interface ShareTarget {
  key: 'whatsapp' | 'facebook' | 'x' | 'telegram' | 'instagram' | 'tiktok' | 'discord'
  label: string
  /** Web intent URL, or null for apps with no web share (native sheet/copy). */
  href: (url: string, text: string) => string | null
  /** Brand tint for the button icon. */
  tint: string
}

export const SHARE_TARGETS: ShareTarget[] = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    tint: '#25D366',
    href: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    tint: '#1877F2',
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: 'x',
    label: 'X',
    tint: '#E7E4DF',
    href: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    key: 'telegram',
    label: 'Telegram',
    tint: '#26A5E4',
    href: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  // No web post intents — the buttons fall back to native share / copy + the
  // generated image flow.
  { key: 'instagram', label: 'Instagram', tint: '#E4405F', href: () => null },
  { key: 'tiktok', label: 'TikTok', tint: '#E7E4DF', href: () => null },
  { key: 'discord', label: 'Discord', tint: '#5865F2', href: () => null },
]

/* ------------------------------------------------------------ image engine */

export type ShareFormatKey = 'story' | 'post' | 'square'
export const SHARE_FORMATS: Array<{ key: ShareFormatKey; label: string; w: number; h: number }> = [
  { key: 'story', label: 'Story', w: 1080, h: 1920 },
  { key: 'post', label: 'Post', w: 1080, h: 1350 },
  { key: 'square', label: 'Message', w: 1080, h: 1080 },
]

export type ShareTemplateKey = 'forge' | 'champagne' | 'stealth'
export const SHARE_TEMPLATES: Array<{ key: ShareTemplateKey; label: string }> = [
  { key: 'forge', label: 'Forge' },
  { key: 'champagne', label: 'Champagne' },
  { key: 'stealth', label: 'Stealth' },
]

/** What the image is about. */
export type ShareSubject =
  | {
      kind: 'armory'
      rankTitle: string
      rankEmblemSrc: string
      pieceCount: number
      featCount: number
    }
  | { kind: 'piece'; pieceName: string; imageSrc?: string; wearCount: number }
  | { kind: 'feat'; featTitle: string; achievedOn: string; pieceName?: string }

export interface ShareImageInput {
  format: ShareFormatKey
  template: ShareTemplateKey
  subject: ShareSubject
  ownerName: string
  url: string
  /** Data URL of a gallery/camera photo to use as the backdrop. */
  backgroundDataUrl?: string | null
}

function cssColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Needed so catalog (Shopify/Supabase CDN) images don't taint the canvas.
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Cover-fit draw (like CSS object-fit: cover). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
): void {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

/** Contain-fit draw centred at (cx, cy) within a max box. */
function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  maxW: number,
  maxH: number,
): void {
  const scale = Math.min(maxW / img.width, maxH / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines - 1) break
    } else {
      line = candidate
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  return lines
}

/** Render a branded share image. Returns a PNG blob + data URL. */
export async function generateShareImage(
  input: ShareImageInput,
): Promise<{ blob: Blob | null; dataUrl: string }> {
  const fmt = SHARE_FORMATS.find((f) => f.key === input.format) ?? SHARE_FORMATS[0]!
  const W = fmt.w
  const H = fmt.h
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return { blob: null, dataUrl: '' }

  const black = cssColor('--anvl-black', '#0B0B0C')
  const steel = cssColor('--anvl-dark-steel-grey', '#1D1F21')
  const champagne = cssColor('--color-highlight-bright', '#C5A56A')
  const bone = cssColor('--anvl-bone', '#E7E4DF')
  // Everything scales off the story height so the three formats stay coherent.
  const u = H / 1920

  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
  } catch {
    /* fonts API unavailable — system fallbacks are acceptable */
  }

  /* Backdrop -------------------------------------------------------------- */
  if (input.backgroundDataUrl) {
    const bg = await loadImage(input.backgroundDataUrl).catch(() => null)
    if (bg) {
      drawCover(ctx, bg, W, H)
      // Scrim so text stays legible over any photo.
      ctx.fillStyle = 'rgba(6,6,7,0.58)'
      ctx.fillRect(0, 0, W, H)
    }
  } else if (input.template === 'stealth') {
    ctx.fillStyle = black
    ctx.fillRect(0, 0, W, H)
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, input.template === 'champagne' ? '#2A2118' : steel)
    grad.addColorStop(0.55, black)
    grad.addColorStop(1, black)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  }
  if (input.template !== 'stealth') {
    const glowStrength = input.template === 'champagne' ? '33' : '22'
    const glow = ctx.createRadialGradient(W / 2, H * 0.4, 40 * u, W / 2, H * 0.4, 640 * u)
    glow.addColorStop(0, `${champagne}${glowStrength}`)
    glow.addColorStop(1, '#00000000')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
  } else {
    // Stealth: a thin bone frame instead of a glow.
    ctx.strokeStyle = `${bone}55`
    ctx.lineWidth = 2
    ctx.strokeRect(44, 44, W - 88, H - 88)
  }

  /* Header ---------------------------------------------------------------- */
  ctx.textAlign = 'center'
  ctx.fillStyle = champagne
  ctx.font = `700 ${56 * u}px Anton, Oswald, sans-serif`
  ctx.fillText('A N V L', W / 2, 170 * u)
  ctx.fillStyle = `${bone}99`
  ctx.font = `400 ${27 * u}px Sora, sans-serif`
  ctx.fillText('FORGED UNDER PRESSURE', W / 2, 216 * u)

  /* Subject --------------------------------------------------------------- */
  const midY = H * 0.46
  const s = input.subject
  if (s.kind === 'armory') {
    const emblem = await loadImage(s.rankEmblemSrc).catch(() => null)
    if (emblem) drawContain(ctx, emblem, W / 2, midY - 210 * u, 430 * u, 430 * u)
    ctx.fillStyle = `${bone}cc`
    ctx.font = `400 ${32 * u}px Sora, sans-serif`
    ctx.fillText('THE ARMORY OF', W / 2, midY + 90 * u)
    ctx.fillStyle = bone
    ctx.font = `700 ${80 * u}px Anton, Oswald, sans-serif`
    ctx.fillText(input.ownerName.toUpperCase().slice(0, 20), W / 2, midY + 180 * u)
    ctx.fillStyle = champagne
    ctx.font = `700 ${48 * u}px Anton, Oswald, sans-serif`
    ctx.fillText(s.rankTitle.toUpperCase(), W / 2, midY + 258 * u)
    ctx.fillStyle = `${bone}bb`
    ctx.font = `400 ${30 * u}px Sora, sans-serif`
    ctx.fillText(
      `${s.pieceCount} ${s.pieceCount === 1 ? 'PIECE' : 'PIECES'} FORGED · ${s.featCount} ${
        s.featCount === 1 ? 'FEAT' : 'FEATS'
      }`,
      W / 2,
      midY + 320 * u,
    )
  } else if (s.kind === 'piece') {
    const img = s.imageSrc ? await loadImage(s.imageSrc).catch(() => null) : null
    if (img) drawContain(ctx, img, W / 2, midY - 120 * u, W * 0.62, H * 0.36)
    ctx.fillStyle = bone
    ctx.font = `700 ${72 * u}px Anton, Oswald, sans-serif`
    ctx.fillText(s.pieceName.toUpperCase().slice(0, 26), W / 2, midY + 200 * u)
    ctx.fillStyle = champagne
    ctx.font = `700 ${40 * u}px Anton, Oswald, sans-serif`
    ctx.fillText(`FORGED BY ${input.ownerName.toUpperCase().slice(0, 18)}`, W / 2, midY + 268 * u)
    if (s.wearCount > 0) {
      ctx.fillStyle = `${bone}bb`
      ctx.font = `400 ${30 * u}px Sora, sans-serif`
      ctx.fillText(
        `WORN ${s.wearCount} ${s.wearCount === 1 ? 'TIME' : 'TIMES'}`,
        W / 2,
        midY + 326 * u,
      )
    }
  } else {
    // Feat — the record itself is the hero.
    ctx.fillStyle = champagne
    ctx.font = `400 ${34 * u}px Sora, sans-serif`
    ctx.fillText('FEAT OF STRENGTH', W / 2, midY - 220 * u)
    ctx.fillStyle = bone
    ctx.font = `700 ${86 * u}px Anton, Oswald, sans-serif`
    const lines = wrapText(ctx, s.featTitle.toUpperCase(), W * 0.82, 3)
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, midY - 100 * u + i * 104 * u)
    })
    const afterTitle = midY - 100 * u + lines.length * 104 * u
    ctx.fillStyle = champagne
    ctx.font = `700 ${40 * u}px Anton, Oswald, sans-serif`
    ctx.fillText(input.ownerName.toUpperCase().slice(0, 20), W / 2, afterTitle + 40 * u)
    ctx.fillStyle = `${bone}bb`
    ctx.font = `400 ${29 * u}px Sora, sans-serif`
    const meta = [
      s.pieceName ? `WEARING ${s.pieceName.toUpperCase()}` : null,
      new Date(s.achievedOn).toLocaleDateString(),
    ]
      .filter(Boolean)
      .join(' · ')
    ctx.fillText(meta, W / 2, afterTitle + 96 * u)
  }

  /* Footer link ------------------------------------------------------------ */
  ctx.fillStyle = `${champagne}dd`
  ctx.font = `600 ${28 * u}px Sora, sans-serif`
  ctx.fillText(input.url.replace(/^https?:\/\//, ''), W / 2, H - 88 * u)

  const dataUrl = canvas.toDataURL('image/png')
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  )
  return { blob, dataUrl }
}
