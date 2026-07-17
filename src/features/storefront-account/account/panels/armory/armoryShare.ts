/**
 * Sharing helpers for the public Armory — web share-intent links for the apps
 * that support them, and a client-side Instagram-story image generator.
 */

export interface ShareTarget {
  key: string
  label: string
  /** Web intent URL, or null for apps with no web share (use native/copy). */
  href: (url: string, text: string) => string | null
  /** Brand tint for the button. */
  tint: string
}

/**
 * Apps with real web share intents get a prefilled link. Instagram / TikTok /
 * Discord have no web post intent, so they lean on the native share sheet
 * (mobile) or the copy-link + story-image flow instead.
 */
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
    tint: '#e7e4df',
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
  {
    key: 'reddit',
    label: 'Reddit',
    tint: '#FF4500',
    href: (url, text) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
]

/** Apps without a web share intent — surfaced with copy-link guidance. */
export const NATIVE_ONLY_APPS = ['Instagram', 'TikTok', 'Discord'] as const

/** Read a brand CSS var from the document (falls back for canvas use). */
function cssColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

/**
 * Render a 1080×1920 Instagram-story image for the armory — premium dark
 * template with the rank emblem, name, piece count and link. Returns a PNG
 * blob (for native file share) plus a data URL (for download).
 */
export async function generateArmoryStoryImage(input: {
  ownerName: string
  rankTitle: string
  rankEmblemSrc: string
  pieceCount: number
  url: string
}): Promise<{ blob: Blob | null; dataUrl: string }> {
  const W = 1080
  const H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return { blob: null, dataUrl: '' }

  const black = cssColor('--anvl-black', '#0B0B0C')
  const steel = cssColor('--anvl-dark-steel-grey', '#1D1F21')
  const champagne = cssColor('--color-highlight-bright', '#C5A56A')
  const bone = cssColor('--anvl-bone', '#E7E4DF')

  // Make sure the brand fonts are ready so headings render in Anton.
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
  } catch {
    /* fonts API unavailable — fall back to system fonts */
  }

  // Background gradient + vignette.
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, steel)
  grad.addColorStop(0.5, black)
  grad.addColorStop(1, black)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, 620)
  glow.addColorStop(0, `${champagne}22`)
  glow.addColorStop(1, '#00000000')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'

  // Wordmark.
  ctx.fillStyle = champagne
  ctx.font = '700 60px Anton, Oswald, sans-serif'
  ctx.letterSpacing = '18px'
  ctx.fillText('A N V L', W / 2, 200)
  ctx.letterSpacing = '0px'
  ctx.fillStyle = `${bone}99`
  ctx.font = '400 30px Sora, sans-serif'
  ctx.fillText('FORGED UNDER PRESSURE', W / 2, 250)

  // Rank emblem.
  const emblem = await loadImage(input.rankEmblemSrc).catch(() => null)
  if (emblem) {
    const size = 460
    ctx.drawImage(emblem, (W - size) / 2, 470, size, size)
  }

  // Owner + rank.
  ctx.fillStyle = `${bone}cc`
  ctx.font = '400 34px Sora, sans-serif'
  ctx.fillText('THE ARMORY OF', W / 2, 1080)
  ctx.fillStyle = bone
  ctx.font = '700 84px Anton, Oswald, sans-serif'
  ctx.fillText(input.ownerName.toUpperCase().slice(0, 20), W / 2, 1180)
  ctx.fillStyle = champagne
  ctx.font = '700 52px Anton, Oswald, sans-serif'
  ctx.fillText(input.rankTitle.toUpperCase(), W / 2, 1270)

  // Piece count.
  ctx.fillStyle = bone
  ctx.font = '700 160px Anton, Oswald, sans-serif'
  ctx.fillText(String(input.pieceCount), W / 2, 1560)
  ctx.fillStyle = `${bone}99`
  ctx.font = '400 34px Sora, sans-serif'
  ctx.letterSpacing = '6px'
  ctx.fillText(input.pieceCount === 1 ? 'PIECE FORGED' : 'PIECES FORGED', W / 2, 1620)
  ctx.letterSpacing = '0px'

  // Link footer.
  ctx.fillStyle = `${champagne}dd`
  ctx.font = '600 30px Sora, sans-serif'
  ctx.fillText(input.url.replace(/^https?:\/\//, ''), W / 2, 1810)

  const dataUrl = canvas.toDataURL('image/png')
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  )
  return { blob, dataUrl }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
