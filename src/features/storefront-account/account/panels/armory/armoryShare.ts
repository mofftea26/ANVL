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

/**
 * HUD templates — used when the backdrop is the user's OWN photo. Content
 * moves out of the middle (the photo is the hero) into heads-up overlays at
 * the edges, carrying the athlete's record: rank, pieces, feats + the most
 * recent one, wears logged, member-since.
 */
export type HudTemplateKey =
  | 'hud-modern'
  | 'hud-minimal'
  | 'hud-premium'
  | 'hud-luxe'
  | 'hud-game'
  | 'hud-jarvis'
export const HUD_TEMPLATES: Array<{ key: HudTemplateKey; label: string }> = [
  { key: 'hud-modern', label: 'Modern' },
  { key: 'hud-minimal', label: 'Minimal' },
  { key: 'hud-premium', label: 'Premium' },
  { key: 'hud-luxe', label: 'Luxe' },
  { key: 'hud-game', label: 'Game' },
  { key: 'hud-jarvis', label: 'Jarvis' },
]

/** The athlete's record shown on HUD overlays. */
export interface ShareHudStats {
  rankTitle: string
  pieceCount: number
  featCount: number
  latestFeat: { title: string; achievedOn: string } | null
  totalWears: number
  /** Earliest registration date (ISO), or null pre-first-claim. */
  memberSince: string | null
}

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
  template: ShareTemplateKey | HudTemplateKey
  subject: ShareSubject
  ownerName: string
  url: string
  /** Data URL of a gallery/camera photo to use as the backdrop. */
  backgroundDataUrl?: string | null
  /** The record shown on HUD overlays (required for hud-* templates). */
  stats?: ShareHudStats
}

export function isHudTemplate(t: ShareTemplateKey | HudTemplateKey): t is HudTemplateKey {
  return t.startsWith('hud-')
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

/* ------------------------------------------------------------- HUD draws */

interface HudCtx {
  W: number
  H: number
  u: number
  champagne: string
  bone: string
  ownerName: string
  url: string
  stats: ShareHudStats
}

function hudStatRows(h: HudCtx): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ['RANK', h.stats.rankTitle.toUpperCase()],
    ['PIECES', String(h.stats.pieceCount)],
    ['FEATS', String(h.stats.featCount)],
    ['WEARS LOGGED', String(h.stats.totalWears)],
  ]
  if (h.stats.memberSince) {
    rows.push([
      'SINCE',
      new Date(h.stats.memberSince)
        .toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
        .toUpperCase(),
    ])
  }
  return rows
}

/** Display form of the share link: just the host — small, never the long
 *  handle path (the real URL travels with the post, not the pixels). */
function displayLink(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] ?? url
  }
}

function hudFooterLink(ctx: CanvasRenderingContext2D, h: HudCtx, align: CanvasTextAlign = 'right') {
  ctx.textAlign = align
  ctx.fillStyle = `${h.champagne}99`
  ctx.font = `600 ${19 * h.u}px Sora, sans-serif`
  const x = align === 'right' ? h.W - 56 * h.u : align === 'left' ? 56 * h.u : h.W / 2
  ctx.fillText(displayLink(h.url), x, h.H - 56 * h.u)
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  template: HudTemplateKey,
  h: HudCtx,
): void {
  const { W, H, u, champagne, bone } = h
  const rows = hudStatRows(h)
  const latest = h.stats.latestFeat

  if (template === 'hud-modern') {
    // Clean editorial blocks: accent bar + name top-left, stat rows bottom-left.
    ctx.textAlign = 'left'
    ctx.fillStyle = champagne
    ctx.fillRect(56 * u, 64 * u, 6 * u, 116 * u)
    ctx.font = `700 ${58 * u}px Anton, Oswald, sans-serif`
    ctx.fillStyle = bone
    ctx.fillText(h.ownerName.toUpperCase().slice(0, 18), 84 * u, 118 * u)
    ctx.font = `400 ${27 * u}px Sora, sans-serif`
    ctx.fillStyle = champagne
    ctx.fillText(h.stats.rankTitle.toUpperCase(), 84 * u, 162 * u)
    ctx.textAlign = 'right'
    ctx.font = `700 ${34 * u}px Anton, Oswald, sans-serif`
    ctx.fillStyle = `${bone}cc`
    ctx.fillText('ANVL', W - 56 * u, 108 * u)

    ctx.textAlign = 'left'
    let y = H - 320 * u
    if (latest) {
      ctx.font = `400 ${22 * u}px Sora, sans-serif`
      ctx.fillStyle = `${champagne}cc`
      ctx.fillText('LATEST FEAT', 56 * u, y)
      ctx.font = `700 ${40 * u}px Anton, Oswald, sans-serif`
      ctx.fillStyle = bone
      ctx.fillText(latest.title.toUpperCase().slice(0, 30), 56 * u, y + 46 * u)
      y += 96 * u
    }
    for (const [label, value] of rows.slice(1)) {
      ctx.font = `400 ${22 * u}px Sora, sans-serif`
      ctx.fillStyle = `${bone}88`
      ctx.fillText(label, 56 * u, y)
      ctx.font = `600 ${26 * u}px Sora, sans-serif`
      ctx.fillStyle = bone
      ctx.textAlign = 'right'
      ctx.fillText(value, 400 * u, y)
      ctx.textAlign = 'left'
      ctx.strokeStyle = `${bone}22`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(56 * u, y + 14 * u)
      ctx.lineTo(400 * u, y + 14 * u)
      ctx.stroke()
      y += 46 * u
    }
    hudFooterLink(ctx, h)
    return
  }

  if (template === 'hud-minimal') {
    // Almost nothing: name/rank top-left, one stat line at the bottom.
    ctx.textAlign = 'left'
    ctx.font = `600 ${30 * u}px Sora, sans-serif`
    ctx.fillStyle = bone
    ctx.fillText(h.ownerName.slice(0, 22), 56 * u, 100 * u)
    ctx.font = `400 ${23 * u}px Sora, sans-serif`
    ctx.fillStyle = champagne
    ctx.fillText(h.stats.rankTitle, 56 * u, 138 * u)
    ctx.textAlign = 'center'
    ctx.font = `400 ${23 * u}px Sora, sans-serif`
    ctx.fillStyle = `${bone}cc`
    ctx.fillText(
      rows
        .slice(1)
        .map(([label, value]) => `${value} ${label}`)
        .join('   ·   '),
      W / 2,
      H - 118 * u,
    )
    hudFooterLink(ctx, h, 'center')
    return
  }

  if (template === 'hud-premium') {
    // Heraldic: Cinzel name centred top, hairline frame, stats bottom-left.
    ctx.strokeStyle = `${champagne}66`
    ctx.lineWidth = 2
    ctx.strokeRect(44 * u, 44 * u, W - 88 * u, H - 88 * u)
    ctx.textAlign = 'center'
    ctx.font = `600 ${30 * u}px Cinzel, serif`
    ctx.fillStyle = champagne
    ctx.fillText('ANVL ATHLETICS', W / 2, 116 * u)
    ctx.font = `700 ${52 * u}px Cinzel, serif`
    ctx.fillStyle = bone
    ctx.fillText(h.ownerName.toUpperCase().slice(0, 18), W / 2, 176 * u)
    ctx.font = `500 ${26 * u}px Cinzel, serif`
    ctx.fillStyle = champagne
    ctx.fillText(h.stats.rankTitle.toUpperCase(), W / 2, 218 * u)

    ctx.textAlign = 'left'
    let y = H - 260 * u
    if (latest) {
      ctx.font = `500 ${24 * u}px Cinzel, serif`
      ctx.fillStyle = champagne
      ctx.fillText(latest.title.toUpperCase().slice(0, 26), 84 * u, y)
      y += 46 * u
    }
    ctx.font = `400 ${23 * u}px Sora, sans-serif`
    ctx.fillStyle = `${bone}cc`
    ctx.fillText(
      rows
        .slice(1)
        .map(([label, value]) => `${value} ${label}`)
        .join('  ·  '),
      84 * u,
      y,
    )
    hudFooterLink(ctx, h, 'center')
    return
  }

  if (template === 'hud-luxe') {
    // Double gold frame, monogram, a stats strip riding the lower frame.
    ctx.strokeStyle = champagne
    ctx.lineWidth = 3
    ctx.strokeRect(38 * u, 38 * u, W - 76 * u, H - 76 * u)
    ctx.strokeStyle = `${champagne}55`
    ctx.lineWidth = 1
    ctx.strokeRect(54 * u, 54 * u, W - 108 * u, H - 108 * u)
    ctx.textAlign = 'center'
    ctx.font = `700 ${64 * u}px Anton, Oswald, sans-serif`
    ctx.fillStyle = champagne
    ctx.fillText('A N V L', W / 2, 136 * u)
    ctx.font = `700 ${44 * u}px Anton, Oswald, sans-serif`
    ctx.fillStyle = bone
    ctx.fillText(h.ownerName.toUpperCase().slice(0, 18), W / 2, 196 * u)
    ctx.font = `400 ${25 * u}px Sora, sans-serif`
    ctx.fillStyle = `${champagne}dd`
    ctx.fillText(h.stats.rankTitle.toUpperCase(), W / 2, 234 * u)

    const strip = rows.slice(1)
    const stripY = H - 128 * u
    const cell = (W - 160 * u) / strip.length
    strip.forEach(([label, value], i) => {
      const cx = 80 * u + cell * i + cell / 2
      ctx.font = `700 ${40 * u}px Anton, Oswald, sans-serif`
      ctx.fillStyle = bone
      ctx.fillText(value, cx, stripY)
      ctx.font = `400 ${17 * u}px Sora, sans-serif`
      ctx.fillStyle = `${champagne}cc`
      ctx.fillText(label, cx, stripY + 30 * u)
      if (i > 0) {
        ctx.strokeStyle = `${champagne}44`
        ctx.beginPath()
        ctx.moveTo(80 * u + cell * i, stripY - 34 * u)
        ctx.lineTo(80 * u + cell * i, stripY + 34 * u)
        ctx.stroke()
      }
    })
    hudFooterLink(ctx, h, 'center')
    return
  }

  if (template === 'hud-game') {
    // Videogame HUD: corner brackets, level plate, XP-style bars.
    const bracket = (x: number, y: number, dx: number, dy: number) => {
      ctx.strokeStyle = champagne
      ctx.lineWidth = 4 * u
      ctx.beginPath()
      ctx.moveTo(x + dx * 54 * u, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, y + dy * 54 * u)
      ctx.stroke()
    }
    bracket(44 * u, 44 * u, 1, 1)
    bracket(W - 44 * u, 44 * u, -1, 1)
    bracket(44 * u, H - 44 * u, 1, -1)
    bracket(W - 44 * u, H - 44 * u, -1, -1)

    // Level plate (pieces forged = the level).
    ctx.textAlign = 'left'
    ctx.fillStyle = `${champagne}22`
    ctx.fillRect(64 * u, 72 * u, 300 * u, 96 * u)
    ctx.strokeStyle = champagne
    ctx.lineWidth = 2
    ctx.strokeRect(64 * u, 72 * u, 300 * u, 96 * u)
    ctx.font = `700 ${52 * u}px Anton, Oswald, sans-serif`
    ctx.fillStyle = bone
    ctx.fillText(`LV ${h.stats.pieceCount}`, 84 * u, 138 * u)
    ctx.font = `400 ${20 * u}px Sora, sans-serif`
    ctx.fillStyle = champagne
    ctx.fillText(h.stats.rankTitle.toUpperCase(), 200 * u, 118 * u)
    ctx.fillText(h.ownerName.toUpperCase().slice(0, 14), 200 * u, 146 * u)

    // Stat bars bottom-left (fill scaled against friendly caps).
    const bars: Array<[string, number, number]> = [
      ['FEATS', h.stats.featCount, 10],
      ['WEARS', h.stats.totalWears, 50],
    ]
    let y = H - 250 * u
    for (const [label, value, cap] of bars) {
      ctx.font = `600 ${21 * u}px Sora, sans-serif`
      ctx.fillStyle = bone
      ctx.fillText(`${label}  ${value}`, 64 * u, y)
      ctx.fillStyle = `${bone}22`
      ctx.fillRect(64 * u, y + 12 * u, 380 * u, 14 * u)
      ctx.fillStyle = champagne
      ctx.fillRect(64 * u, y + 12 * u, 380 * u * Math.min(1, value / cap), 14 * u)
      y += 66 * u
    }
    if (latest) {
      ctx.font = `600 ${23 * u}px Sora, sans-serif`
      ctx.fillStyle = champagne
      ctx.fillText(`★ ${latest.title.toUpperCase().slice(0, 28)}`, 64 * u, y + 10 * u)
    }
    hudFooterLink(ctx, h)
    return
  }

  // hud-jarvis — reticle arcs + a mono data column, assistant-readout style.
  ctx.textAlign = 'left'
  const cx = W * 0.72
  const cy = H * 0.42
  for (const [radius, start, len, alpha] of [
    [150, -0.4, 1.6, 'aa'],
    [178, 1.2, 2.2, '66'],
    [206, -1.8, 1.1, '44'],
  ] as const) {
    ctx.strokeStyle = `${champagne}${alpha}`
    ctx.lineWidth = 2.5 * u
    ctx.beginPath()
    ctx.arc(cx, cy, radius * u, start, start + len)
    ctx.stroke()
  }
  ctx.strokeStyle = `${champagne}88`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx - 16 * u, cy)
  ctx.lineTo(cx + 16 * u, cy)
  ctx.moveTo(cx, cy - 16 * u)
  ctx.lineTo(cx, cy + 16 * u)
  ctx.stroke()

  const mono = `500 ${23 * u}px Consolas, 'SF Mono', monospace`
  ctx.font = mono
  ctx.fillStyle = champagne
  ctx.fillText(`> ATHLETE: ${h.ownerName.toUpperCase().slice(0, 16)}`, 56 * u, 96 * u)
  let y = 140 * u
  for (const [label, value] of rows) {
    ctx.fillStyle = `${bone}cc`
    ctx.fillText(`> ${label}: ${value}`, 56 * u, y)
    y += 40 * u
  }
  if (latest) {
    ctx.fillStyle = champagne
    ctx.fillText(`> LAST FEAT: ${latest.title.toUpperCase().slice(0, 20)}`, 56 * u, y)
  }
  ctx.fillStyle = `${bone}55`
  ctx.fillText('> STATUS: FORGED', 56 * u, y + 40 * u)
  hudFooterLink(ctx, h, 'left')
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

  /* HUD mode: the photo is the hero; the record overlays the edges. -------- */
  if (input.backgroundDataUrl && isHudTemplate(input.template) && input.stats) {
    const bg = await loadImage(input.backgroundDataUrl).catch(() => null)
    if (bg) drawCover(ctx, bg, W, H)
    else {
      ctx.fillStyle = black
      ctx.fillRect(0, 0, W, H)
    }
    // Edge legibility gradients — the middle stays clear for the photo.
    const top = ctx.createLinearGradient(0, 0, 0, H * 0.32)
    top.addColorStop(0, 'rgba(5,5,6,0.72)')
    top.addColorStop(1, 'rgba(5,5,6,0)')
    ctx.fillStyle = top
    ctx.fillRect(0, 0, W, H * 0.32)
    const bottom = ctx.createLinearGradient(0, H * 0.55, 0, H)
    bottom.addColorStop(0, 'rgba(5,5,6,0)')
    bottom.addColorStop(1, 'rgba(5,5,6,0.82)')
    ctx.fillStyle = bottom
    ctx.fillRect(0, H * 0.55, W, H * 0.45)

    drawHud(ctx, input.template, {
      W,
      H,
      u,
      champagne,
      bone,
      ownerName: input.ownerName,
      url: input.url,
      stats: input.stats,
    })

    const dataUrl = canvas.toDataURL('image/png')
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    )
    return { blob, dataUrl }
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

  /* Footer link — the host only, quiet (the real URL travels with the post). */
  ctx.fillStyle = `${champagne}99`
  ctx.font = `600 ${20 * u}px Sora, sans-serif`
  ctx.fillText(displayLink(input.url), W / 2, H - 80 * u)

  const dataUrl = canvas.toDataURL('image/png')
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  )
  return { blob, dataUrl }
}
