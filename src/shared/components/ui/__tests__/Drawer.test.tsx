/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Drawer } from '@/shared/components/ui/Drawer'

describe('Drawer', () => {
  it('anchors the panel on the right by default', () => {
    render(
      <Drawer open onClose={() => {}} aria-label="Menu">
        <p>Inside</p>
      </Drawer>,
    )
    const panel = screen.getByRole('dialog')
    expect(panel.className).toContain('right-0')
    expect(panel.className).toContain('border-l')
  })

  it('anchors the panel on the left when placement=left', () => {
    render(
      <Drawer open placement="left" onClose={() => {}} aria-label="Nav">
        <p>Inside</p>
      </Drawer>,
    )
    const panel = screen.getByRole('dialog')
    expect(panel.className).toContain('left-0')
    expect(panel.className).toContain('border-r')
    expect(panel.className).toContain('max-h-[100dvh]')
    expect(panel.className).not.toContain('right-0')
  })
})
