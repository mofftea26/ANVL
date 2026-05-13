import type { DropThemePalette } from './drops.types'

export const DROP_THEME_PRESETS: DropThemePalette[] = [
  {
    id: 'the-oath',
    name: 'The Oath',
    colors: {
      background: '#0b0b0c',
      surface: '#121315',
      surfaceSoft: '#1a1c1f',
      heading: '#e7e4df',
      text: '#f5f4f2',
      mutedText: '#bab8b3',
      line: 'rgba(231, 228, 223, 0.14)',
      accent: '#c7c2b8',
      accentSoft: 'rgba(199, 194, 184, 0.35)',
      heroGlow: 'rgba(231, 228, 223, 0.08)',
      danger: '#c45c5c',
      success: '#7aab7a',
    },
  },
  {
    id: 'bone-charcoal',
    name: 'Bone & Charcoal',
    colors: {
      background: '#141311',
      surface: '#1c1a18',
      surfaceSoft: '#262321',
      heading: '#ebe6dc',
      text: '#f3eee8',
      mutedText: '#a39e96',
      line: 'rgba(235, 230, 220, 0.12)',
      accent: '#d4c4a8',
      accentSoft: 'rgba(212, 196, 168, 0.35)',
      heroGlow: 'rgba(235, 230, 220, 0.06)',
      danger: '#c45c5c',
      success: '#8fbc8f',
    },
  },
  {
    id: 'steel-lime',
    name: 'Steel & Lime',
    colors: {
      background: '#0e1114',
      surface: '#161b20',
      surfaceSoft: '#1f2630',
      heading: '#dce7ea',
      text: '#eef4f6',
      mutedText: '#8fa3ad',
      line: 'rgba(220, 231, 234, 0.14)',
      accent: '#c8ff4d',
      accentSoft: 'rgba(200, 255, 77, 0.28)',
      heroGlow: 'rgba(200, 255, 77, 0.07)',
      danger: '#ff6b6b',
      success: '#58d68d',
    },
  },
  {
    id: 'blood-iron',
    name: 'Blood & Iron',
    colors: {
      background: '#080809',
      surface: '#121014',
      surfaceSoft: '#1c171a',
      heading: '#dcd5cf',
      text: '#ece7e2',
      mutedText: '#9d9590',
      line: 'rgba(220, 213, 207, 0.14)',
      accent: '#8b2f2f',
      accentSoft: 'rgba(139, 47, 47, 0.35)',
      heroGlow: 'rgba(139, 47, 47, 0.09)',
      danger: '#ff4444',
      success: '#7aab7a',
    },
  },
]

export function findThemePreset(id: string): DropThemePalette | undefined {
  return DROP_THEME_PRESETS.find((p) => p.id === id)
}
