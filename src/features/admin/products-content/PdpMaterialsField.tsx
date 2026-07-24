/**
 * Back-compat alias. The fabric-composition editor now lives in
 * `@/features/admin/components/MaterialsField` so the products PDP editor and
 * the passport content wizard share one implementation. Prefer importing
 * `MaterialsField` directly.
 */
export { MaterialsField as PdpMaterialsField } from '@/features/admin/components/MaterialsField'
