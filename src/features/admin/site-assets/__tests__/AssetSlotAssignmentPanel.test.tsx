/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AssetSlotDefinition } from '@/features/landingPages/assetSlots'
import { AssetSlotAssignmentPanel } from '../AssetSlotAssignmentPanel'

const sampleSlots: AssetSlotDefinition[] = [
  {
    key: 'heroImage',
    label: 'Hero image',
    kind: 'image',
    section: 'Hero',
  },
]

describe('AssetSlotAssignmentPanel', () => {
  it('renders scope control and slot fields for the active scope', () => {
    render(
      <AssetSlotAssignmentPanel
        scope="general"
        onScopeChange={vi.fn()}
        scopeOptions={[
          { value: 'general', label: 'General (site-wide)' },
          { value: 'the-oath', label: 'Landing — The Oath' },
        ]}
        slotSections={[{ title: 'Hero', slots: sampleSlots }]}
        assignments={{}}
        assignmentValue={() => ''}
        onSlotChange={vi.fn()}
        mediaAssets={[{ id: 'media-1', filename: 'hero.webp', mime: 'image/webp' }]}
      />,
    )

    expect(screen.getByTestId('asset-slot-assignment-panel')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Scope' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Hero image' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hero' })).toBeInTheDocument()
  })

  it('calls onSlotChange when a media asset is selected', async () => {
    const user = userEvent.setup()
    const onSlotChange = vi.fn()

    render(
      <AssetSlotAssignmentPanel
        scope="general"
        onScopeChange={vi.fn()}
        scopeOptions={[{ value: 'general', label: 'General (site-wide)' }]}
        slotSections={[{ title: null, slots: sampleSlots }]}
        assignments={{}}
        assignmentValue={() => ''}
        onSlotChange={onSlotChange}
        mediaAssets={[{ id: 'media-1', filename: 'hero.webp', mime: 'image/webp' }]}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Hero image' }))
    await user.click(screen.getByRole('option', { name: 'hero.webp' }))

    expect(onSlotChange).toHaveBeenCalledWith('heroImage', 'media-1')
  })

  it('calls onScopeChange when the scope picker changes', async () => {
    const user = userEvent.setup()
    const onScopeChange = vi.fn()

    render(
      <AssetSlotAssignmentPanel
        scope="general"
        onScopeChange={onScopeChange}
        scopeOptions={[
          { value: 'general', label: 'General (site-wide)' },
          { value: 'the-oath', label: 'Landing — The Oath' },
        ]}
        slotSections={[{ title: null, slots: sampleSlots }]}
        assignments={{}}
        assignmentValue={() => ''}
        onSlotChange={vi.fn()}
        mediaAssets={[]}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Scope' }))
    await user.click(screen.getByRole('option', { name: 'Landing — The Oath' }))

    expect(onScopeChange).toHaveBeenCalledWith('the-oath')
  })
})
