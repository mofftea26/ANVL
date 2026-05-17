import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { JsonLd } from '@/shared/components/seo/JsonLd'

/**
 * SEC defense-in-depth: JsonLd must escape `<` so a CMS string cannot
 * inject `</script>` or any other tag boundary into the JSON-LD payload.
 */
describe('JsonLd', () => {
  it('emits an application/ld+json script with escaped < characters', () => {
    const { container } = render(
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          name: 'evil </script><img src=x onerror=alert(1)>',
        }}
      />,
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    const html = script!.innerHTML
    // Only `<` is escaped (defense vs `</script>` boundary); `>` is left alone.
    expect(html).not.toContain('</script>')
    expect(html).toContain('\\u003c/script>')
    expect(html).toContain('\\u003cimg')
    // sanity: it's still parseable JSON when you unescape the `<` literals.
    const json = JSON.parse(html.replace(/\\u003c/g, '<'))
    expect(json.name).toContain('</script>')
  })

  it('serializes nested objects and arrays without losing keys', () => {
    const { container } = render(
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          offers: [{ price: 79, priceCurrency: 'USD' }],
        }}
      />,
    )
    const html = container.querySelector(
      'script[type="application/ld+json"]',
    )!.innerHTML
    expect(html).toContain('"@type":"Product"')
    expect(html).toContain('"priceCurrency":"USD"')
  })
})
