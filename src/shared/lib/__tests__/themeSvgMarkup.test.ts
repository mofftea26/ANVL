import { describe, expect, it } from 'vitest'
import { isSvgEmblemUrl, themeSvgMarkupForTint } from '@/shared/lib/themeSvgMarkup'

/**
 * `themeSvgMarkupForTint` is the only thing between a CMS-hosted SVG (writable
 * by any `editor`) and `dangerouslySetInnerHTML`. CLAUDE.md requires a test for
 * every such sink. Each case below is a vector that executes WITHOUT a
 * `<script>` tag — the original implementation stripped only `<script>` and let
 * all of these through.
 */
describe('themeSvgMarkupForTint — script-execution vectors', () => {
  const runs = (markup: string) => themeSvgMarkupForTint(markup)

  it('strips <script> blocks', () => {
    const out = runs('<svg><script>alert(1)</script><path d="M0 0"/></svg>')
    expect(out).not.toMatch(/<script/i)
    expect(out).not.toContain('alert(1)')
  })

  it('strips stray/unpaired script tags', () => {
    expect(runs('<svg><script src="//evil/x.js"></svg>')).not.toMatch(/<script/i)
  })

  it('strips onload on the root <svg> element', () => {
    const out = runs('<svg onload="fetch(\'//evil\')"><path d="M0 0"/></svg>')
    expect(out).not.toMatch(/onload/i)
    expect(out).not.toContain('evil')
  })

  it.each([
    ['double-quoted', '<svg><circle onerror="steal()" r="1"/></svg>'],
    ['single-quoted', "<svg><circle onerror='steal()' r='1'/></svg>"],
    ['unquoted', '<svg><circle onerror=steal() r="1"/></svg>'],
  ])('strips %s event-handler attributes', (_label, markup) => {
    const out = runs(markup)
    expect(out).not.toMatch(/onerror/i)
    expect(out).not.toContain('steal()')
  })

  it('strips SMIL onbegin/onend handlers', () => {
    const out = runs('<svg><animate onbegin="alert(1)" onend="alert(2)"/></svg>')
    expect(out).not.toMatch(/onbegin|onend/i)
  })

  it('strips <foreignObject>, which embeds arbitrary HTML', () => {
    const out = runs(
      '<svg><foreignObject><img src=x onerror="alert(1)"></foreignObject></svg>',
    )
    expect(out).not.toMatch(/foreignObject/i)
    expect(out).not.toContain('alert(1)')
  })

  it('strips javascript: hrefs, including the xlink form', () => {
    const out = runs(
      '<svg><a href="javascript:alert(1)"><path d="M0 0"/></a>' +
        '<use xlink:href="javascript:alert(2)"/></svg>',
    )
    expect(out).not.toContain('javascript:')
  })

  it('strips cross-origin href references', () => {
    const out = runs('<svg><use href="https://evil.example/x.svg#a"/></svg>')
    expect(out).not.toContain('evil.example')
  })
})

describe('themeSvgMarkupForTint — appearance is preserved', () => {
  it('coerces fills and strokes to currentColor for tinting', () => {
    const out = themeSvgMarkupForTint('<svg><path fill="#ff0000" stroke="#00ff00"/></svg>')
    expect(out).toContain('fill="currentColor"')
    expect(out).toContain('stroke="currentColor"')
  })

  it('leaves none/transparent fills alone', () => {
    const out = themeSvgMarkupForTint('<svg><path fill="none" stroke="transparent"/></svg>')
    expect(out).toContain('fill="none"')
    expect(out).toContain('stroke="transparent"')
  })

  it('keeps <style> — CSS cannot execute script and removing it changes the mark', () => {
    const out = themeSvgMarkupForTint('<svg><style>.a{opacity:.5}</style><path/></svg>')
    expect(out).toContain('<style>')
    expect(out).toContain('opacity:.5')
  })

  it('adds the accessibility + sizing attributes the inline emblem needs', () => {
    const out = themeSvgMarkupForTint('<svg viewBox="0 0 10 10"><path/></svg>')
    expect(out).toContain('aria-hidden="true"')
    expect(out).toContain('focusable="false"')
    expect(out).toContain('preserveAspectRatio="xMidYMid meet"')
  })

  it('keeps same-origin fragment references working', () => {
    const out = themeSvgMarkupForTint('<svg><use href="#glyph-a"/></svg>')
    expect(out).toContain('href="#glyph-a"')
  })
})

describe('isSvgEmblemUrl', () => {
  it.each([
    ['data:image/svg+xml;base64,PHN2Zz4=', true],
    ['/brand/mark.svg', true],
    ['https://cdn.example/a/b.svg?v=2', true],
    ['/brand/mark.png', false],
    ['', false],
  ])('%s → %s', (url, expected) => {
    expect(isSvgEmblemUrl(url)).toBe(expected)
  })
})
