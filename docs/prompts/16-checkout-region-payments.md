# Prompt 16 — Checkout region and payment logic

```txt
Before coding, read AGENTS.md, docs/features/auth-accounts-orders.md, docs/features/products-commerce.md, docs/performance-accessibility-security.md.

Task: Implement checkout region/payment method UI logic.

Requirements:
- Lebanon customers can choose Cash on Delivery or Whish Money.
- Outside Lebanon, show card payment only when international checkout is enabled.
- Guest checkout first.
- Capture shipping address, phone, delivery notes.
- Payment methods are selected through typed config, not hard-coded across components.
- Do not implement real payment processing yet; build the UI contracts and clear integration points.
- Validate forms and show clear errors.

Update docs/changelog.md.
```
