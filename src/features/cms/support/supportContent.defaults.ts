import type { SupportContentConfig } from './supportContent.zod'

/**
 * FULL designed support copy — the code-owned source of truth the storefront
 * renders when the CMS blob leaves a field blank. `resolveSupportContent` merges
 * the CMS `support_content` over these defaults (per field for scalars, as a
 * whole block for the section/item lists when the CMS list is empty).
 *
 * Copy carried forward from the original code-owned routes so nothing regresses:
 * `/faq`, `/contact`, `/returns`, `/care-guide`, and the narrative parts of
 * `/size-guide`. `shipping` is net-new. Per-product care/size tables default to
 * empty maps — they are authored per real commerce slug in the admin.
 *
 * `answer`/`body` are plain text; a blank line starts a new paragraph.
 */

export const SUPPORT_CONTENT_DEFAULTS: SupportContentConfig = {
  faq: {
    intro:
      'Answers to the questions we hear most about sizing, shipping, care, and orders.',
    items: [
      {
        id: 'faq-sizing',
        question: 'How do I find my size?',
        answer:
          'Use our Size Guide for full measurements and the Lebanon/EU conversion table. Every product page also has a size chart, and — if you are signed in with saved measurements — a personalized size suggestion next to the size selector.',
      },
      {
        id: 'faq-care',
        question: 'How do I care for my ANVL pieces?',
        answer:
          'See our Care Guide for wash and dry instructions. Product-specific care notes are also listed on each product page.',
      },
      {
        id: 'faq-shipping',
        question: 'What are your shipping times?',
        answer:
          'Orders are processed within 1–3 business days. Delivery times vary by destination and are confirmed at checkout before you pay.',
      },
      {
        id: 'faq-returns',
        question: 'What is your returns policy?',
        answer:
          'Unworn items in original condition can be returned within 14 days of delivery. Full details are on our Returns page.',
      },
      {
        id: 'faq-orders',
        question: 'How can I track or change my order?',
        answer:
          'Signed-in customers can view order status under Account → Orders. For changes or urgent questions, reach out via our Contact page.',
      },
    ],
  },
  contact: {
    intro:
      'For support, order questions, and wholesale inquiries, reach out to ANVL Athletics.',
    email: 'support@anvlathletics.com',
    phone: '',
    instagram: '@anvlathletics',
    address: 'Lebanon',
    hours: 'Monday to Friday, 9:00–18:00 (Beirut time)',
  },
  shipping: {
    intro:
      'Where we ship, how long it takes, and what it costs — confirmed at checkout before you pay.',
    sections: [
      {
        id: 'shipping-processing',
        heading: 'Processing time',
        body: 'Orders are prepared and dispatched within 1–3 business days. During a drop launch, processing may take a little longer — we will note it at checkout if so.',
      },
      {
        id: 'shipping-domestic',
        heading: 'Delivery within Lebanon',
        body: 'We deliver across Lebanon through trusted local couriers. Estimated delivery is 2–5 business days after dispatch, depending on your area.',
      },
      {
        id: 'shipping-international',
        heading: 'International delivery',
        body: 'International shipping availability, cost, and transit time are calculated and confirmed at checkout for your destination before you pay. Any import duties or taxes are the responsibility of the recipient.',
      },
      {
        id: 'shipping-tracking',
        heading: 'Tracking',
        body: 'Once your order ships, tracking details are sent to your email. Signed-in customers can also follow order status under Account → Orders.',
      },
    ],
  },
  returns: {
    intro: 'Returns are accepted on unworn items within 14 days of delivery.',
    sections: [
      {
        id: 'returns-window',
        heading: 'Return window',
        body: 'You have 14 days from the delivery date to request a return. Items must be in original condition with tags and packaging intact.',
      },
      {
        id: 'returns-hygiene',
        heading: 'Compression & hygiene items',
        body: 'Compression garments are eligible only if unworn and their hygiene seal is preserved. For health and safety reasons, we cannot accept these back once that seal is broken.',
      },
      {
        id: 'returns-how',
        heading: 'How to start a return',
        body: 'Email support@anvlathletics.com with your order number and the item you would like to return, and we will guide you through the next steps.',
      },
    ],
  },
  careGuide: {
    intro: 'Keep every ANVL piece structured, clean, and long-lasting.',
    sections: [
      {
        id: 'care-washing',
        heading: 'Washing',
        body: 'Wash cold, inside out, with similar colors. A gentle cycle protects seams, prints, and technical fabrics.',
      },
      {
        id: 'care-drying',
        heading: 'Drying',
        body: 'Avoid harsh tumble drying to preserve shape and print durability. Where possible, hang or lay flat to dry.',
      },
      {
        id: 'care-compression',
        heading: 'Compression pieces',
        body: 'For compression products, lay flat to dry and avoid high heat. Never iron directly over prints or technical panels.',
      },
    ],
    perProduct: {},
  },
  sizeGuide: {
    intro:
      'All measurements are in centimetres. EU numbers follow the men’s woven/knit top scale you see across Lebanon (44–52), shown next to our letter sizes so you can match what you already wear.',
    note: 'How to measure — Chest: run the tape horizontally around the fullest part with arms relaxed and breathe normally. Length: measure from the top of the shoulder seam at the base of the neck down to where you want the hem. Between sizes? For oversized and stringer, take the larger chest bracket for more drape; for compression, most lifters size down for maximum hold. ANVL patterns may differ from imported basics sold under the same EU number — always compare to your own chest tape reading first.',
    perProduct: {},
  },
}
