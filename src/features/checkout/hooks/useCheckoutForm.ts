import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { checkoutSchema, type CheckoutSchemaInput } from '../schemas/checkout.schema'

export function useCheckoutForm() {
  return useForm<CheckoutSchemaInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      postalCode: '',
      country: 'Lebanon',
      phone: '',
      deliveryNotes: '',
      deliveryMethod: 'standard',
      paymentMethod: 'cashOnDelivery',
    },
  })
}
