import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartLine } from '../types/cart.types'

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
    },
  ),
)
