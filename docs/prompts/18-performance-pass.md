# Prompt 18 — Performance and bundle optimization pass

```txt
Before coding, read AGENTS.md, docs/performance-accessibility-security.md, docs/architecture.md, docs/design-system.md.

Task: Perform a performance pass on the ANVL storefront and CMS.

Focus:
- Route-level code splitting.
- Lazy-load admin/CMS code away from public storefront.
- Lazy-load GSAP and heavy act renderers.
- Optimize images/videos loading behavior.
- Prevent hydration mismatches.
- Memoize expensive derived data.
- Ensure mobile avoids heavy animation.
- Add bundle analysis script if missing.

Do not rewrite UI unless necessary for performance.
Update docs/changelog.md and docs/technical-debt.md.
```
