# ANVL Website / CMS Project Overview

## Goal
Build a premium, mobile-first ANVL Athletics website with a CMS that lets the admin manage drop-based landing pages, products, SEO, brand/header/footer content, and future commerce integrations without touching code.

The website must feel premium and cinematic on desktop/tablet, but fast and frictionless on mobile.

## Main public pages
1. Landing page — driven by the active drop.
2. Active drop page — route/nav label changes based on the active drop, e.g. `The Oath`.
3. Shop page — all products, with filters/search.
4. Product details page.
5. Size Guide.
6. About Us.
7. Sign In / Sign Up.
8. Profile.
9. Orders.
10. Cart.
11. Checkout.
12. Legal pages: Privacy, Terms, Return Policy, Shipping Policy.

## CMS sections
1. Drops
2. Landing Page Act Builder
3. Products
4. Shop organization
5. SEO
6. Header/Footer/Navigation
7. Brand assets
8. Media library
9. Users/orders later, once backend exists
10. Payments/shipping settings later

## Core business behavior
- A drop can be draft, inactive, active, scheduled, or archived.
- Only one drop can be active at a time.
- Scheduled drops activate automatically when their release time arrives once backend jobs exist. In the frontend-only phase, scheduled activation can be simulated by date comparison.
- The active drop controls site-wide campaign theme colors and campaign visuals.
- The official ANVL logo in header/footer stays constant and does not change per drop.
- Drop products automatically appear in the global product list.
- Products can belong to a drop or be individual releases.
- Lebanon-first checkout: Lebanon supports cash on delivery and Whish Money. Outside Lebanon, card payment only when enabled.
