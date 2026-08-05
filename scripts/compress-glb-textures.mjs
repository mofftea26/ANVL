#!/usr/bin/env node
/**
 * Re-encode the embedded textures inside a .glb in place.
 *
 * WHY: `public/about/anvil.glb` (5.97 MB) and `hammer.glb` (4.77 MB) are 88% and
 * 85% embedded texture bytes — two 2048x2048 maps each — against trivial
 * geometry (~18k verts). Both are on the About page, and the anvil is also on
 * the Coming Soon page, so they are among the heaviest things a visitor can
 * download. `extensionsUsed` is empty: no Draco, no meshopt, no KTX2.
 *
 * WHAT IT DOES NOT DO: no Draco, no KTX2/Basis, no glTF extensions at all. Those
 * need a decoder at runtime and would change how the models load. This only
 * downsizes and re-encodes the image bytes, so the result is a plain glTF that
 * every loader already handles — three.js needs no configuration change.
 *
 * Safe here because both textures in both files are `channels: 3, hasAlpha:
 * false`, so moving the PNG normal maps to JPEG loses nothing. Normal maps get a
 * higher quality than base colour: compression artifacts in a normal map show up
 * as shading noise rather than slightly soft pixels.
 *
 * Usage:  node scripts/compress-glb-textures.mjs <file.glb> [...]
 *         node scripts/compress-glb-textures.mjs --check <file.glb>   (report only)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const MAX_TEXTURE_PX = 1024
const QUALITY_BASE_COLOR = 82
/** Normal maps encode geometry, so artifacts read as shading noise. */
const QUALITY_NORMAL = 92

const GLB_MAGIC = 0x46546c67
const CHUNK_JSON = 0x4e4f534a
const CHUNK_BIN = 0x004e4942

function parseGlb(buf) {
  if (buf.readUInt32LE(0) !== GLB_MAGIC) throw new Error('not a GLB')
  let offset = 12
  let json = null
  let bin = null
  while (offset < buf.length) {
    const len = buf.readUInt32LE(offset)
    const type = buf.readUInt32LE(offset + 4)
    const data = buf.subarray(offset + 8, offset + 8 + len)
    if (type === CHUNK_JSON) json = JSON.parse(data.toString('utf8'))
    else if (type === CHUNK_BIN) bin = data
    offset += 8 + len + ((4 - (len % 4)) % 4)
  }
  if (!json || !bin) throw new Error('GLB missing a JSON or BIN chunk')
  return { json, bin }
}

/** Which material slot each image feeds — decides the quality it gets. */
function imageSlots(json) {
  const slots = new Map()
  const mark = (tex, slot) => {
    if (!tex) return
    const source = json.textures?.[tex.index]?.source
    if (source != null) slots.set(source, slot)
  }
  for (const m of json.materials ?? []) {
    mark(m.normalTexture, 'normal')
    mark(m.pbrMetallicRoughness?.baseColorTexture, 'baseColor')
    mark(m.pbrMetallicRoughness?.metallicRoughnessTexture, 'metallicRoughness')
    mark(m.occlusionTexture, 'occlusion')
    mark(m.emissiveTexture, 'emissive')
  }
  return slots
}

function pad4(n) {
  return (4 - (n % 4)) % 4
}

async function compress(file, checkOnly) {
  const original = readFileSync(file)
  const { json, bin } = parseGlb(original)
  const slots = imageSlots(json)

  // Re-encode every image first; bufferViews are rebuilt afterwards so offsets
  // stay consistent no matter how much each one shrinks.
  const replacement = new Map()
  for (let i = 0; i < (json.images ?? []).length; i += 1) {
    const image = json.images[i]
    if (image.bufferView == null) continue
    const view = json.bufferViews[image.bufferView]
    const start = view.byteOffset ?? 0
    const source = bin.subarray(start, start + view.byteLength)
    const slot = slots.get(i) ?? 'baseColor'
    const quality = slot === 'normal' ? QUALITY_NORMAL : QUALITY_BASE_COLOR

    const meta = await sharp(source).metadata()
    if (meta.hasAlpha) {
      // Would silently flatten transparency to black. Bail rather than guess.
      throw new Error(`${file}: image ${i} (${slot}) has an alpha channel — JPEG would drop it`)
    }
    const encoded = await sharp(source)
      .resize(MAX_TEXTURE_PX, MAX_TEXTURE_PX, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()

    console.log(
      `  img${i} ${slot.padEnd(18)} ${meta.width}x${meta.height} ${String(image.mimeType).padEnd(10)}` +
        ` ${(view.byteLength / 1024).toFixed(0).padStart(5)} KB -> ` +
        `${MAX_TEXTURE_PX}px image/jpeg q${quality} ${(encoded.length / 1024).toFixed(0).padStart(5)} KB`,
    )
    replacement.set(image.bufferView, encoded)
    if (!checkOnly) image.mimeType = 'image/jpeg'
  }

  if (checkOnly) return

  // Rebuild the BIN chunk in bufferView order, recomputing every offset.
  const order = json.bufferViews
    .map((view, index) => ({ view, index }))
    .sort((a, b) => (a.view.byteOffset ?? 0) - (b.view.byteOffset ?? 0))

  const parts = []
  let cursor = 0
  for (const { view, index } of order) {
    const data =
      replacement.get(index) ??
      bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
    // glTF requires accessor-backed views to stay 4-byte aligned.
    const padding = pad4(cursor)
    if (padding) {
      parts.push(Buffer.alloc(padding))
      cursor += padding
    }
    view.byteOffset = cursor
    view.byteLength = data.length
    parts.push(data)
    cursor += data.length
  }

  let newBin = Buffer.concat(parts)
  if (pad4(newBin.length)) newBin = Buffer.concat([newBin, Buffer.alloc(pad4(newBin.length))])
  json.buffers[0].byteLength = newBin.length

  let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8')
  if (pad4(jsonBuf.length)) {
    jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(pad4(jsonBuf.length), 0x20)]) // spaces
  }

  const header = Buffer.alloc(12)
  header.writeUInt32LE(GLB_MAGIC, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + newBin.length, 8)

  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(jsonBuf.length, 0)
  jsonHeader.writeUInt32LE(CHUNK_JSON, 4)

  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(newBin.length, 0)
  binHeader.writeUInt32LE(CHUNK_BIN, 4)

  const out = Buffer.concat([header, jsonHeader, jsonBuf, binHeader, newBin])
  writeFileSync(file, out)
  console.log(
    `  ${file}: ${(original.length / 1048576).toFixed(2)} MB -> ${(out.length / 1048576).toFixed(2)} MB` +
      ` (${(100 - (out.length / original.length) * 100).toFixed(0)}% smaller)`,
  )
}

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const files = args.filter((a) => a !== '--check')
if (files.length === 0) {
  console.error('usage: node scripts/compress-glb-textures.mjs [--check] <file.glb> [...]')
  process.exit(1)
}
for (const file of files) {
  console.log(`\n${file}`)
  await compress(file, checkOnly)
}
