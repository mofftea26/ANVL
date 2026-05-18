/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
  /** Local CMS demo login — bundled client-side; dev/demo only. */
  readonly VITE_ANVL_ADMIN_USERNAME?: string
  readonly VITE_ANVL_ADMIN_PASSWORD?: string
  /** When `"true"`, non-Lebanon shipping shows card (mock) checkout in the storefront. */
  readonly VITE_ANVL_INTERNATIONAL_CHECKOUT?: string
}
