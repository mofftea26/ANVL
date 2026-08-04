import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import type { CartLine } from '../types/cart.types'

/**
 * Shape guard for the persisted cart (SEC-17).
 *
 * CLAUDE.md's rule is that every localStorage-backed adapter validates with Zod
 * before merging. The cart was the exception: it trusted whatever was under
 * `anvl-cart` verbatim. That value is attacker-reachable in any XSS scenario
 * and corruptible by a half-written write, and it is read by `PremiumNavTopbar`
 * — a component on EVERY page — so a malformed entry took the whole site down,
 * not just the cart.
 *
 * `.catch`-free and strict on the fields the UI dereferences; unknown keys are
 * dropped rather than rejected so a future additive field cannot strand a
 * shopper's cart on an older tab.
 */
const cartLineSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string(),
  price: z.number().finite().nonnegative(),
  colorway: z.string(),
  size: z.string(),
  quantity: z.number().int().positive(),
  image: z.string(),
  variantId: z.string().optional(),
  currency: z.string().optional(),
})

const persistedCartSchema = z.object({
  lines: z.array(cartLineSchema).default([]),
})

/**
 * Drop only the lines that fail, never the whole cart — losing one corrupted
 * row is recoverable for a shopper; silently emptying a full cart is not.
 */
function parsePersistedLines(raw: unknown): CartLine[] {
  const parsed = persistedCartSchema.safeParse(raw)
  if (parsed.success) return parsed.data.lines
  const lines = (raw as { lines?: unknown })?.lines
  if (!Array.isArray(lines)) return []
  return lines.flatMap((line) => {
    const one = cartLineSchema.safeParse(line)
    return one.success ? [one.data] : []
  })
}

interface CartStoreState {
  lines: CartLine[]
  addLine: (line: CartLine) => void
  removeLine: (productId: string, size: string, colorway: string) => void
  updateQuantity: (
    productId: string,
    size: string,
    colorway: string,
    quantity: number,
  ) => void
  clear: () => void
}

const makeKey = (line: Pick<CartLine, 'productId' | 'size' | 'colorway'>) =>
  `${line.productId}:${line.size}:${line.colorway}`

export const useCartStore = create<CartStoreState>()(
  persist(
    (set) => ({
      lines: [],
      addLine: (line) =>
        set((state) => {
          const key = makeKey(line)
          const existing = state.lines.find((item) => makeKey(item) === key)
          if (!existing) {
            return { lines: [...state.lines, line] }
          }
          return {
            lines: state.lines.map((item) =>
              makeKey(item) === key
                ? { ...item, quantity: item.quantity + line.quantity }
                : item,
            ),
          }
        }),
      removeLine: (productId, size, colorway) =>
        set((state) => ({
          lines: state.lines.filter(
            (item) =>
              !(
                item.productId === productId &&
                item.size === size &&
                item.colorway === colorway
              ),
          ),
        })),
      updateQuantity: (productId, size, colorway, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((item) =>
              item.productId === productId &&
              item.size === size &&
              item.colorway === colorway
                ? { ...item, quantity }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: 'anvl-cart',
      // Bumping this invalidates carts written before the schema existed.
      // Kept at 1 with a tolerant `migrate` instead of discarding them: the
      // pre-versioned shape is a strict subset of the current one, so every
      // still-valid line survives.
      version: 1,
      migrate: (persisted) => ({ lines: parsePersistedLines(persisted) }),
      // Runs on EVERY rehydrate, not just a version bump — this is what stops
      // a hand-edited or truncated `anvl-cart` reaching the nav badge.
      merge: (persisted, current) => ({
        ...current,
        lines: parsePersistedLines(persisted),
      }),
    },
  ),
)
