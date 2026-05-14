# Prompt 03 — Build runtime client interfaces and local adapters

```txt
Before coding, read AGENTS.md, docs/architecture.md, docs/backend-medusa-roadmap.md, docs/features/drops-cms.md, docs/features/products-commerce.md.

Task: Create runtime client interfaces and local/mock adapters so the app can later switch to a backend or Medusa without rewriting UI.

Implement:
- CmsClient interface
- CommerceClient interface
- SeoClient interface
- SiteSettingsClient interface
- runtimeClients factory
- localStorage adapter for client-side CMS editing
- seed/fallback adapter that is SSR safe

Rules:
- No direct localStorage access during SSR.
- Public route loaders should get safe seed data on server.
- CMS editor can hydrate from localStorage on client.
- Add clear TODO comments only where backend replacement will happen.

Do not refactor all UI yet; just create the data layer and demonstrate one small read function if needed.
Update docs/changelog.md.
```
