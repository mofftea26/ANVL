/**
 * The FAQ page body. The old flat `<details>` stack was replaced by "The Forge
 * Seam" (`./faq/FaqForge`); this module stays as the feature's public entry
 * point so the route and the JSON-LD helper keep their import paths.
 */
export { FaqForge as FaqAccordion } from './faq/FaqForge'
export { FaqForge } from './faq/FaqForge'
export { faqPageJsonLd } from './faq/faqPageJsonLd'
