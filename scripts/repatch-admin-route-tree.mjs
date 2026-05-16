/**
 * TanStack Router codegen in this repo does not always pick up new admin routes.
 * Re-apply `/admin/media` and `/admin/settings` after `vite build` regenerates routeTree.gen.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const target = join(root, 'src', 'routeTree.gen.ts')

let s = readFileSync(target, 'utf8')

if (s.includes('AdminMediaRouteImport')) {
  process.exit(0)
}

const importBlock =
  `import { Route as AdminSeoRouteImport } from './routes/admin/seo'
import { Route as AdminMediaRouteImport } from './routes/admin/media'
import { Route as AdminSettingsRouteImport } from './routes/admin/settings'
import { Route as AdminLoginRouteImport } from './routes/admin/login'`

if (!s.includes("import { Route as AdminSeoRouteImport } from './routes/admin/seo'")) {
  console.error('repatch-admin-route-tree: unexpected routeTree.gen.ts structure (imports)')
  process.exit(1)
}

s = s.replace(
  `import { Route as AdminSeoRouteImport } from './routes/admin/seo'
import { Route as AdminLoginRouteImport } from './routes/admin/login'`,
  importBlock,
)

const constBlock = `const AdminSeoRoute = AdminSeoRouteImport.update({
  id: '/seo',
  path: '/seo',
  getParentRoute: () => AdminRouteRoute,
} as any)
const AdminMediaRoute = AdminMediaRouteImport.update({
  id: '/media',
  path: '/media',
  getParentRoute: () => AdminRouteRoute,
} as any)
const AdminSettingsRoute = AdminSettingsRouteImport.update({
  id: '/settings',
  path: '/settings',
  getParentRoute: () => AdminRouteRoute,
} as any)
const AdminLoginRoute = AdminLoginRouteImport.update({`

if (!s.includes(`const AdminSeoRoute = AdminSeoRouteImport.update({`)) {
  console.error('repatch-admin-route-tree: unexpected routeTree.gen.ts structure (const AdminSeoRoute)')
  process.exit(1)
}

s = s.replace(
  `const AdminSeoRoute = AdminSeoRouteImport.update({
  id: '/seo',
  path: '/seo',
  getParentRoute: () => AdminRouteRoute,
} as any)
const AdminLoginRoute = AdminLoginRouteImport.update({`,
  constBlock,
)

const pathBlock = `    '/admin/seo': {
      id: '/admin/seo'
      path: '/seo'
      fullPath: '/admin/seo'
      preLoaderRoute: typeof AdminSeoRouteImport
      parentRoute: typeof AdminRouteRoute
    }
    '/admin/media': {
      id: '/admin/media'
      path: '/media'
      fullPath: '/admin/media'
      preLoaderRoute: typeof AdminMediaRouteImport
      parentRoute: typeof AdminRouteRoute
    }
    '/admin/settings': {
      id: '/admin/settings'
      path: '/settings'
      fullPath: '/admin/settings'
      preLoaderRoute: typeof AdminSettingsRouteImport
      parentRoute: typeof AdminRouteRoute
    }
    '/admin/login': {`

s = s.replace(
  `    '/admin/seo': {
      id: '/admin/seo'
      path: '/seo'
      fullPath: '/admin/seo'
      preLoaderRoute: typeof AdminSeoRouteImport
      parentRoute: typeof AdminRouteRoute
    }
    '/admin/login': {`,
  pathBlock,
)

const childrenIface = `interface AdminRouteRouteChildren {
  AdminLoginRoute: typeof AdminLoginRoute
  AdminMediaRoute: typeof AdminMediaRoute
  AdminSeoRoute: typeof AdminSeoRoute
  AdminSettingsRoute: typeof AdminSettingsRoute`

s = s.replace(
  `interface AdminRouteRouteChildren {
  AdminLoginRoute: typeof AdminLoginRoute
  AdminSeoRoute: typeof AdminSeoRoute`,
  childrenIface,
)

const childrenObj = `const AdminRouteRouteChildren: AdminRouteRouteChildren = {
  AdminLoginRoute: AdminLoginRoute,
  AdminMediaRoute: AdminMediaRoute,
  AdminSeoRoute: AdminSeoRoute,
  AdminSettingsRoute: AdminSettingsRoute,`

s = s.replace(
  `const AdminRouteRouteChildren: AdminRouteRouteChildren = {
  AdminLoginRoute: AdminLoginRoute,
  AdminSeoRoute: AdminSeoRoute,`,
  childrenObj,
)

const fullPathLines = `  '/admin/login': typeof AdminLoginRoute
  '/admin/media': typeof AdminMediaRoute
  '/admin/seo': typeof AdminSeoRoute
  '/admin/settings': typeof AdminSettingsRoute`

s = s.replace(
  `  '/admin/login': typeof AdminLoginRoute
  '/admin/seo': typeof AdminSeoRoute`,
  fullPathLines,
)

const unionLines = `    | '/admin/login'
    | '/admin/media'
    | '/admin/seo'
    | '/admin/settings'`

s = s.replace(
  `    | '/admin/login'
    | '/admin/seo'`,
  unionLines,
)

writeFileSync(target, s, 'utf8')
console.log('repatch-admin-route-tree: patched', target)
