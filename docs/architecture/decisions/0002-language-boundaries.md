# ADR 0002: language boundaries for a durable codebase

Status: accepted for this repository; proposed for GitBook reconciliation.
Date: 2026-09-14. Authority: product owner direction to keep the stack
future-proof without breaking the working foundation.

## Decision

Timur keeps a **small intentional language set**. Do not collapse everything into
one language, and do not add languages without an ADR.

| Layer | Language | Rule |
| --- | --- | --- |
| Product apps and shared packages | **TypeScript** (strict) | Only language for `apps/*` and `packages/*`. Prefer TS for new HTTP clients, workers, providers and domain modules. |
| Database schema and policies | **SQL** (PostgreSQL / PLpgSQL as needed) | Ordered migrations, RLS, grants and SQL isolation tests stay SQL. Do not hide tenant policy behind an ORM-only story. |
| Azure platform | **HCL** (Terraform) | POC and production roots remain Terraform. Do not rewrite to CDKTF/Pulumi unless ops ownership explicitly changes. |
| Repo / ops automation | **TypeScript first** | New checks, loaders and provider tooling should be TS (or `tsx`-run TS). Existing Python may remain until touched. |
| Thin wrappers | **Bash** | Makefile targets and short glue only — no business logic. |

## Why

- One TypeScript monorepo already protects contract and runtime policy drift.
- PostgreSQL RLS and Azure Terraform are native concerns; translating them early
  adds risk without product value.
- Extra runtimes (Python, ad-hoc JS dialects) increase onboarding and CI surface.
  They are acceptable for proven scripts, not a second product stack.

## Non-goals (do not break)

- Do **not** rewrite working Python backup/restore or repository checks in the
  same change that only adopts this policy.
- Do **not** convert Terraform to TypeScript “for consistency.”
- Do **not** generate away SQL migrations or RLS for convenience.
- Do **not** introduce Go, Rust, Java, Kotlin or another app language for V0.1.

## Migration posture

When editing an existing Python or plain `.mjs` script for behaviour, prefer
moving that behaviour into TypeScript **if** tests and CI remain green and the
change stays scoped. Leave stable Python alone until there is a real reason to
touch it.

Plain `.mjs` under `scripts/` is treated as transitional Node; new scripts should
be TypeScript.

## Consequences

- Reviewers reject new product code outside TypeScript without an ADR.
- Infra PRs stay HCL; database PRs stay additive SQL.
- CI continues to need Node, Terraform, PostgreSQL client tools, and Python only
  while Python scripts remain.

Revisit if a measured operational constraint (for example an unavoidable vendor
SDK) requires an exception — record it in a follow-on ADR and GitBook.
