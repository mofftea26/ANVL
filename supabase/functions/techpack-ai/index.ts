/**
 * Techpack AI rewrite — turns manufacturer jargon into ANVL's voice, and reads
 * care labels that exist only as artwork.
 *
 * This function exists ONLY because `ANTHROPIC_API_KEY` must never reach the
 * browser bundle; the parsing itself happens client-side. Everything here is
 * optional by construction — the whole import flow works from the
 * deterministically extracted document alone, and a failure here degrades to
 * "a human writes it", never to a broken page.
 *
 * Two invariants the design turns on:
 *
 * 1. **The model never writes the document.** It returns path-keyed
 *    suggestions (`{ path, original, suggestion }`) that land in
 *    `techpacks.ai_document`, beside — never merged into — `techpacks.document`.
 *    An operator accepts them field by field against a diff, so a
 *    hallucination cannot silently replace an extracted fact.
 * 2. **Numbers are never sent for rewriting.** The size table, GSM, Pantone
 *    codes and SPI values are measurements, not prose. They are excluded from
 *    the prompt entirely, which makes "the model changed a measurement"
 *    structurally impossible rather than merely unlikely.
 *
 * Secrets: `ANTHROPIC_API_KEY` via `supabase secrets set`. `SUPABASE_URL` and
 * `SUPABASE_SERVICE_ROLE_KEY` are injected by the runtime.
 * Deploy: `supabase functions deploy techpack-ai`
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Current-generation model; override per environment without a redeploy. */
const DEFAULT_MODEL = 'claude-sonnet-5'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const REQUEST_TIMEOUT_MS = 30_000

/** Vision caps — a techpack page render is large and the model has limits. */
const MAX_IMAGES = 6
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_TOTAL_IMAGE_BYTES = 20 * 1024 * 1024

type Json = Record<string, unknown>

interface RequestBody {
  techpackId?: string
  mode?: 'rewrite' | 'read-image' | 'both'
  document?: Json
  images?: Array<{ refId?: string; signedUrl?: string; hint?: string }>
}

function json(body: Json, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(code: string, error: string, status: number): Response {
  return json({ ok: false, code, error }, status)
}

/* --------------------------------------------------------------------------- *
 * Auth
 * --------------------------------------------------------------------------- */

/**
 * Verify the caller is a CMS editor/admin.
 *
 * The role is read through an ANON client carrying the caller's own JWT, so
 * RLS applies and a caller can only ever see their own `cms_profiles` row.
 * Using the service-role client for this check would bypass exactly the
 * protection being checked.
 */
async function requireCmsRole(req: Request): Promise<{ ok: true } | { ok: false; res: Response }> {
  const authorization = req.headers.get('Authorization')
  if (!authorization) {
    return { ok: false, res: fail('unauthorized', 'Missing Authorization header.', 401) }
  }

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) {
    return { ok: false, res: fail('not_configured', 'Supabase env is not configured.', 500) }
  }

  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })

  const { data: userData, error: userError } = await asCaller.auth.getUser()
  if (userError || !userData?.user) {
    return { ok: false, res: fail('unauthorized', 'Not signed in.', 401) }
  }

  const { data: profile } = await asCaller
    .from('cms_profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  const role = (profile as { role?: string } | null)?.role
  if (role !== 'editor' && role !== 'admin') {
    return { ok: false, res: fail('forbidden', 'CMS editor or admin role required.', 403) }
  }

  return { ok: true }
}

/* --------------------------------------------------------------------------- *
 * Prompt construction
 * --------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `You rewrite garment manufacturing notes into the voice of ANVL Athletics, a premium bodybuilding gymwear brand.

Voice: industrial, precise, disciplined. Plain confident sentences. No hype, no exclamation marks, no marketing cliche ("elevate your game", "game-changing").

Absolute rules:
- Never state a fact that is not present in the input. If a field has nothing to say, return it unchanged.
- Never name a supplier, factory, design house or vendor, even if one appears in the input.
- Never invent or alter a number, measurement, colour code or material percentage.
- Keep each rewrite roughly the length of the original.
- Return JSON only, matching the requested tool schema.`

/** The prose fields worth rewriting — nothing numeric appears here. */
function collectRewritableFields(doc: Json): Array<{ path: string; text: string }> {
  const out: Array<{ path: string; text: string }> = []

  const push = (path: string, value: unknown) => {
    if (typeof value === 'string' && value.trim().length > 2) out.push({ path, text: value })
  }

  const header = doc.header as Json | undefined
  const fabric = header?.fabric as Json | undefined
  push('header.fabric.construction', fabric?.construction)

  const technical = doc.technical as Json | undefined
  const seams = Array.isArray(technical?.seams) ? technical.seams : []
  seams.forEach((seam, i) => push(`technical.seams.${i}.text`, (seam as Json)?.text))

  const blueprint = Array.isArray(doc.blueprint) ? doc.blueprint : []
  blueprint.forEach((page, pageIndex) => {
    const features = Array.isArray((page as Json)?.features) ? ((page as Json).features as Json[]) : []
    features.forEach((feature, i) => {
      push(`blueprint.${pageIndex}.features.${i}.label`, feature?.label)
      push(`blueprint.${pageIndex}.features.${i}.detail`, feature?.detail)
    })
  })

  const trims = Array.isArray(doc.trims) ? doc.trims : []
  trims.forEach((trim, i) => push(`trims.${i}.description`, (trim as Json)?.description))

  const branding = Array.isArray(doc.branding) ? doc.branding : []
  branding.forEach((entry, i) => push(`branding.${i}.description`, (entry as Json)?.description))

  return out
}

const REWRITE_TOOL = {
  name: 'return_rewrites',
  description: 'Return a customer-facing rewrite for each supplied field.',
  input_schema: {
    type: 'object',
    properties: {
      rewrites: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            suggestion: { type: 'string' },
          },
          required: ['path', 'suggestion'],
        },
      },
    },
    required: ['rewrites'],
  },
}

const CARE_TOOL = {
  name: 'return_care_label',
  description: 'Transcribe the care instructions printed on the label artwork.',
  input_schema: {
    type: 'object',
    properties: {
      lines: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    },
    required: ['lines', 'confidence'],
  },
}

/* --------------------------------------------------------------------------- *
 * Anthropic
 * --------------------------------------------------------------------------- */

async function callAnthropic(
  apiKey: string,
  body: Json,
): Promise<{ ok: true; content: unknown[] } | { ok: false; res: Response }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text()
      return {
        ok: false,
        res: fail('upstream', `Model request failed (${response.status}): ${detail.slice(0, 300)}`, 502),
      }
    }

    const payload = (await response.json()) as { content?: unknown[] }
    return { ok: true, content: Array.isArray(payload.content) ? payload.content : [] }
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    return {
      ok: false,
      res: aborted
        ? fail('timeout', 'The model did not respond in time.', 504)
        : fail('upstream', error instanceof Error ? error.message : String(error), 502),
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Pull the first tool-use payload out of a response. */
function toolInput(content: readonly unknown[], name: string): Json | null {
  for (const block of content) {
    const b = block as { type?: string; name?: string; input?: Json }
    if (b?.type === 'tool_use' && b.name === name && b.input) return b.input
  }
  return null
}

/* --------------------------------------------------------------------------- *
 * Images
 * --------------------------------------------------------------------------- */

/**
 * Only ever fetch our own signed storage URLs.
 *
 * A server-side fetch of a caller-supplied URL is textbook SSRF — it would let
 * anyone with an editor account make this function read internal endpoints.
 * Origin AND path prefix are both checked.
 */
function isOwnSignedUrl(raw: string, supabaseUrl: string): boolean {
  try {
    const url = new URL(raw)
    const base = new URL(supabaseUrl)
    if (url.origin !== base.origin) return false
    return url.pathname.startsWith('/storage/v1/object/sign/techpacks/')
  } catch {
    return false
  }
}

async function fetchImageBlocks(
  images: RequestBody['images'],
  supabaseUrl: string,
  warnings: string[],
): Promise<Json[]> {
  const blocks: Json[] = []
  let total = 0

  for (const image of (images ?? []).slice(0, MAX_IMAGES)) {
    const signedUrl = image?.signedUrl
    if (!signedUrl || !isOwnSignedUrl(signedUrl, supabaseUrl)) {
      warnings.push(`Skipped an image with an unexpected URL.`)
      continue
    }

    const response = await fetch(signedUrl)
    if (!response.ok) {
      warnings.push(`Could not read image ${image.refId ?? ''}.`)
      continue
    }

    const buffer = new Uint8Array(await response.arrayBuffer())
    if (buffer.byteLength > MAX_IMAGE_BYTES || total + buffer.byteLength > MAX_TOTAL_IMAGE_BYTES) {
      warnings.push(`Image ${image.refId ?? ''} was too large to send.`)
      continue
    }
    total += buffer.byteLength

    let binary = ''
    for (const byte of buffer) binary += String.fromCharCode(byte)

    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: response.headers.get('content-type') ?? 'image/webp',
        data: btoa(binary),
      },
    })
  }

  return blocks
}

/* --------------------------------------------------------------------------- *
 * Handler
 * --------------------------------------------------------------------------- */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('bad_request', 'Method not allowed', 405)

  const auth = await requireCmsRole(req)
  if (!auth.ok) return auth.res

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return fail('not_configured', 'ANTHROPIC_API_KEY is not set for this function.', 500)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const model = Deno.env.get('ANTHROPIC_MODEL') ?? DEFAULT_MODEL

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return fail('bad_request', 'Body must be JSON.', 400)
  }

  const techpackId = body.techpackId
  if (!techpackId) return fail('bad_request', 'techpackId is required.', 400)

  const mode = body.mode ?? 'both'
  const doc = body.document ?? {}
  const warnings: string[] = []

  const rewrites: Array<{ path: string; original: string; suggestion: string }> = []
  let careLabel: { lines: string[]; confidence: string } | undefined

  /* --- prose rewrite ---------------------------------------------------- */
  if (mode === 'rewrite' || mode === 'both') {
    const fields = collectRewritableFields(doc)
    if (fields.length === 0) {
      warnings.push('No prose fields were available to rewrite.')
    } else {
      const result = await callAnthropic(apiKey, {
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: [REWRITE_TOOL],
        tool_choice: { type: 'tool', name: REWRITE_TOOL.name },
        messages: [
          {
            role: 'user',
            content: `Rewrite each field for a customer reading a product passport.\n\n${JSON.stringify(fields, null, 2)}`,
          },
        ],
      })
      if (!result.ok) return result.res

      const input = toolInput(result.content, REWRITE_TOOL.name)
      const returned = Array.isArray(input?.rewrites) ? (input.rewrites as Json[]) : []
      const originals = new Map(fields.map((f) => [f.path, f.text]))

      for (const entry of returned) {
        const path = typeof entry.path === 'string' ? entry.path : ''
        const suggestion = typeof entry.suggestion === 'string' ? entry.suggestion : ''
        const original = originals.get(path)
        // A path we did not send is a path we will not accept — this is what
        // stops the model widening its own remit.
        if (!path || !suggestion || original === undefined) continue
        rewrites.push({ path, original, suggestion })
      }
    }
  }

  /* --- care-label vision ------------------------------------------------ */
  if (mode === 'read-image' || mode === 'both') {
    const blocks = await fetchImageBlocks(body.images, supabaseUrl, warnings)
    if (blocks.length > 0) {
      const result = await callAnthropic(apiKey, {
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [CARE_TOOL],
        tool_choice: { type: 'tool', name: CARE_TOOL.name },
        messages: [
          {
            role: 'user',
            content: [
              ...blocks,
              {
                type: 'text',
                text: 'Transcribe the garment care instructions printed on this label, one instruction per line, exactly as written. If you cannot read it, return an empty list and low confidence.',
              },
            ],
          },
        ],
      })
      if (!result.ok) return result.res

      const input = toolInput(result.content, CARE_TOOL.name)
      if (input) {
        careLabel = {
          lines: Array.isArray(input.lines) ? (input.lines as string[]).filter(Boolean) : [],
          confidence: typeof input.confidence === 'string' ? input.confidence : 'low',
        }
      }
    }
  }

  const result = { rewrites, careLabel, warnings, model }

  /* --- write back with the SERVICE ROLE --------------------------------- */
  // The browser never has to be trusted with the result: it is stored here and
  // read back through the same RLS-gated table as everything else.
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const { error } = await admin
      .from('techpacks')
      .update({ ai_document: result, ai_status: 'ready', ai_error: '', updated_at: new Date().toISOString() })
      .eq('id', techpackId)
    if (error) warnings.push(`Could not save the suggestions: ${error.message}`)
  }

  return json({ ok: true, result })
})
