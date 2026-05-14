# Prompt 04 — Refactor public layout and active drop theme provider

```txt
Before coding, read AGENTS.md, docs/design-system.md, docs/features/drops-cms.md, docs/architecture.md.

Task: Refactor the public website layout to use an ActiveDropThemeProvider.

Requirements:
- Fetch/load active drop through the runtime CMS client.
- Apply active drop theme using CSS variables.
- Keep official ANVL header/footer logo unchanged.
- Header/footer should consume site settings for nav/socials later, but maintain current visuals now.
- Avoid hydration mismatch.
- Mobile-first layout must remain fast.
- Desktop/tablet can preserve premium effects.

Deliver:
- Theme provider.
- CSS variable mapping.
- Public layout integration.
- Safe fallback if no active drop exists.

Update docs/changelog.md and docs/design-system.md if needed.
```
