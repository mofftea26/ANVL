import { useMemo } from 'react'
import { useCartStore } from '../store/cart.store'

export function useCart() {
  const lines = useCartStore((state) => state.lines)
  const addLine = useCartStore((state) => state.addLine)
  const removeLine = useCartStore((state) => state.removeLine)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clear = useCartStore((state) => state.clear)

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines],
  )
  const quantity = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  )

  return {
    lines,
    subtotal,
    quantity,
    addLine,
    removeLine,
    updateQuantity,
    clear,
  }
}
