import type { BookColors } from '@/features/story/schemas/story.schema'

/**
 * 20 ready-made book-cover colour presets for the Story editor. Each is a full
 * {@link BookColors} set (cloth cover / foil stamp / gilded page edge / open-page
 * heading + body ink). The 3D cover texture (`coverTexture.ts`) is fully
 * parameterized by these, so a preset re-skins the book with no render changes.
 * Authors can still hand-tweak any field after picking a preset.
 */
export interface BookCoverPreset {
  id: string
  name: string
  colors: BookColors
}

export const BOOK_COVER_PRESETS: BookCoverPreset[] = [
  { id: 'forged', name: 'Forged (house)', colors: { cover: '#26211d', foil: '#c8a45a', pageEdge: '#efe4c6', heading: '#221b10', text: '#4c4030' } },
  { id: 'crimson-steel', name: 'Crimson Steel', colors: { cover: '#3a1416', foil: '#d9a441', pageEdge: '#f0e2c4', heading: '#2a0e10', text: '#5a3a36' } },
  { id: 'midnight-edge', name: 'Midnight Edge', colors: { cover: '#16181d', foil: '#c8ccd6', pageEdge: '#e6e8ee', heading: '#14161b', text: '#3c4049' } },
  { id: 'forest-oath', name: 'Forest Oath', colors: { cover: '#1d2a1f', foil: '#b78a3e', pageEdge: '#e9e3cc', heading: '#16201a', text: '#3e4a3c' } },
  { id: 'glacier', name: 'Glacier', colors: { cover: '#1b2a33', foil: '#cdd9e0', pageEdge: '#eaf1f4', heading: '#13212a', text: '#3a4a52' } },
  { id: 'ember-forge', name: 'Ember Forge', colors: { cover: '#2c1606', foil: '#e07b2c', pageEdge: '#f1dcb6', heading: '#241204', text: '#56392a' } },
  { id: 'ravens-call', name: "Raven's Call", colors: { cover: '#0e0e10', foil: '#c8a45a', pageEdge: '#e7e0cb', heading: '#0c0c0e', text: '#3a3a40' } },
  { id: 'gold-standard', name: 'Gold Standard', colors: { cover: '#5a4717', foil: '#f0cf72', pageEdge: '#f6ecca', heading: '#2e2408', text: '#6a5526' } },
  { id: 'deep-violet', name: 'Deep Violet', colors: { cover: '#241a33', foil: '#c8b2e0', pageEdge: '#ece4f2', heading: '#1c1428', text: '#473a55' } },
  { id: 'storm-gray', name: 'Storm Gray', colors: { cover: '#2b2e31', foil: '#d7dde0', pageEdge: '#edf0f1', heading: '#202326', text: '#474c50' } },
  { id: 'bone-ivory', name: 'Bone Ivory', colors: { cover: '#d9d2c4', foil: '#9a7b3c', pageEdge: '#7a6a4a', heading: '#2c281f', text: '#574e3c' } },
  { id: 'oxblood', name: 'Oxblood', colors: { cover: '#2e1012', foil: '#b98a3c', pageEdge: '#e7d9b8', heading: '#220b0d', text: '#503234' } },
  { id: 'sea-bronze', name: 'Sea Bronze', colors: { cover: '#13282a', foil: '#cd9a52', pageEdge: '#e8e1c8', heading: '#0f2022', text: '#37494a' } },
  { id: 'ash-silver', name: 'Ash & Silver', colors: { cover: '#1f2024', foil: '#d2d6dc', pageEdge: '#e9ebef', heading: '#191a1e', text: '#42454c' } },
  { id: 'rust-iron', name: 'Rust Iron', colors: { cover: '#332019', foil: '#c47b46', pageEdge: '#ecdcc6', heading: '#271710', text: '#54403a' } },
  { id: 'royal-indigo', name: 'Royal Indigo', colors: { cover: '#161b33', foil: '#c9b56f', pageEdge: '#e9e4cd', heading: '#101428', text: '#3a4060' } },
  { id: 'sand-relic', name: 'Sand Relic', colors: { cover: '#3b3322', foil: '#dcc079', pageEdge: '#f1e8cd', heading: '#2a2417', text: '#5a4f38' } },
  { id: 'obsidian-gold', name: 'Obsidian Gold', colors: { cover: '#101012', foil: '#e3c06a', pageEdge: '#efe2bf', heading: '#0d0d0f', text: '#3b3a3e' } },
  { id: 'verdigris', name: 'Verdigris', colors: { cover: '#16302b', foil: '#b8a85a', pageEdge: '#e7e6cf', heading: '#102420', text: '#36483f' } },
  { id: 'pewter-rose', name: 'Pewter Rose', colors: { cover: '#322a2c', foil: '#cba6a0', pageEdge: '#ece4e2', heading: '#241e20', text: '#4d4244' } },
]

const PRESET_BY_ID = new Map(BOOK_COVER_PRESETS.map((p) => [p.id, p]))

/** Look up a preset's colours by id (undefined when unknown). */
export function bookCoverPresetColors(id: string): BookColors | undefined {
  return PRESET_BY_ID.get(id)?.colors
}
