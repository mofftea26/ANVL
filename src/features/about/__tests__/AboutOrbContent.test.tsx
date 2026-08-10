import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutOrbContent } from '@/features/about/components/AboutOrbContent'
import { ABOUT_WORLD_MAP_SRC } from '@/features/about/components/aboutWorldMap'
import type { AboutResolvedOrb } from '@/features/about/content/aboutContent.defaults'

/** A fully-populated resolved orb the layouts can pick their fields from. */
function makeOrb(overrides: Partial<AboutResolvedOrb> = {}): AboutResolvedOrb {
  return {
    id: 'test-orb',
    label: 'Test Orb',
    color: '#E08A4A',
    layout: 'classic',
    eyebrow: 'The Eyebrow',
    title: 'The Title',
    subhead: 'The lead subhead line.',
    body: 'The body copy.',
    detail: 'The spec detail line',
    lines: ['Line one', 'Line two'],
    points: [{ label: 'Seam', description: 'Flat against the skin.' }],
    stats: [{ id: 'hours', label: 'Hours', value: '500', suffix: '+' }],
    mapPins: [{ id: 'pin-1', x: 62, y: 38, label: 'Beirut' }],
    timeline: [
      { id: 'm-1', marker: '2026', title: 'Drop 01', body: 'The Oath ships.' },
      { id: 'm-2', marker: '2027', title: 'Drop 02', body: 'The next chapter.' },
    ],
    tagline: 'Forged Under Pressure.',
    ...overrides,
  }
}

function renderOrb(orb: AboutResolvedOrb, reveal = false) {
  return render(
    <AboutOrbContent orb={orb} headingId="test-orb-title" variant="chapter" reveal={reveal} />,
  )
}

describe('AboutOrbContent — layout switch', () => {
  it('classic renders the free-form composition (lines, points, stats, CTAs)', () => {
    const { container } = renderOrb(makeOrb())
    // The classic path has no preset wrapper…
    expect(container.querySelector('[data-orb-layout]')).toBeNull()
    // …and renders the free-form field set.
    expect(screen.getByText('Line one')).toBeInTheDocument()
    expect(screen.getByText('Seam')).toBeInTheDocument()
    expect(screen.getByText('Hours')).toBeInTheDocument()
    // Classic ignores the preset-only subhead field.
    expect(screen.queryByText('The lead subhead line.')).toBeNull()
  })

  it('text renders the editorial composition with the subhead lead', () => {
    const { container } = renderOrb(makeOrb({ layout: 'text' }))
    expect(container.querySelector('[data-orb-layout="text"]')).not.toBeNull()
    expect(screen.getByText('The lead subhead line.')).toBeInTheDocument()
    expect(screen.getByText('The spec detail line')).toBeInTheDocument()
    // Text preset drops the classic-only blocks.
    expect(screen.queryByText('Line one')).toBeNull()
    expect(screen.queryByText('Seam')).toBeNull()
  })

  it('stats renders the numerals grid with count-up markers on reveal', () => {
    const { container } = renderOrb(makeOrb({ layout: 'stats' }), true)
    expect(container.querySelector('[data-orb-layout="stats"]')).not.toBeNull()
    expect(screen.getByText('Hours')).toBeInTheDocument()
    const value = container.querySelector('[data-orb-stat-value]')
    expect(value).not.toBeNull()
    expect(value?.getAttribute('data-stat-target')).toBe('500')
  })

  it('stats hides the grid when the orb has no stats', () => {
    const { container } = renderOrb(makeOrb({ layout: 'stats', stats: [] }))
    expect(container.querySelector('[data-orb-layout="stats"]')).not.toBeNull()
    expect(screen.queryByText('Hours')).toBeNull()
  })

  it('map renders the world map with the labelled pins', () => {
    const { container } = renderOrb(makeOrb({ layout: 'map' }))
    expect(container.querySelector('[data-orb-layout="map"]')).not.toBeNull()
    const img = container.querySelector('[data-about-map] img')
    expect(img?.getAttribute('src')).toBe(ABOUT_WORLD_MAP_SRC)
    expect(screen.getByText('Beirut')).toBeInTheDocument()
  })

  it('map hides the map block entirely when there are no pins', () => {
    const { container } = renderOrb(makeOrb({ layout: 'map', mapPins: [] }))
    expect(container.querySelector('[data-about-map]')).toBeNull()
  })

  it('timeline renders the milestones in order', () => {
    const { container } = renderOrb(makeOrb({ layout: 'timeline' }))
    expect(container.querySelector('[data-orb-layout="timeline"]')).not.toBeNull()
    const list = container.querySelector('[data-about-timeline]')
    expect(list).not.toBeNull()
    const text = list?.textContent ?? ''
    expect(text.indexOf('Drop 01')).toBeGreaterThan(-1)
    expect(text.indexOf('Drop 01')).toBeLessThan(text.indexOf('Drop 02'))
    expect(screen.getByText('2026')).toBeInTheDocument()
  })
})
