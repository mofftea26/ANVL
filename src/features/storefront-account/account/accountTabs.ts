export const ACCOUNT_TABS = ['personal', 'addresses', 'orders', 'armory', 'settings'] as const
export type AccountTab = (typeof ACCOUNT_TABS)[number]
