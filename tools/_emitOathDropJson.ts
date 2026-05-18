/**
 * One-off: prints Oath drop JSON for Supabase bootstrap (stdout).
 * Usage: pnpm exec tsx tools/_emitOathDropJson.ts
 */
import { createDefaultTheOathDrop } from '../src/features/admin/drops/drops.defaults'
import { createDefaultWebsiteLayout } from '../src/features/admin/website-layout/websiteLayout.defaults'

const DROP_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const now = '2026-01-01T00:00:00.000Z'

const drop = createDefaultTheOathDrop(undefined, now)
drop.id = DROP_UUID
drop.status = 'active'
drop.isActive = true

const layout = createDefaultWebsiteLayout(now)

console.log(JSON.stringify({ drop, layout, dropUuid: DROP_UUID }, null, 0))
