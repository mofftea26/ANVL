/**
 * Shared file-extension / MIME helpers for CMS media uploads. Extracted so the
 * drop-scoped upload path (`cmsRemote/uploadCmsMedia.ts`) and the library
 * upload path (`media/mediaAssets.service.ts`) can't drift out of sync again
 * (MAINT-30) — both previously carried their own copy of `extensionFor`, and
 * only the library path called `resolveUploadMimeType`, which is what let the
 * GLB upload 415 (`application/octet-stream`) bug ship in the drop-scoped path.
 */

export function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName
  if (file.type === 'image/svg+xml') return 'svg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  if (file.type === 'video/mp4') return 'mp4'
  if (file.type === 'video/webm') return 'webm'
  return 'bin'
}

/**
 * Resolve the content-type to upload + store. Browsers report no useful mime
 * for `.glb`/`.gltf` — an empty `file.type` on some, the generic
 * `application/octet-stream` on others (observed on Windows Chrome) — so both
 * count as "unknown" here and fall back to inferring the model mime from the
 * extension; otherwise the bucket's allowed-mime check rejects the upload.
 */
export function resolveUploadMimeType(file: File): string {
  const reported = file.type
  const isGeneric = !reported || reported === 'application/octet-stream'
  if (!isGeneric) return reported
  const name = file.name.toLowerCase()
  if (name.endsWith('.glb')) return 'model/gltf-binary'
  if (name.endsWith('.gltf')) return 'model/gltf+json'
  return reported || 'application/octet-stream'
}

/**
 * Re-wrap the file so its OWN `type` is the resolved mime. Required because
 * supabase-js storage uploads a `File`/`Blob` body as multipart `FormData`
 * and silently ignores the `contentType` option in that branch — the part's
 * content-type comes from the Blob itself. A `.glb` picked on Windows arrives
 * as `''`/`application/octet-stream`, so without this wrap the bucket's
 * allowed-mime check rejects the upload ("invalid MIME type").
 */
export function coerceUploadFile(file: File): { body: File; contentType: string } {
  const contentType = resolveUploadMimeType(file)
  if (file.type === contentType) return { body: file, contentType }
  return {
    body: new File([file], file.name, {
      type: contentType,
      lastModified: file.lastModified,
    }),
    contentType,
  }
}
