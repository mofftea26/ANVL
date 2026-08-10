/**
 * One-time backfill: re-encode oversized images already sitting in the
 * `cms-media` bucket.
 *
 * WHY THIS IS SAFE
 * ----------------
 * `cms_media_assets` stores an id -> storage_path. Asset slots, `pdp_content`,
 * `passport_content` and the About orbs all reference the media **id**, never
 * the path. So replacing the path on an existing row re-points every consumer
 * at once, with no schema change, no slot re-linking and no code change.
 *
 * The original object is NEVER deleted. Rollback is restoring `storage_path`
 * from the manifest this script writes. A new object path is used (rather than
 * overwriting in place) because uploads are stored with `cacheControl:
 * 31536000` — overwriting would leave a year of stale CDN copies.
 *
 * ALPHA: encodes to WebP with `alphaQuality: 100` and never to JPEG. The Oath
 * hero samples real pixels and gates on fully-opaque ones
 * (`shared/webgl/particleShapes.ts`); a flattened or frayed alpha channel
 * changes which pixels pass that gate. Same reasoning as
 * `features/admin/media/encodeUploadImage.ts`, which is the going-forward fix —
 * this script only cleans up what predates it.
 *
 * USAGE
 *   node scripts/backfill-cms-image-sizes.mjs --filter about            # dry run
 *   node scripts/backfill-cms-image-sizes.mjs --filter about --apply    # writes
 *   node scripts/backfill-cms-image-sizes.mjs --paths library/a.png     # no DB needed
 *
 * Dry run needs no credentials (the bucket is public for reads).
 * `--apply` needs SUPABASE_SERVICE_ROLE_KEY: updating `cms_media_assets` and
 * writing to the bucket are both RLS-gated to CMS roles, which the anon
 * publishable key does not hold.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const BUCKET = 'cms-media'
const MAX_EDGE = 2048
const WEBP_QUALITY = 82
/** Lossy alpha frays cutout edges the particle silhouette depends on. */
const WEBP_ALPHA_QUALITY = 100
/** Below this a re-encode is not worth the quality cost. */
const MIN_BYTES = 150 * 1024
/** Vector / animated / already-modern formats are passed over untouched. */
const SKIP_MIMES = new Set(['image/svg+xml', 'image/gif', 'image/avif'])

// ---------------------------------------------------------------- args

const argv = process.argv.slice(2)
const has = (flag) => argv.includes(flag)
const valueOf = (flag) => {
  const i = argv.indexOf(flag)
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null
}

const APPLY = has('--apply')
const FILTER = valueOf('--filter')
const EXPLICIT_PATHS = valueOf('--paths')?.split(',').map((s) => s.trim()).filter(Boolean)
const MANIFEST = valueOf('--manifest') ?? 'scripts/.backfill-cms-image-sizes.manifest.json'

// ---------------------------------------------------------------- env

function readEnvFile() {
  try {
    const raw = readFileSync(path.resolve(process.cwd(), '.env'), 'utf8')
    return Object.fromEntries(
      raw
        .split(/\r?\n/)
        .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
        .map((l) => {
          const i = l.indexOf('=')
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
        }),
    )
  } catch {
    return {}
  }
}

const fileEnv = readEnvFile()
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? fileEnv.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL) {
  console.error('VITE_SUPABASE_URL is not set (checked env and .env).')
  process.exit(1)
}
if (APPLY && !SERVICE_KEY) {
  console.error(
    '--apply needs SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Bucket writes and cms_media_assets updates are RLS-gated to CMS roles;\n' +
      'the anon publishable key cannot perform either.\n\n' +
      'Supabase dashboard -> Project Settings -> API -> service_role key, then:\n' +
      '  $env:SUPABASE_SERVICE_ROLE_KEY="..."; node scripts/backfill-cms-image-sizes.mjs --filter about --apply',
  )
  process.exit(1)
}

const publicUrl = (p) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${p.split('/').map(encodeURIComponent).join('/')}`

const kb = (n) => `${(n / 1024).toFixed(0)} KB`
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`

// ---------------------------------------------------------------- work list

async function restQuery(pathAndQuery, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

async function resolveWorkList() {
  if (EXPLICIT_PATHS?.length) {
    return EXPLICIT_PATHS.map((p) => ({ id: null, storage_path: p, filename: p.split('/').pop(), mime: null, byte_size: null }))
  }
  if (!SERVICE_KEY) {
    console.error(
      'No SUPABASE_SERVICE_ROLE_KEY, so cms_media_assets cannot be listed\n' +
        '(the table has no anon policy). Either supply the key, or dry-run\n' +
        'specific objects with --paths library/foo.png,library/bar.png',
    )
    process.exit(1)
  }
  const rows = await restQuery('cms_media_assets?select=id,storage_path,filename,mime,byte_size&order=byte_size.desc')
  return rows.filter((r) => {
    if (!r.mime?.startsWith('image/')) return false
    if (SKIP_MIMES.has(r.mime)) return false
    if (FILTER && !`${r.storage_path} ${r.filename}`.toLowerCase().includes(FILTER.toLowerCase())) return false
    return true
  })
}

// ---------------------------------------------------------------- encode

async function optimise(buf) {
  const meta = await sharp(buf).metadata()
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0)
  const pipeline = sharp(buf, { failOn: 'none' })
  if (longest > MAX_EDGE) {
    pipeline.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
  }
  const out = await pipeline
    .webp({ quality: WEBP_QUALITY, alphaQuality: WEBP_ALPHA_QUALITY, effort: 6 })
    .toBuffer({ resolveWithObject: true })
  return { meta, buffer: out.data, width: out.info.width, height: out.info.height }
}

function webpPath(originalPath) {
  const dir = originalPath.includes('/') ? originalPath.replace(/\/[^/]+$/, '') : ''
  const base = originalPath.split('/').pop() ?? 'asset'
  const stem = base.replace(/\.[^.]+$/, '')
  return `${dir ? `${dir}/` : ''}${stem}-opt-${Date.now()}.webp`
}

// ---------------------------------------------------------------- write

async function uploadObject(objectPath, buffer) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'image/webp',
      'cache-control': '31536000',
    },
    body: buffer,
  })
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${await res.text()}`)
}

async function repointRow(id, patch) {
  await restQuery(`cms_media_assets?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  })
}

// ---------------------------------------------------------------- main

const work = await resolveWorkList()
if (!work.length) {
  console.log('Nothing matched.')
  process.exit(0)
}

console.log(
  `${APPLY ? 'APPLY' : 'DRY RUN'} — ${work.length} asset(s)${FILTER ? ` matching "${FILTER}"` : ''}\n`,
)

let before = 0
let after = 0
let changed = 0
const manifest = []

for (const row of work) {
  const url = publicUrl(row.storage_path)
  let buf
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.log(`  SKIP  ${row.storage_path} — fetch ${res.status}`)
      continue
    }
    buf = Buffer.from(await res.arrayBuffer())
  } catch (err) {
    console.log(`  SKIP  ${row.storage_path} — ${err.message}`)
    continue
  }

  if (buf.length < MIN_BYTES) {
    console.log(`  SKIP  ${row.storage_path} — already ${kb(buf.length)}`)
    continue
  }

  let result
  try {
    result = await optimise(buf)
  } catch (err) {
    console.log(`  SKIP  ${row.storage_path} — decode/encode failed: ${err.message}`)
    continue
  }

  if (result.buffer.length >= buf.length) {
    console.log(`  SKIP  ${row.storage_path} — re-encode is not smaller`)
    continue
  }

  before += buf.length
  after += result.buffer.length
  changed += 1

  const pct = (100 - (result.buffer.length / buf.length) * 100).toFixed(1)
  console.log(
    `  ${APPLY ? 'WRITE' : 'WOULD'} ${row.storage_path}\n` +
      `        ${result.meta.width}x${result.meta.height} ${result.meta.format} ${mb(buf.length)}` +
      `  ->  ${result.width}x${result.height} webp ${kb(result.buffer.length)}  (-${pct}%)`,
  )

  if (!APPLY) continue
  if (!row.id) {
    console.log('        (no DB row — --paths mode encodes only, nothing written)')
    continue
  }

  const nextPath = webpPath(row.storage_path)
  await uploadObject(nextPath, result.buffer)
  manifest.push({
    id: row.id,
    from: { storage_path: row.storage_path, filename: row.filename, mime: row.mime, byte_size: row.byte_size },
    to: { storage_path: nextPath, mime: 'image/webp', byte_size: result.buffer.length },
  })
  await repointRow(row.id, {
    storage_path: nextPath,
    filename: `${(row.filename ?? 'asset').replace(/\.[^.]+$/, '')}.webp`,
    mime: 'image/webp',
    byte_size: result.buffer.length,
    width: result.width,
    height: result.height,
  })
  console.log(`        -> row re-pointed to ${nextPath}`)
}

console.log(
  `\n${changed} asset(s) ${APPLY ? 'rewritten' : 'would change'}: ` +
    `${mb(before)} -> ${mb(after)}  (saves ${mb(before - after)})`,
)

if (APPLY && manifest.length) {
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
  console.log(`\nRollback manifest: ${MANIFEST}`)
  console.log('Originals were NOT deleted — restore by PATCHing storage_path back.')
} else if (!APPLY) {
  console.log('\nRe-run with --apply to write (needs SUPABASE_SERVICE_ROLE_KEY).')
}
