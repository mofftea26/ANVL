import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { CheckoutPaymentMethodDefinition } from '../config/checkoutPayments.config'
import type { CheckoutSchemaInput } from '../schemas/checkout.schema'
import { FormField, Select } from '@/shared/components/ui'

interface CheckoutPaymentFieldsProps {
  definitions: readonly CheckoutPaymentMethodDefinition[]
  internationalBlocked: boolean
  selectedDefinition: CheckoutPaymentMethodDefinition | undefined
  register: UseFormRegister<CheckoutSchemaInput>
  errors: FieldErrors<CheckoutSchemaInput>
}

export function CheckoutPaymentFields({
  definitions,
  internationalBlocked,
  selectedDefinition,
  register,
  errors,
}: CheckoutPaymentFieldsProps) {
  return (
    <div className="space-y-4">
      <h2 className="anvl-heading pt-2 text-4xl">Payment</h2>
      {internationalBlocked ? (
        <p
          className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-[var(--color-text)]"
          role="status"
        >
          International shipping and card checkout are not enabled for this build. Ship to Lebanon, set
          VITE_ANVL_INTERNATIONAL_CHECKOUT=true for international card (mock) checkout, or contact support.
        </p>
      ) : null}
      {definitions.length > 0 ? (
        <>
          <FormField label="Payment method" error={errors.paymentMethod?.message} htmlFor="checkout-payment">
            <Select id="checkout-payment" {...register('paymentMethod')}>
              {definitions.map((def) => (
                <option key={def.id} value={def.id}>
                  {def.label}
                </option>
              ))}
            </Select>
          </FormField>
          {selectedDefinition ? (
            <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-text-muted)]">
              <p>{selectedDefinition.description}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                Integration: {selectedDefinition.integrationPoint.replace(/_/g, ' ')}
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
