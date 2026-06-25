import type { ThemeAppearance } from './themeLibrary'
import type { ThemePalette } from './cmsSiteConfig.zod'

/**
 * Brand-authored theme presets for Drop 01 (§4).
 *
 * Each entry carries only the normalized palette colors; `finalizeThemePalette`
 * in `themeLibrary.ts` fills the muted surface, foregrounds, ring, and status
 * colors, and `themeConfigToCssVars` derives every effect token (brand aliases,
 * surface elevation, chips, hero glows, particles, scrollbars) from them. Keys
 * are stable identifiers (never the label) so CMS assignments survive renames.
 */
export type RawThemePreset = {
  key: string
  label: string
  appearance: ThemeAppearance
  /** The normalized palette colors; everything else is derived. */
  palette: Partial<ThemePalette>
  description?: string
  recommendedFor?: string[]
  /** Marks the recommended Drop 01 launch theme (§4.1, §26). */
  recommended?: boolean
}

export const ANVL_THEME_PRESETS: RawThemePreset[] = [
  {
    key: 'oath-obsidian',
    label: 'Oath Obsidian',
    appearance: 'dark',
    recommended: true,
    description:
      'Premium, disciplined, forged and cinematic. Champagne is the commerce accent; copper is the storytelling highlight.',
    recommendedFor: ['Drop 01 landing', 'Core identity', 'Ecommerce', 'Checkout'],
    palette: {
      background: '#08090A',
      foreground: '#F4F1EA',
      card: '#111315',
      border: 'rgba(233, 226, 214, 0.16)',
      mutedForeground: '#B8B2A8',
      primary: '#C7B28E',
      primaryForeground: '#111111',
      accent: '#A84F2B',
      accentForeground: '#FFFFFF',
    },
  },
  {
    key: 'blackened-champagne',
    label: 'Blackened Champagne',
    appearance: 'dark',
    description: 'Blackened metal, aged champagne foil, luxury editorial sportswear. Refined over aggressive.',
    recommendedFor: ['Premium campaigns', 'Editorial product pages', 'Launch storytelling'],
    palette: {
      background: '#0A0908',
      foreground: '#F5F2EC',
      card: '#141210',
      border: 'rgba(234, 223, 203, 0.15)',
      mutedForeground: '#BAB1A3',
      primary: '#D2BB91',
      accent: '#C29A42',
      accentForeground: '#1A1206',
    },
  },
  {
    key: 'oxblood-covenant',
    label: 'Oxblood Covenant',
    appearance: 'dark',
    description: 'An oath in wax and oxidized iron. Controlled oxblood — never bright red or gore.',
    recommendedFor: ['Ceremonial storytelling', 'Limited campaigns', 'The Oath moments'],
    palette: {
      background: '#0B0809',
      foreground: '#F5EFED',
      card: '#160F11',
      border: 'rgba(233, 217, 212, 0.15)',
      mutedForeground: '#BFADAA',
      primary: '#BE9382',
      accent: '#982E27',
      accentForeground: '#F7ECEA',
    },
  },
  {
    key: 'burnished-bronze',
    label: 'Burnished Bronze',
    appearance: 'dark',
    description: 'Ancient armour, heated bronze, soot and weathered forge metal. Historical but modern.',
    recommendedFor: ['Heritage campaigns', 'Forge storytelling'],
    palette: {
      background: '#0A0806',
      foreground: '#F5F0E6',
      card: '#16110B',
      border: 'rgba(232, 216, 186, 0.16)',
      mutedForeground: '#C1B6A0',
      primary: '#BC8E48',
      accent: '#A05A1C',
      accentForeground: '#FBF3E8',
    },
  },
  {
    key: 'cold-forged-steel',
    label: 'Cold Forged Steel',
    appearance: 'dark',
    description: 'Engineered knitwear, compression, precision, cold steel — with a crisp steel-blue highlight.',
    recommendedFor: ['Compression products', 'Technical specs', 'Fabric construction'],
    palette: {
      background: '#07090C',
      foreground: '#F1F4F6',
      card: '#0F141A',
      border: 'rgba(220, 228, 234, 0.15)',
      mutedForeground: '#AFB9C3',
      primary: '#97ABBC',
      accent: '#3E6E9E',
      accentForeground: '#F2F6FA',
    },
  },
  {
    key: 'ashen-olive',
    label: 'Ashen Olive',
    appearance: 'dark',
    description: 'Discipline, worn canvas, ash and understated strength. Not camouflage, not tactical.',
    recommendedFor: ['Controls', 'Selected states', 'Supporting UI'],
    palette: {
      background: '#080907',
      foreground: '#F1F2EC',
      card: '#12140E',
      border: 'rgba(225, 229, 217, 0.15)',
      mutedForeground: '#B3B9A9',
      primary: '#A4AB81',
      accent: '#5B6630',
      accentForeground: '#F4F5EC',
    },
  },
  {
    key: 'midnight-cobalt',
    label: 'Midnight Cobalt',
    appearance: 'dark',
    description: 'Modern, intelligent, powerful — midnight blue-black with desaturated forged-blue accents.',
    recommendedFor: ['Modern campaigns', 'Technical narrative'],
    palette: {
      background: '#06080D',
      foreground: '#F1F3F8',
      card: '#0F1420',
      border: 'rgba(222, 228, 242, 0.15)',
      mutedForeground: '#AEB6C8',
      primary: '#8C9FCB',
      accent: '#39579A',
      accentForeground: '#F1F4FB',
    },
  },
  {
    key: 'blackened-teal',
    label: 'Blackened Teal',
    appearance: 'dark',
    description: 'Oxidized metal, muted mineral teal, near-black surfaces. Premium and restrained.',
    recommendedFor: ['Active controls', 'Technology labels', 'Technical details'],
    palette: {
      background: '#060A0A',
      foreground: '#EFF4F2',
      card: '#0E1615',
      border: 'rgba(220, 233, 228, 0.15)',
      mutedForeground: '#ACBBB6',
      primary: '#84AB9E',
      accent: '#237A70',
      accentForeground: '#EFF6F4',
    },
  },
  {
    key: 'iron-violet',
    label: 'Iron Violet',
    appearance: 'dark',
    description: 'Limited edition — blackened iron with muted mineral violet. Mysterious, ceremonial, never neon.',
    recommendedFor: ['Limited releases', 'Capsule collections'],
    palette: {
      background: '#09080C',
      foreground: '#F3F0F5',
      card: '#151119',
      border: 'rgba(229, 221, 233, 0.15)',
      mutedForeground: '#B9B1BE',
      primary: '#A691B0',
      accent: '#5E4595',
      accentForeground: '#F4F0FB',
    },
  },
  {
    key: 'bone-relic',
    label: 'Bone Relic',
    appearance: 'light',
    description: 'Primary light editorial theme — unbleached paper, carved stone, bone fabric, dark ink.',
    recommendedFor: ['Lookbooks', 'Sizing guides', 'Journal', 'Editorial'],
    palette: {
      background: '#F4F0E8',
      foreground: '#181817',
      card: '#FFFFFF',
      border: 'rgba(24, 24, 23, 0.16)',
      mutedForeground: '#57534D',
      primary: '#5C4B37',
      accent: '#8A3C20',
      accentForeground: '#F8F1EA',
    },
  },
  {
    key: 'theoath-modern-tech-forge',
    label: 'Theoath Modern — Tech Forge',
    appearance: 'dark',
    description:
      'Dark technical product laboratory: near-black surfaces, restrained champagne as the commerce accent, cold steel for technical lines and indexes. Art-directed for the Theoath Modern experience.',
    recommendedFor: ['Theoath Modern landing', 'Technical product pages', 'Compression storytelling'],
    palette: {
      background: '#050607',
      foreground: '#F1EFE9',
      card: '#101315',
      border: 'rgba(255, 255, 255, 0.11)',
      mutedForeground: '#AAA79F',
      primary: '#B49772',
      primaryForeground: '#050607',
      accent: '#8B9294',
      accentForeground: '#0B0D0E',
      success: '#5E8C6A',
      warning: '#C7A24B',
      destructive: '#C0584C',
    },
  },
]
