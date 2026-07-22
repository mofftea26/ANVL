import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import { AboutOrbsFields } from '@/features/admin/about/sections/AboutOrbsFields'
import {
  toAboutFormValues,
  type AboutContentFormValues,
} from '@/features/admin/about/aboutContentForm'

const ORB_COUNT = ABOUT_DEFAULT_CONTENT.orbs.length

function Harness({ initial }: { initial?: unknown }) {
  const form = useForm<AboutContentFormValues>({ defaultValues: toAboutFormValues(initial) })
  return (
    <AboutOrbsFields register={form.register} control={form.control} setValue={form.setValue} />
  )
}

function renderFields(initial?: unknown) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Harness initial={initial} />
    </QueryClientProvider>,
  )
}

describe('AboutOrbsFields — chip picker', () => {
  it('renders one chip per orb but only ONE orb fieldset at a time', () => {
    renderFields()
    expect(screen.getAllByRole('tab')).toHaveLength(ORB_COUNT)
    // Only the selected orb's fields render.
    expect(screen.getAllByLabelText('Orb label')).toHaveLength(1)
    expect(screen.getByLabelText('Orb label')).toHaveAttribute('id', 'about-orb-0-label')
  })

  it('keeps every orb inspector anchor in the DOM via the chips (contract)', () => {
    renderFields()
    // Even with a single fieldset mounted, ALL per-orb anchors must be
    // findable — inspect-locate rings/focuses the chip, which opens the orb.
    for (let i = 1; i <= ORB_COUNT; i++) {
      const anchor = document.getElementById(`pt-anchor-about-orb-${i}`)
      expect(anchor, `pt-anchor-about-orb-${i}`).not.toBeNull()
      expect(anchor?.getAttribute('role')).toBe('tab')
    }
  })

  it('switches the open orb when a chip is pressed', () => {
    renderFields()
    const chips = screen.getAllByRole('tab')
    expect(chips[0]).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(chips[2]!)
    expect(chips[2]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Orb label')).toHaveAttribute('id', 'about-orb-2-label')
  })

  it('labels chips with the orb number and its label (override or default)', () => {
    renderFields({ orbs: [{ label: 'Custom One' }, {}] })
    const chips = screen.getAllByRole('tab')
    expect(chips[0]).toHaveTextContent('Orb 01 — Custom One')
    expect(chips[1]).toHaveTextContent(`Orb 02 — ${ABOUT_DEFAULT_CONTENT.orbs[1]!.label}`)
  })
})

describe('AboutOrbsFields — layout presets', () => {
  it('classic shows the full free-form field set', () => {
    renderFields()
    expect(screen.getByLabelText('Tagline')).toBeInTheDocument()
    expect(screen.getByLabelText('Big lines (one per row)')).toBeInTheDocument()
    expect(screen.getByLabelText('Primary CTA label')).toBeInTheDocument()
    expect(screen.getByText('Callout points (label + description)')).toBeInTheDocument()
    expect(screen.getByText('Stats (numeric values count up on reveal)')).toBeInTheDocument()
    // Preset-only fields stay hidden.
    expect(screen.queryByLabelText('Subhead')).toBeNull()
    expect(screen.queryByText(/Map pins/)).toBeNull()
  })

  it('the text preset shows the subhead and hides classic-only fields', () => {
    renderFields()
    fireEvent.click(screen.getByRole('radio', { name: 'Text' }))
    expect(screen.getByLabelText('Subhead')).toBeInTheDocument()
    expect(screen.getByLabelText('Detail line')).toBeInTheDocument()
    expect(screen.queryByLabelText('Tagline')).toBeNull()
    expect(screen.queryByLabelText('Primary CTA label')).toBeNull()
    expect(screen.queryByText('Callout points (label + description)')).toBeNull()
  })

  it('the stats preset keeps the stats list editor and drops the rest', () => {
    renderFields()
    fireEvent.click(screen.getByRole('radio', { name: 'Stats' }))
    expect(screen.getByText('Stats (numeric values count up on reveal)')).toBeInTheDocument()
    expect(screen.queryByLabelText('Detail line')).toBeNull()
    expect(screen.queryByLabelText('Tagline')).toBeNull()
  })

  it('the map preset shows the pin editor with the world map', () => {
    renderFields()
    fireEvent.click(screen.getByRole('radio', { name: 'Map' }))
    expect(screen.getByText(/Map pins/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add pin' })).toBeInTheDocument()
    // The pin placer renders the shared world-map artwork.
    expect(document.querySelector('img[src="/brand/world-map.svg"]')).not.toBeNull()
    expect(screen.queryByLabelText('Eyebrow')).toBeNull()
  })

  it('the timeline preset shows the milestone list editor', () => {
    renderFields()
    fireEvent.click(screen.getByRole('radio', { name: 'Timeline' }))
    expect(screen.getByText(/Milestones/)).toBeInTheDocument()
    const add = screen.getByRole('button', { name: 'Add milestone' })
    fireEvent.click(add)
    expect(screen.getByLabelText('Marker 1')).toBeInTheDocument()
    expect(screen.queryByLabelText('Tagline')).toBeNull()
  })
})
