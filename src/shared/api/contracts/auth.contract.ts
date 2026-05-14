/**
 * Customer auth + account API contracts (implementation deferred).
 *
 * Medusa split: **Medusa Customer / auth** when integrated; **BFF** for region/consent rules.
 */

import type { CursorPaginatedResult, CursorPaginationQuery } from './common.types'

export const AUTH_API_PREFIX = '/api/auth' as const
export const ACCOUNT_API_PREFIX = '/api/account' as const

export type AuthRegisterBody = {
  email: string
  password: string
  firstName?: string
  lastName?: string
  acceptsMarketing?: boolean
}

export type AuthLoginBody = {
  email: string
  password: string
}

export type AuthRefreshBody = {
  refreshToken: string
}

export type AuthTokenPairResponse = {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export type AuthPasswordForgotBody = {
  email: string
}

export type AuthPasswordResetBody = {
  token: string
  newPassword: string
}

export type AccountAddress = {
  id: string
  firstName?: string
  lastName?: string
  company?: string
  address1: string
  address2?: string
  city: string
  province?: string
  postalCode?: string
  country: string
  phone?: string
  isDefaultShipping?: boolean
  isDefaultBilling?: boolean
}

export type AccountCustomerResponse = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  addresses: AccountAddress[]
}

export type AccountProfileUpdateBody = {
  firstName?: string
  lastName?: string
  phone?: string
}

export type AccountAddressCreateBody = Omit<AccountAddress, 'id'>

export type AccountAddressUpdateBody = Partial<Omit<AccountAddress, 'id'>>

export type AccountAddressListQuery = CursorPaginationQuery

export type AccountAddressListResponse = CursorPaginatedResult<AccountAddress>
