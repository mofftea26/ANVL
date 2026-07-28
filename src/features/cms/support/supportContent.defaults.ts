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

/**
 * Fallback "Last updated" stamp for the two guide pages, shown when the CMS
 * leaves `updatedAt` blank. Bump it when the default guide copy below changes.
 */
const GUIDE_UPDATED_AT = '2026-07-28'

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
    updatedAt: GUIDE_UPDATED_AT,
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
    // Overrides-only legend copy, keyed by `CareIconKey` — seeded from
    // `CARE_SYMBOL_META` (careSymbols.tsx), refined to the brand's direct,
    // physical voice. Only the 26 keys in `CARE_SYMBOL_CATEGORIES` are legend
    // members; legacy alias keys are never looked up here.
    legend: {
      heading: 'What the symbols mean',
      intro: 'The standard care marks on every ANVL tag, explained in plain language.',
      entries: {
        wash: { label: 'Machine wash', meaning: 'Machine wash on a normal cycle — no special handling needed.' },
        'wash-30': { label: 'Wash at 30°C', meaning: 'Machine wash at 30°C or below.' },
        'wash-40': { label: 'Wash at 40°C', meaning: 'Machine wash at 40°C or below.' },
        'wash-50': { label: 'Wash at 50°C', meaning: 'Machine wash at 50°C or below.' },
        'wash-60': { label: 'Wash at 60°C', meaning: 'Machine wash at 60°C or below.' },
        'wash-cold': { label: 'Cold wash', meaning: 'Machine wash cold — heat kills compression and print.' },
        'wash-gentle': { label: 'Gentle cycle', meaning: 'Use the delicate cycle — reduced agitation and spin protect seams and print.' },
        'wash-hand': { label: 'Hand wash', meaning: 'Hand wash only — no machine agitation.' },
        'wash-inside-out': { label: 'Wash inside out', meaning: 'Turn inside out before washing to protect the print and face yarn.' },
        'do-not-wash': { label: 'Do not wash', meaning: 'Do not machine or hand wash — clean by another method only.' },
        bleach: { label: 'Bleach allowed', meaning: 'Bleach may be used when needed — check colorfastness first.' },
        'do-not-bleach': { label: 'Do not bleach', meaning: 'No bleach of any kind — it destroys elastane.' },
        'tumble-dry': { label: 'Tumble dry', meaning: 'Tumble drying is safe on this piece.' },
        'tumble-dry-low': { label: 'Tumble dry low', meaning: 'Tumble dry on low heat only — high heat shrinks technical fabric.' },
        'tumble-dry-high': { label: 'Tumble dry high', meaning: 'Tumble dry on high heat is fine for this piece.' },
        'do-not-tumble-dry': { label: 'Do not tumble dry', meaning: 'No dryer — tumble heat relaxes the knit and breaks down elastane.' },
        'line-dry': { label: 'Line dry', meaning: 'Hang to dry on a line or hanger, out of direct sun.' },
        'dry-flat': { label: 'Dry flat', meaning: 'Dry flat on a rack so the piece holds its shape and does not stretch.' },
        'drip-dry': { label: 'Drip dry', meaning: 'Hang dripping wet straight from the wash and let gravity do the rest.' },
        iron: { label: 'Iron', meaning: 'Ironing is safe on this piece.' },
        'iron-low': { label: 'Iron low', meaning: 'Iron on the lowest setting, inside out, away from prints.' },
        'iron-medium': { label: 'Iron medium', meaning: 'Iron on a medium setting, inside out.' },
        'iron-high': { label: 'Iron high', meaning: 'Iron on a high setting when needed.' },
        'do-not-iron': { label: 'Do not iron', meaning: 'Never iron — direct heat melts performance fibre.' },
        'dry-clean': { label: 'Dry clean', meaning: 'Professional dry cleaning is safe for this piece.' },
        'do-not-dry-clean': { label: 'Do not dry clean', meaning: 'No dry cleaning — the solvents attack the fibre.' },
      },
    },
    perProduct: {},
  },
  sizeGuide: {
    intro:
      'All measurements are in centimetres. EU numbers follow the men’s woven/knit top scale you see across Lebanon (44–52), shown next to our letter sizes so you can match what you already wear.',
    updatedAt: GUIDE_UPDATED_AT,
    note: 'How to measure — Chest: run the tape horizontally around the fullest part with arms relaxed and breathe normally. Length: measure from the top of the shoulder seam at the base of the neck down to where you want the hem. Between sizes? For oversized and stringer, take the larger chest bracket for more drape; for compression, most lifters size down for maximum hold. ANVL patterns may differ from imported basics sold under the same EU number — always compare to your own chest tape reading first.',
    // "Where we measure" — the diagram's lettered points, one content set per
    // garment silhouette (a stringer has no sleeve/cuff; joggers/shorts have
    // no chest/collar/sleeve). `bottom` is the one label that intentionally
    // differs by type: Hem on tops, Leg opening on bottoms.
    measure: {
      heading: 'Where we measure',
      intro:
        'Every ANVL piece is measured flat, seam to seam, before it ships. Match the points below to your own tape before you pick a size.',
      footnote:
        'Widths are half measurements, taken with the garment laid flat — double them for the full circumference. A dash means that size is not offered.',
      garmentTypes: [
        {
          key: 'tee',
          label: 'Tee',
          points: [
            { key: 'length', letter: 'A', label: 'Body length', description: 'Top of the shoulder seam at the base of the neck, straight down to the hem.' },
            { key: 'chest', letter: 'B', label: 'Chest', description: 'Tape flat across the chest, one inch below the armpit, seam to seam.' },
            { key: 'waist', letter: 'C', label: 'Waist', description: 'Tape flat across the narrowest point of the torso, seam to seam.' },
            { key: 'bottom', letter: 'D', label: 'Hem', description: 'Tape flat across the bottom hem, seam to seam.' },
            { key: 'collar', letter: 'E', label: 'Neck opening', description: 'Tape across the neckline opening, seam to seam.' },
            { key: 'sleeve', letter: 'F', label: 'Sleeve length', description: 'Shoulder seam to the end of the sleeve cuff.' },
            { key: 'cuff', letter: 'G', label: 'Cuff opening', description: 'Tape flat across the sleeve opening, seam to seam.' },
          ],
        },
        {
          key: 'stringer',
          label: 'Stringer',
          points: [
            { key: 'length', letter: 'A', label: 'Body length', description: 'Top of the shoulder strap seam, straight down to the hem.' },
            { key: 'chest', letter: 'B', label: 'Chest', description: 'Tape flat across the chest at the widest point, seam to seam.' },
            { key: 'waist', letter: 'C', label: 'Waist', description: 'Tape flat across the narrowest point of the torso, seam to seam.' },
            { key: 'bottom', letter: 'D', label: 'Hem', description: 'Tape flat across the bottom hem, seam to seam.' },
            { key: 'collar', letter: 'E', label: 'Neck opening', description: 'Tape across the front neckline drop, seam to seam.' },
          ],
        },
        {
          key: 'hoodie',
          label: 'Hoodie',
          points: [
            { key: 'length', letter: 'A', label: 'Body length', description: 'Top of the shoulder seam at the base of the neck, straight down to the hem — hood excluded.' },
            { key: 'chest', letter: 'B', label: 'Chest', description: 'Tape flat across the chest, one inch below the armpit, seam to seam.' },
            { key: 'waist', letter: 'C', label: 'Waist', description: 'Tape flat across the narrowest point at the ribbed waistband, seam to seam.' },
            { key: 'bottom', letter: 'D', label: 'Hem', description: 'Tape flat across the ribbed hem, seam to seam.' },
            { key: 'collar', letter: 'E', label: 'Neck opening', description: 'Tape across the neck opening beneath the hood, seam to seam.' },
            { key: 'sleeve', letter: 'F', label: 'Sleeve length', description: 'Shoulder seam to the end of the ribbed cuff.' },
            { key: 'cuff', letter: 'G', label: 'Cuff opening', description: 'Tape flat across the ribbed sleeve cuff, seam to seam.' },
          ],
        },
        {
          key: 'joggers',
          label: 'Joggers',
          points: [
            { key: 'length', letter: 'A', label: 'Inseam length', description: 'Inside leg seam, crotch to hem.' },
            { key: 'waist', letter: 'B', label: 'Waist', description: 'Tape around the elastic waistband, relaxed, not stretched.' },
            { key: 'bottom', letter: 'C', label: 'Leg opening', description: 'Tape flat across the leg opening, seam to seam.' },
            { key: 'cuff', letter: 'D', label: 'Cuff opening', description: 'Tape flat across the ribbed ankle cuff, seam to seam.' },
          ],
        },
        {
          key: 'shorts',
          label: 'Shorts',
          points: [
            { key: 'length', letter: 'A', label: 'Inseam length', description: 'Inside leg seam, crotch to hem.' },
            { key: 'waist', letter: 'B', label: 'Waist', description: 'Tape around the elastic waistband, relaxed, not stretched.' },
            { key: 'bottom', letter: 'C', label: 'Leg opening', description: 'Tape flat across the leg opening, seam to seam.' },
          ],
        },
      ],
    },
    perProduct: {},
  },
}
