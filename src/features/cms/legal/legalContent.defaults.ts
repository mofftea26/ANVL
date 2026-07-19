import type { LegalPage, LegalPageKey } from './legalContent.zod'

/**
 * FULL designed legal copy — the code-owned source of truth the storefront
 * renders when the CMS blob leaves a field blank. `resolveLegalContent` merges
 * the CMS `legal_content` over these defaults (per field for the scalars, as a
 * whole block for `sections` when the CMS list is empty).
 *
 * Copy carried forward from the original code-owned routes so nothing regresses:
 * `/privacy`, `/terms`, `/cookie-policy`. `accessibility` is net-new — a solid
 * WCAG 2.1 AA commitment written for ANVL.
 *
 * `body` is plain text; a blank line starts a new paragraph. `updatedAt` is an
 * ISO date shown as "Last updated"; blank hides the stamp.
 */

export const LEGAL_CONTENT_DEFAULTS: Record<LegalPageKey, LegalPage> = {
  privacy: {
    title: 'Privacy Policy',
    updatedAt: '2026-07-19',
    intro:
      'ANVL Athletics collects only the personal data required to fulfill orders and support customers. This policy explains what we hold, why we hold it, and the control you keep over it.',
    sections: [
      {
        id: 'privacy-what-we-collect',
        heading: 'What we collect',
        body: 'We process the contact and shipping details you provide at checkout — name, email, phone, and delivery address — strictly to fulfill your order and support you afterwards.\n\nWhen you create an account we also store the profile and saved preferences you choose to add, so your next order is faster.',
      },
      {
        id: 'privacy-how-we-use-it',
        heading: 'How we use it',
        body: 'Your information is used to process payments, ship orders, answer support requests, and — only if you opt in — send drop announcements.\n\nWe do not sell your personal data, and we never share it beyond the providers who help us run the store (payment, shipping, and hosting partners bound by their own agreements).',
      },
      {
        id: 'privacy-analytics',
        heading: 'Analytics',
        body: 'Analytics events are currently mocked in development and can be replaced by privacy-compliant providers later. When a real analytics provider is enabled, this policy will be updated to name it and describe your choices.',
      },
      {
        id: 'privacy-your-rights',
        heading: 'Your rights',
        body: 'You can request a copy of the data we hold about you, ask us to correct it, or ask us to delete it. Email support@anvlathletics.com and we will respond promptly.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updatedAt: '2026-07-19',
    intro:
      'By ordering from ANVL Athletics, you agree to our order, payment, and shipping terms. Please read them before completing a purchase.',
    sections: [
      {
        id: 'terms-orders',
        heading: 'Orders',
        body: 'All orders are subject to stock availability and final verification. We may decline or cancel an order if an item is unavailable or if we suspect fraud, and any charge taken for a cancelled order is refunded in full.',
      },
      {
        id: 'terms-pricing-payment',
        heading: 'Pricing & payment',
        body: 'Prices are shown at checkout before you pay and are confirmed at the moment of purchase. Payment method placeholders are mocked in this build and are intended for integration with a real payment provider before launch.',
      },
      {
        id: 'terms-shipping',
        heading: 'Shipping',
        body: 'Orders are processed within 1–3 business days. Delivery times vary by destination and are confirmed at checkout before you pay.',
      },
      {
        id: 'terms-returns',
        heading: 'Returns',
        body: 'Unworn items in original condition can be returned within 14 days of delivery. See the Returns page for the full policy, including the hygiene rules on compression garments.',
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    updatedAt: '2026-07-19',
    intro:
      'ANVL Athletics uses a small number of cookies to keep the storefront and your account working correctly.',
    sections: [
      {
        id: 'cookies-essential',
        heading: 'Essential cookies',
        body: 'Essential cookies keep you signed in, remember items in your cart, and secure the admin CMS login. The site does not function correctly without these, so they cannot be turned off.',
      },
      {
        id: 'cookies-preference',
        heading: 'Preference cookies',
        body: 'Preference cookies remember choices like your selected size or theme where applicable, so the store feels consistent between visits.',
      },
      {
        id: 'cookies-tracking',
        heading: 'Advertising & tracking',
        body: 'We do not currently use third-party advertising or cross-site tracking cookies. If that ever changes, we will update this policy and ask for consent first. See our Privacy Policy for how we handle personal data more broadly.',
      },
    ],
  },
  accessibility: {
    title: 'Accessibility Statement',
    updatedAt: '2026-07-19',
    intro:
      'ANVL Athletics is committed to making its storefront usable by everyone. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA across the site.',
    sections: [
      {
        id: 'a11y-commitment',
        heading: 'Our commitment',
        body: 'Accessibility is part of how we build, not an afterthought. We design and test the storefront so that people who use assistive technology, keyboards, or reduced-motion settings can browse, shop, and check out with the same confidence as anyone else.',
      },
      {
        id: 'a11y-keyboard',
        heading: 'Keyboard & screen readers',
        body: 'Every interactive control — links, buttons, menus, dialogs, and forms — can be reached and operated with a keyboard alone, with a visible focus indicator at each step. Dialogs trap focus while open and return it when closed, and form fields carry proper labels so screen readers announce them correctly.',
      },
      {
        id: 'a11y-contrast',
        heading: 'Contrast & readability',
        body: 'Text and essential controls are designed to meet WCAG AA contrast ratios against their backgrounds. Status is never communicated by color alone — we pair it with text or an icon so meaning survives for color-blind and low-vision users.',
      },
      {
        id: 'a11y-motion',
        heading: 'Motion & animation',
        body: 'The site’s cinematic animations respect your system “reduce motion” setting. When reduced motion is requested, heavy scroll and WebGL effects are disabled in favour of a calm, static layout, and no essential content is ever hidden behind an animation.',
      },
      {
        id: 'a11y-feedback',
        heading: 'Reporting a problem',
        body: 'We know accessibility is ongoing work. If you hit a barrier or something is hard to use with assistive technology, email support@anvlathletics.com with the page and what happened, and we will investigate and fix it.',
      },
    ],
  },
}
