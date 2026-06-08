import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeTintedMediaMark } from '@/shared/components/ui/ThemeTintedMediaMark'
import { themeSvgMarkupForTint } from '@/shared/lib/themeSvgMarkup'

describe('ThemeTintedMediaMark', () => {
  it('renders pre-themed svg markup immediately', () => {
    const markup = themeSvgMarkupForTint(
      '<svg viewBox="0 0 10 10"><path fill="#000" d="M0 0"/></svg>',
    )
    const { container } = render(
      <ThemeTintedMediaMark
        src="/brand/mark.svg"
        themedSvgMarkup={markup}
        width={80}
        height={80}
      />,
    )
    expect(container.querySelector('svg')).toBeTruthy()
    expect(container.querySelector('img')).toBeNull()
    expect(container.innerHTML).toContain('currentColor')
  })

  it('renders raster images normally', () => {
    const { container } = render(
      <ThemeTintedMediaMark src="https://cdn.test/hero.png" width={80} height={80} />,
    )
    expect(container.querySelector('img')?.getAttribute('src')).toContain('hero.png')
  })
})
