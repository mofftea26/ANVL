/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DropThemePaletteCard } from '@/features/admin/drops/DropThemePaletteCard'
import { DROP_THEME_PRESETS } from '@/features/admin/drops/drops.presets'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}))

describe('DropThemePaletteCard', () => {
  it('shows Save as preset control next to revert/copy actions', () => {
    const t = structuredClone(DROP_THEME_PRESETS[0]!)
    render(
      <DropThemePaletteCard
        theme={t}
        savedTheme={structuredClone(t)}
        onApplyPreset={vi.fn()}
        onThemeChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /save as preset/i })).toBeTruthy()
  })

  it('uses AdminSelect combobox for preset (no native select)', () => {
    const t = structuredClone(DROP_THEME_PRESETS[0]!)
    render(
      <DropThemePaletteCard
        theme={t}
        savedTheme={structuredClone(t)}
        onApplyPreset={vi.fn()}
        onThemeChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('combobox', { name: /theme preset/i })).toBeTruthy()
    expect(document.querySelector('select')).toBeNull()
  })

  it('calls onApplyPreset when choosing a preset from the combobox', async () => {
    const user = userEvent.setup()
    const onApplyPreset = vi.fn()
    const t = structuredClone(DROP_THEME_PRESETS[0]!)
    render(
      <DropThemePaletteCard
        theme={t}
        savedTheme={structuredClone(t)}
        onApplyPreset={onApplyPreset}
        onThemeChange={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('combobox', { name: /theme preset/i }))
    await user.click(screen.getByRole('option', { name: 'Bone & Charcoal' }))
    expect(onApplyPreset).toHaveBeenCalledWith('bone-charcoal')
  })

  it('disables revert when draft matches saved palette', () => {
    const t = structuredClone(DROP_THEME_PRESETS[0]!)
    render(
      <DropThemePaletteCard
        theme={t}
        savedTheme={structuredClone(t)}
        onApplyPreset={vi.fn()}
        onThemeChange={vi.fn()}
      />,
    )
    const revert = screen.getByRole('button', { name: /revert palette/i })
    expect((revert as HTMLButtonElement).disabled).toBe(true)
  })

  it('fires revert when dirty', async () => {
    const user = userEvent.setup()
    const saved = structuredClone(DROP_THEME_PRESETS[0]!)
    const draft = structuredClone(saved)
    draft.colors.accent = '#ff0000'
    const onThemeChange = vi.fn()
    render(
      <DropThemePaletteCard
        theme={draft}
        savedTheme={saved}
        onApplyPreset={vi.fn()}
        onThemeChange={onThemeChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: /revert palette/i }))
    expect(onThemeChange).toHaveBeenCalledTimes(1)
    expect(onThemeChange.mock.calls[0][0]).toEqual(saved)
  })
})
