import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCheckoutForm } from '@/features/checkout/hooks/useCheckoutForm'
import { useCartAnalytics } from '@/features/analytics/hooks/useCartAnalytics'
import {
  Button,
  Container,
  FormField,
  Input,
  Section,
  Select,
} from '@/shared/components/ui'

export const Route = createFileRoute('/checkout/')({
  head: () =>
    buildSeoMeta({
      title: 'Checkout | ANVL Athletics',
      description: 'Complete your ANVL Athletics order.',
      path: '/checkout',
    }),
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const { lines, subtotal, clear } = useCart()
  const form = useCheckoutForm()
  const { trackBeginCheckout, trackOrderPlaced } = useCartAnalytics()

  const onSubmit = form.handleSubmit(async (values) => {
    if (lines.length === 0) {
      toast.error('Your cart is empty.')
      return
    }

    trackBeginCheckout(lines.length, subtotal)
    const order = await runtimeClients.payment.placeOrder(values, lines)
    trackOrderPlaced(order.orderId, order.total)
    clear()
    toast.success('Order placed successfully.')
    navigate({ to: '/checkout/success', search: { orderId: order.orderId } })
  })

  return (
    <Section>
      <Container>
        <h1 className="anvl-heading text-6xl">Checkout</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <form className="space-y-4" onSubmit={onSubmit}>
            <h2 className="anvl-heading text-4xl">Contact</h2>
            <FormField label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="First Name" error={form.formState.errors.firstName?.message}>
                <Input {...form.register('firstName')} />
              </FormField>
              <FormField label="Last Name" error={form.formState.errors.lastName?.message}>
                <Input {...form.register('lastName')} />
              </FormField>
            </div>
            <h2 className="anvl-heading pt-2 text-4xl">Shipping</h2>
            <FormField label="Address" error={form.formState.errors.address1?.message}>
              <Input {...form.register('address1')} />
            </FormField>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="City" error={form.formState.errors.city?.message}>
                <Input {...form.register('city')} />
              </FormField>
              <FormField label="Country" error={form.formState.errors.country?.message}>
                <Input {...form.register('country')} />
              </FormField>
              <FormField label="Phone" error={form.formState.errors.phone?.message}>
                <Input {...form.register('phone')} />
              </FormField>
            </div>
            <FormField label="Delivery Method" error={form.formState.errors.deliveryMethod?.message}>
              <Select {...form.register('deliveryMethod')}>
                <option value="standard">Standard (3-5 days)</option>
                <option value="express">Express (1-2 days)</option>
              </Select>
            </FormField>
            <FormField label="Payment Method" error={form.formState.errors.paymentMethod?.message}>
              <Select {...form.register('paymentMethod')}>
                <option value="cashOnDelivery">Cash on Delivery</option>
                <option value="tapPayments">Tap Payments (placeholder)</option>
                <option value="netCommerce">NetCommerce (placeholder)</option>
              </Select>
            </FormField>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Placing Order...' : 'Place Order'}
            </Button>
          </form>
          <aside className="h-fit rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h2 className="anvl-heading text-4xl">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              {lines.map((line) => (
                <div className="flex items-center justify-between" key={`${line.productId}:${line.size}:${line.colorway}`}>
                  <span>
                    {line.name} x {line.quantity}
                  </span>
                  <span>${(line.price * line.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--color-line)] pt-3">
              <p className="text-sm">Total: ${subtotal.toFixed(2)}</p>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  )
}
