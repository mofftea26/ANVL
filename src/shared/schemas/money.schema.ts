import { z } from 'zod'

/**
 * Monetary amount in major units (e.g. USD dollars) with ISO currency code.
 * Commerce backends may later migrate to minor units; adapters should convert.
 */
export const moneySchema = z.object({
  amount: z.number(),
  currencyCode: z.string().min(3).max(3),
})

export type Money = z.infer<typeof moneySchema>
