/**
 * Header/footer/mobile links whose href targets `/drop/*` are rewritten at
 * compose time to the active drop slug and public title. Treat them as a
 * single "campaign" slot in the admin UI — label/href are not authoritative.
 */
export function isActiveDropNavTemplateHref(href: string): boolean {
  return href.trim().startsWith('/drop/')
}
