/**
 * The id of the admin's single `<main>` landmark, in its own module so the
 * skip link (`AdminRootShell`) and the element it targets (`AdminShell`) cannot
 * drift apart — a skip link pointing at a stale id fails silently, and only for
 * the keyboard users who depend on it.
 *
 * Distinct from the storefront's `anvl-main`: the two shells never render
 * together (the `/admin` branch of `__root.tsx` returns before the storefront
 * chrome), but sharing one id across two layouts invites exactly the kind of
 * duplicate-landmark bug this replaced.
 */
export const ADMIN_MAIN_ID = 'anvl-admin-main'
