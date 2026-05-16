import { useEffect, useLayoutEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { create } from 'zustand'
import { z } from 'zod'
import type { Address, Customer, CustomerProfileUpdate, Order } from '@/app/config/accountContracts'
import { getSessionCustomerId } from '@/app/config/accountSession'
import {
  mockAccountForgotPassword,
  mockAccountSignIn,
  mockAccountSignUp,
} from '@/app/config/accountMock'
import { setSessionCustomerId } from '@/app/config/accountSession'

export const accountQueryKeys = {
  all: ['storefrontAccount'] as const,
  profile: (customerId: string | null) =>
    [...accountQueryKeys.all, 'profile', customerId] as const,
  orders: (customerId: string | null) =>
    [...accountQueryKeys.all, 'orders', customerId] as const,
  order: (customerId: string | null, orderId: string) =>
    [...accountQueryKeys.all, 'order', customerId, orderId] as const,
}

export function orderStatusLabel(status: Order['status']): string {
  const labels: Record<Order['status'], string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return labels[status]
}

export function orderPaymentLabel(method: Order['paymentMethod']): string {
  switch (method) {
    case 'cashOnDelivery':
      return 'Cash on delivery'
    case 'whishMoney':
      return 'Whish Money'
    case 'card':
      return 'Card'
    default: {
      const _e: never = method
      return _e
    }
  }
}

export function formatOrderMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-LB', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const signUpSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      })
    }
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

export function sanitizeInternalRedirect(raw: string | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/account'
  return raw
}

interface StorefrontAccountSessionState {
  customerId: string | null
  setCustomerId: (id: string | null) => void
  logout: () => void
}

export const useStorefrontAccountSession = create<StorefrontAccountSessionState>((set) => ({
  customerId: null,
  setCustomerId: (customerId) => {
    setSessionCustomerId(customerId)
    set({ customerId })
  },
  logout: () => {
    setSessionCustomerId(null)
    set({ customerId: null })
  },
}))

export function useOrdersQuery() {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useQuery({
    queryKey: accountQueryKeys.orders(customerId),
    queryFn: async () => {
      const { runtimeClients } = await import('@/app/config/runtime')
      return runtimeClients.account.listOrders()
    },
    enabled: Boolean(customerId),
  })
}

export function useOrderDetailQuery(orderId: string) {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useQuery({
    queryKey: accountQueryKeys.order(customerId, orderId),
    queryFn: async () => {
      const { runtimeClients } = await import('@/app/config/runtime')
      return runtimeClients.account.getOrderById(orderId)
    },
    enabled: Boolean(customerId) && Boolean(orderId),
  })
}

export function useDemoSignInMutation() {
  const qc = useQueryClient()
  const setCustomerId = useStorefrontAccountSession((s) => s.setCustomerId)
  return useMutation({
    mutationFn: async (vars: { email: string; password: string }) =>
      mockAccountSignIn(vars.email, vars.password),
    onSuccess: (c) => {
      setCustomerId(c.id)
      void qc.invalidateQueries({ queryKey: accountQueryKeys.all })
    },
  })
}

export function useDemoSignUpMutation() {
  const qc = useQueryClient()
  const setCustomerId = useStorefrontAccountSession((s) => s.setCustomerId)
  return useMutation({
    mutationFn: async (vars: {
      email: string
      password: string
      firstName: string
      lastName: string
    }) => mockAccountSignUp(vars),
    onSuccess: (c) => {
      setCustomerId(c.id)
      void qc.invalidateQueries({ queryKey: accountQueryKeys.all })
    },
  })
}

export function useDemoForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (vars: { email: string }) => {
      mockAccountForgotPassword(vars.email)
    },
  })
}

export function useSignInForm() {
  return useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })
}

export function useSignUpForm() {
  return useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })
}

export function useForgotPasswordForm() {
  return useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })
}

const addressRowSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  name: z.string().optional(),
  line1: z.string().min(1, 'Street address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
})

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
})

export const addressesFormSchema = z.object({
  addresses: z.array(addressRowSchema).min(1, 'Add at least one address'),
})

export function useHydrateStorefrontAccountSession() {
  const setCustomerId = useStorefrontAccountSession((s) => s.setCustomerId)
  useLayoutEffect(() => {
    const id = getSessionCustomerId()
    if (id) setCustomerId(id)
  }, [setCustomerId])
}

export function useCustomerProfileQuery() {
  const customerId = useStorefrontAccountSession((s) => s.customerId)
  return useQuery({
    queryKey: accountQueryKeys.profile(customerId),
    queryFn: async () => {
      const { runtimeClients } = await import('@/app/config/runtime')
      return runtimeClients.account.getCustomerProfile()
    },
    enabled: Boolean(customerId),
  })
}

export function useUpdateCustomerProfileMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CustomerProfileUpdate) => {
      const { runtimeClients } = await import('@/app/config/runtime')
      return runtimeClients.account.updateCustomerProfile(input)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountQueryKeys.all })
    },
  })
}

export function usePersonalInfoForm(customer: Customer | undefined) {
  const form = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: { firstName: '', lastName: '', phone: '' },
  })
  useEffect(() => {
    if (!customer) return
    form.reset({
      firstName: customer.firstName ?? '',
      lastName: customer.lastName ?? '',
      phone: customer.phone ?? '',
    })
  }, [customer?.id, customer?.firstName, customer?.lastName, customer?.phone, form])
  return form
}

export function useAddressesForm(customer: Customer | undefined) {
  const form = useForm({
    resolver: zodResolver(addressesFormSchema),
    defaultValues: { addresses: [] as Address[] },
  })
  useEffect(() => {
    if (!customer) return
    if (!customer.addresses.length) {
      form.reset({
        addresses: [
          {
            id: `addr-new-${Math.random().toString(36).slice(2, 9)}`,
            line1: '',
            city: '',
            country: 'Lebanon',
          },
        ],
      })
      return
    }
    form.reset({
      addresses: customer.addresses.map((a) => ({ ...a })),
    })
  }, [customer?.id, customer?.addresses, form])
  return form
}
