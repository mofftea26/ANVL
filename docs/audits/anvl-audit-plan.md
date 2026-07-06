# ANVL Full-Platform Audit — Plan & Execution Record

Formalized record of the audit plan approved 2026-07-05 and its execution across Phases 0-14. This is the "how we got here" document — findings live in the sibling `anvl-*.md` docs; this one tracks methodology and phase completion.

## Trigger

A reported CMS bug — `.glb` uploads failing with `415 invalid_mime_type: application/octet-stream is not supported` — prompted a full-platform audit request covering storefront, CMS, Supabase, Shopify, GSAP/Three.js, security, performance, and cleanup.

## Methodology

- **Live inspection over docs:** the repo already had a mature, closed audit program (`docs/audit-2026-05-17.md`) — this audit verified current state against the live repo and live Supabase project (`ANVL`, `cptebkgyrfmokklwtrgp`) rather than trusting prior documentation, and found several places where reality had drifted from — or simply extended beyond — what was documented (new SEC-21/22 findings, confirmed-still-open MAINT-02).
- **Tools used:** Supabase MCP (`list_tables`, `get_advisors`, `execute_sql` read-only, `list_migrations`, `list_extensions`, `list_edge_functions`, `get_edge_function`), the Supabase CLI (one destructive action, user-approved: Edge Function deletion), repo-wide grep/read, three parallel Explore sub-agents per phase batch for independent-topic investigation, and live browser preview tooling for storefront functional/responsive/memory checks.
- **What wasn't available:** admin login credentials (constrained Phase 3 to code-level review), and the preview browser session was consistently backgrounded/hidden (`document.hidden === true`), which affected anything relying on `requestAnimationFrame` or genuine cross-origin navigation — both explicitly called out where they mattered (see `anvl-test-matrix.md`'s manual QA checklist).
- **Continuing, not replacing, existing conventions:** all findings use the existing `SEC-xx`/`PERF-xx`/`MAINT-xx` ID scheme from `docs/audit-2026-05-17.md`, extended with new `GLB-xx`/`FUNC-xx`/`CLEAN-xx` prefixes only where no existing prefix fit.

## Phase completion record

| Phase | Scope | Status | Key output |
|---|---|---|---|
| 0 | Quick, verified, low-risk fixes (GLB bug, draft-content RLS exposure, stray grant, dead Edge Function) | Done | `docs/changelog.md` 2026-07-05 entries |
| 1 | Architecture & codebase mapping | Done | `anvl-system-map.md` |
| 2 | Storefront functional audit | Done | Found + fixed FUNC-01 (account redirect gate); cart pluralization fix |
| 3 | CMS audit (code-level, no live credentials) | Done | Findings folded into `anvl-issue-register.md` |
| 4 | Supabase database & security audit | Done | `anvl-database-audit.md`, `anvl-security-audit.md` |
| 5 | GLB upload remediation + hardening | Done | `anvl-storage-and-glb-audit.md`; added client-side upload validation |
| 6 | API, caching, query audit | Done | REU-14 confirmed; no N+1/race issues found |
| 7 | React/hooks/reusability audit | Done | Clean — no Rules-of-Hooks violations, minor stylistic notes only |
| 8 | Performance & memory profiling | Done | `anvl-performance-audit.md` — measured 274 kB gzip main chunk |
| 9 | GSAP & Three.js deep pass | Done | Live 16-cycle navigation test: stable canvas count, no leak signal |
| 10 | Responsive & accessibility audit | Done | No horizontal overflow at 375/820/1920px; touch targets verified |
| 11 | Testing & observability plan | Done | `anvl-test-matrix.md` |
| 12 | Cleanup verification | Done | `anvl-cleanup-register.md` |
| 13 | Remediation roadmap | Done | `anvl-remediation-roadmap.md`, `anvl-issue-register.md` |
| 14 | Final regression & release validation | Done | See below |

## Phase 14 — final validation

- `pnpm verify` (typecheck + full test suite + build) green at every checkpoint throughout the audit, and again at close.
- Supabase security + performance advisors re-run after all migrations; both fixed items (SEC-21, SEC-22) confirmed clear, no new issues introduced.
- `docs/changelog.md`, `docs/technical-debt.md`, and `docs/audit-2026-05-17.md`'s finding index updated in place — no parallel documentation system created.
- All new documents live under `docs/audits/` per the original plan's deliverables list.
