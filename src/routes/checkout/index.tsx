import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { useCart } from '@/features/cart/hooks/useCart'
import { CheckoutPaymentFields } from '@/features/checkout/components/CheckoutPaymentFields'
import type { CheckoutPaymentMethodDefinition } from '@/features/checkout/config/checkoutPayments.config'
import {
  CHECKOUT_COMMERCE_FLAGS,
  CHECKOUT_SHIPPING_COUNTRIES,
  getCheckoutPaymentMethodDefinitions,
  isLebanonShippingCountry,
} from '@/features/checkout/config/checkoutPayments.config'
import { useCheckoutForm } from '@/features/checkout/hooks/useCheckoutForm'
import { useSyncCheckoutPaymentWithCountry } from '@/features/checkout/hooks/useSyncCheckoutPaymentWithCountry'
import { useCartAnalytics } from '@/features/analytics/hooks/useCartAnalytics'
import {
  Button,
  Container,
  FormField,
  Input,
  Section,
  Select,
  Textarea,
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

  const country = useWatch({ control: form.control, name: 'country' }) ?? ''
  const paymentMethod = useWatch({ control: form.control, name: 'paymentMethod' })

  useSyncCheckoutPaymentWithCountry(form, country)

  const paymentDefinitions = useMemo(
    () => getCheckoutPaymentMethodDefinitions(country, CHECKOUT_COMMERCE_FLAGS),
    [country],
  )

  const internationalBlocked =
    country.length > 0 && !isLebanonShippingCountry(country) && !CHECKOUT_COMMERCE_FLAGS.internationalCheckoutEnabled

  const selectedPaymentDefinition: CheckoutPaymentMethodDefinition | undefined = paymentDefinitions.find(
    (d) => d.id === paymentMethod,
  )

  const onSubmit = form.handleSubmit(async (values) => {
    if (lines.length === 0) {
      toast.error('Your cart is empty.')
      return
    }

    if (internationalBlocked) {
      toast.error('Update your shipping country to continue.')
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
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Guest checkout — no account required. Create an account after your order when accounts launch.
        </p>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <h2 className="anvl-heading text-4xl">Contact</h2>
            <FormField label="Email" error={form.formState.errors.email?.message} htmlFor="checkout-email">
              <Input id="checkout-email" type="email" autoComplete="email" {...form.register('email')} />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="First name"
                error={form.formState.errors.firstName?.message}
                htmlFor="checkout-first-name"
              >
                <Input id="checkout-first-name" autoComplete="given-name" {...form.register('firstName')} />
              </FormField>
              <FormField
                label="Last name"
                error={form.formState.errors.lastName?.message}
                htmlFor="checkout-last-name"
              >
                <Input id="checkout-last-name" autoComplete="family-name" {...form.register('lastName')} />
              </FormField>
            </div>
            <h2 className="anvl-heading pt-2 text-4xl">Shipping</h2>
            <FormField label="Address line 1" error={form.formState.errors.address1?.message} htmlFor="checkout-a1">
              <Input id="checkout-a1" autoComplete="address-line1" {...form.register('address1')} />
            </FormField>
            <FormField
              label="Address line 2"
              error={form.formState.errors.address2?.message}
              htmlFor="checkout-a2"
              hint="Apartment, suite, building (optional)"
            >
              <Input id="checkout-a2" autoComplete="address-line2" {...form.register('address2')} />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="City" error={form.formState.errors.city?.message} htmlFor="checkout-city">
                <Input id="checkout-city" autoComplete="address-level2" {...form.register('city')} />
              </FormField>
              <FormField
                label="Postal code"
                error={form.formState.errors.postalCode?.message}
                htmlFor="checkout-postal"
                hint="Optional"
              >
                <Input id="checkout-postal" autoComplete="postal-code" {...form.register('postalCode')} />
              </FormField>
            </div>
            <FormField label="Country" error={form.formState.errors.country?.message} htmlFor="checkout-country">
              <Select id="checkout-country" autoComplete="country-name" {...form.register('country')}>
                {CHECKOUT_SHIPPING_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Phone" error={form.formState.errors.phone?.message} htmlFor="checkout-phone">
              <Input
                id="checkout-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+961 …"
                {...form.register('phone')}
              />
            </FormField>
            <FormField
              label="Delivery notes"
              error={form.formState.errors.deliveryNotes?.message}
              htmlFor="checkout-notes"
              hint="Gate code, driver instructions, or preferred delivery window (optional)"
            >
              <Textarea id="checkout-notes" className="min-h-[88px]" {...form.register('deliveryNotes')} />
            </FormField>
            <FormField
              label="Delivery method"
              error={form.formState.errors.deliveryMethod?.message}
              htmlFor="checkout-delivery"
            >
              <Select id="checkout-delivery" {...form.register('deliveryMethod')}>
                <option value="standard">Standard (3-5 days)</option>
                <option value="express">Express (1-2 days)</option>
              </Select>
            </FormField>
            <CheckoutPaymentFields
              definitions={paymentDefinitions}
              internationalBlocked={internationalBlocked}
              selectedDefinition={selectedPaymentDefinition}
              register={form.register}
              errors={form.formState.errors}
            />
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting || internationalBlocked || paymentDefinitions.length === 0
              }
            >
              {form.formState.isSubmitting ? 'Placing Order...' : 'Place Order'}
            </Button>
          </form>
          <aside className="h-fit rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h2 className="anvl-heading text-4xl">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              {lines.map((line) => (
                <div
                  className="flex items-center justify-between"
                  key={`${line.productId}:${line.size}:${line.colorway}`}
                >
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
