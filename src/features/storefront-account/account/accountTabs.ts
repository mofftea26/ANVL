export const ACCOUNT_TABS = ['personal', 'addresses', 'orders', 'settings'] as const
export type AccountTab = (typeof ACCOUNT_TABS)[number]
