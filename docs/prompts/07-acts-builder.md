# Prompt 07 — Implement configurable Acts Builder

```txt
Before coding, read AGENTS.md, docs/features/acts-builder.md, docs/features/drops-cms.md, docs/design-system.md.

Task: Implement the landing Acts Builder inside the Drop Editor.

Requirements:
- Admin can add, remove, reorder, enable/disable acts.
- Each act has a nature selector.
- Each nature exposes suitable layout presets.
- Each act supports title, subtitle, eyebrow, body, media, animation config.
- Nature-specific fields:
  - hero: CTA, countdown, background media, emblem/watermark.
  - manifesto/storytelling: story text/chapter fields.
  - dropReveal: release date, CTA, drop visuals.
  - productShowcase: select products from the drop/global list.
  - materialShowcase: material, GSM, composition, fit/construction notes.
  - specialEvent: date/time/location/link/CTA/rules.
  - lookbook: gallery images/videos/captions.
  - newsletterWaitlist: form copy, preferred product options, consent copy.
  - finalCTA: CTA title/body/buttons/background.
- Use schema validation per nature.
- Keep editor UX simple; avoid cramped mega forms.

Do not implement final cinematic renderers in this task unless simple placeholders are needed.
Update docs/changelog.md and docs/features/acts-builder.md if model changes.
```
