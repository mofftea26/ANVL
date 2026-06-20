import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { CheckoutPaymentMethodDefinition } from '../config/checkoutPayments.config'
import type { CheckoutSchemaInput } from '../schemas/checkout.schema'

interface CheckoutPaymentFieldsProps {
  definitions: readonly CheckoutPaymentMethodDefinition[]
  internationalBlocked: boolean
  register: UseFormRegister<CheckoutSchemaInput>
  errors: FieldErrors<CheckoutSchemaInput>
}

export function CheckoutPaymentFields({
  definitions,
  internationalBlocked,
  register,
  errors,
}: CheckoutPaymentFieldsProps) {
  return (
    <fieldset className="space-y-4 border-0 p-0">
      <legend className="anvl-heading pt-2 text-4xl">Payment</legend>
      {internationalBlocked ? (
        <p
          className="rounded-md border border-[color-mix(in_oklab,var(--color-warning)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_6%,transparent)] p-3 text-sm text-[var(--color-text)]"
          role="status"
        >
          International shipping and card checkout are not enabled for this build. Ship to Lebanon, set
          VITE_ANVL_INTERNATIONAL_CHECKOUT=true for international card (mock) checkout, or contact support.
        </p>
      ) : null}
      {definitions.length > 0 ? (
        <div className="space-y-3" role="radiogroup" aria-label="Payment method">
          {definitions.map((def) => (
            <label
              key={def.id}
              className="flex cursor-pointer gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-text)] has-[:checked]:border-[var(--color-text-muted)]"
            >
              <input
                type="radio"
                value={def.id}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-text)]"
                {...register('paymentMethod')}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--color-text)]">{def.label}</span>
                <span className="mt-1 block text-xs text-[var(--color-text-muted)]">{def.description}</span>
                <span className="mt-2 block font-mono text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  Integration: {def.integrationPoint.replace(/_/g, ' ')}
                </span>
              </span>
            </label>
          ))}
        </div>
      ) : null}
      {errors.paymentMethod?.message ? (
        <p className="text-xs text-[color:var(--color-danger)]" role="alert">
          {errors.paymentMethod.message}
        </p>
      ) : null}
    </fieldset>
  )
}
