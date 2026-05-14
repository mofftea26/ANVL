/** Returns a YouTube watch/embed ID when `raw` looks like a YouTube URL, else null. */
export function extractYoutubeVideoId(raw: string | undefined): string | null {
  if (!raw) return null
  const s = raw.trim()
  if (!s) return null
  try {
    const u = s.startsWith('http') ? new URL(s) : new URL(`https://${s}`)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id && /^[\w-]{6,}$/.test(id) ? id : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'www.youtube-nocookie.com') {
      if (u.pathname.startsWith('/embed/')) {
        const id = u.pathname.replace('/embed/', '').split('/')[0]
        return id && /^[\w-]{6,}$/.test(id) ? id : null
      }
      const v = u.searchParams.get('v')
      return v && /^[\w-]{6,}$/.test(v) ? v : null
    }
  } catch {
    return null
  }
  return null
}
