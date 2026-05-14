/**
 * Serializes JSON-LD with `<` escaped so a string value cannot break out of
 * the script element (defense-in-depth for untrusted CMS strings).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
