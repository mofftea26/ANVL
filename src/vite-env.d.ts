/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional override; defaults to `admin` when unset. */
  readonly VITE_ANVL_ADMIN_USERNAME?: string
  /** Required for admin sign-in in local builds. */
  readonly VITE_ANVL_ADMIN_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
