import type { SupabaseClient } from '@supabase/supabase-js'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { CMS_MEDIA_BUCKET, publicCmsMediaUrl } from '@/features/cms/media/mediaUrl'
import {
  createUploadFontRecord,
  guessFontFormat,
  guessFontStyle,
  guessFontWeight,
  type FontFamilyRecord,
} from '@/features/cms/config/fontLibrary'

function sanitizeFamilyName(name: string): string {
  const base = name
    .trim()
    .replace(/\.[^.]+$/, '')
    .replace(/[-_](regular|bold|italic|light|medium|semibold).*$/i, '')
    .trim()
  return base || 'Custom font'
}

function formatFontObjectPath(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'ttf'
  const stem = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
  return `fonts/${stem}-${Date.now()}.${ext}`
}

export type FontUploadResult =
  | { ok: true; record: FontFamilyRecord }
  | { ok: false; error: string }

export async function uploadFontFiles(
  files: File[],
  client: SupabaseClient | null = getAdminSupabaseBrowserClient(),
): Promise<FontUploadResult> {
  if (!client) return { ok: false, error: 'Supabase is not configured.' }
  if (!files.length) return { ok: false, error: 'No font files selected.' }

  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session) {
    return { ok: false, error: 'Sign in to upload fonts to Supabase.' }
  }

  const family = sanitizeFamilyName(files[0].name)
  const fileEntries: {
    url: string
    weight: number
    style: 'normal' | 'italic'
    format: string
  }[] = []

  for (const file of files) {
    const objectPath = formatFontObjectPath(file)
    const { error } = await client.storage.from(CMS_MEDIA_BUCKET).upload(objectPath, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type || undefined,
    })
    if (error) return { ok: false, error: error.message }

    const url = publicCmsMediaUrl(objectPath)
    if (!url) return { ok: false, error: 'Could not resolve font URL.' }

    fileEntries.push({
      url,
      weight: guessFontWeight(file.name),
      style: guessFontStyle(file.name),
      format: guessFontFormat(file.name),
    })
  }

  const record = createUploadFontRecord(family, fileEntries)
  return { ok: true, record }
}

export { CMS_MEDIA_BUCKET }
