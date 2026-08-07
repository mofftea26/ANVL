/**
 * Currency formatting for every customer-visible price.
 *
 * Before this, prices were written as `` `$${price}` `` at seven call sites and
 * the currency the commerce adapter actually returned (`Product.currency`, and
 * Shopify's per-price `currencyCode`) was used ONLY in JSON-LD. So the markup
 * search engines read and the number the shopper read could disagree — and a
 * store selling in anything but USD showed the wrong symbol everywhere.
 *
 * `Intl.NumberFormat` also fixes grouping and decimal conventions for free,
 * which hand-built strings never did.
 */

const DEFAULT_CURRENCY = 'USD'

/** Cache formatters: constructing `Intl.NumberFormat` is not free, and price
 *  lists re-format the same (locale, currency) pair many times per render. */
const formatterCache = new Map<string, Intl.NumberFormat>()

function getFormatter(
  currency: string,
  locale: string | undefined,
  fractionDigits: 0 | 2,
): Intl.NumberFormat {
  const key = `${locale ?? ''}|${currency}|${fractionDigits}`
  const cached = formatterCache.get(key)
  if (cached) return cached

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }

  let formatter: Intl.NumberFormat
  try {
    formatter = new Intl.NumberFormat(locale, options)
  } catch {
    // `Intl` throws on a malformed/unknown ISO code. A bad code from a CMS or
    // adapter must never blank out a price, so fall back rather than throw.
    formatter = new Intl.NumberFormat(locale, { ...options, currency: DEFAULT_CURRENCY })
  }
  formatterCache.set(key, formatter)
  return formatter
}

/**
 * @param amount   Major units (e.g. 85 = eighty-five dollars), matching how
 *                 `Product.price` is already stored throughout the app.
 * @param currency ISO 4217. Defaults to USD when absent — the adapters always
 *                 supply one, so this only covers seed/legacy rows.
 * @param locale   Omit to use the runtime's locale, which is what a shopper
 *                 expects for grouping separators.
 */
export function formatMoney(
  // `null` is accepted because `ProductShopMeta.compareAtPrice` is
  // `number | null` — the callers already gate on it being a real number, but
  // taking the nullable type here keeps that guard from having to be restated
  // as a cast at every sale-price call site.
  amount: number | null | undefined,
  currency: string | undefined,
  locale?: string,
): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return ''
  // Whole prices read as `$85`, not `$85.00` — matching how the storefront
  // already displayed them. Anything with a fractional part gets the full two
  // decimals a price must have: a single `maximumFractionDigits: 2` formatter
  // renders 85.5 as `$85.5`, which is not a price.
  const fractionDigits = Number.isInteger(amount) ? 0 : 2
  return getFormatter(
    currency?.trim() || DEFAULT_CURRENCY,
    locale,
    fractionDigits,
  ).format(amount)
}
