/**
 * Reads tools/oath-seed.json (from _emitOathDropJson.ts) and prints SQL for Supabase bootstrap.
 * Usage: node tools/genBootstrapSql.mjs > tools/oath-bootstrap.sql
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raw = fs.readFileSync(path.join(__dirname, 'oath-seed.json'), 'utf8')
const { drop, layout } = JSON.parse(raw.trim())

const dTag = 'anvl_oath_drop'
const lTag = 'anvl_site_layout'
const dropStr = JSON.stringify(drop)
const layoutStr = JSON.stringify(layout)

const sql = `-- ANVL bootstrap: Oath drop + published storefront snapshot (idempotent-ish)
-- One copy of drop JSON via temp row (keeps executor payloads small).
UPDATE public.storefront_publication
SET active_drop_id = NULL,
    published_drop_snapshot = NULL,
    products_snapshot = '[]'::jsonb,
    catalog_drop_index = '[]'::jsonb
WHERE id = 1;

DELETE FROM public.anvl_drops WHERE slug = '${drop.slug}';

CREATE TEMP TABLE _anvl_oath_bootstrap (j jsonb);
INSERT INTO _anvl_oath_bootstrap (j) VALUES ($${dTag}$${dropStr}$${dTag}$::jsonb);

INSERT INTO public.anvl_drops (id, slug, status, draft_body, published_body)
SELECT
  '${drop.id}'::uuid,
  '${drop.slug.replace(/'/g, "''")}',
  'active',
  j,
  j
FROM _anvl_oath_bootstrap;

UPDATE public.storefront_publication
SET
  published_at = now(),
  revision = revision + 1,
  active_drop_id = '${drop.id}'::uuid,
  published_drop_snapshot = (SELECT j FROM _anvl_oath_bootstrap),
  website_layout = $${lTag}$${layoutStr}$${lTag}$::jsonb,
  products_snapshot = '[]'::jsonb,
  catalog_drop_index = '[]'::jsonb,
  global_brand = NULL,
  campaigns = '[]'::jsonb,
  lookbook = '[]'::jsonb,
  published_manifest = jsonb_build_object(
    'slug', '${drop.slug.replace(/'/g, "''")}',
    'dropId', '${drop.id}',
    'revision', revision + 1
  )
WHERE id = 1;
`

const outPath = path.join(__dirname, 'oath-bootstrap.sql')
fs.writeFileSync(outPath, sql, 'utf8')
console.error('Wrote', outPath, 'bytes', Buffer.byteLength(sql, 'utf8'))
