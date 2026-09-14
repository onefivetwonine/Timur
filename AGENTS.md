# Working on Timur

Read README.md and docs/architecture/baseline.md before changing architecture.
The user authorized the initial POC and production repository foundations on
2026-09-13. Routine local implementation, review and tests do not require another
permission request. Delegation is permitted for bounded independent work. Keep
edits scoped and report verification honestly.

## Product constraints

- Timur is Human Talent Decision Intelligence. Product V0.1 is Talent only.
- POC means synthetic records, deterministic AI, no outbound recruitment actions.
- Opportunity H0.3 is an uncommitted hypothesis, not a second V0.1 API.
- Preserve evidence provenance, unknowns, tenant scope and purpose/action authority.
- Never introduce fused match percentages or autonomous rejection/outreach.
- Production configuration is not evidence of live-data approval or production readiness.
- No raw candidate data, published demonstration credentials, secrets or Terraform
  state in source control. Do not send personal data to external models.

## Engineering

- One TypeScript monorepo; apps/web, apps/api, apps/worker share packages.
- Language boundaries: TypeScript for product code; SQL for schema/RLS; HCL for
  Azure Terraform; TypeScript-first for new ops tooling; Bash only for thin
  wrappers. See `docs/architecture/decisions/0002-language-boundaries.md`.
  Do not add languages or rewrite working Python/Terraform/SQL without cause.
- Azure and PostgreSQL remain the platform and system of record. Keep POC and
  production state, identities, storage, secrets and deployment targets separate.
- Schema assets imported from GitBook remain drafts; record source and hash.
  Do not silently replace them with inferred contracts.
- Tests must cover behavior and failure paths. Run npm run check and relevant
  infrastructure or operational checks. Document unavailable live validation.
- Database changes are ordered additive migrations, with rollback/recovery notes.
- Add proposed ADRs for material choices. This repository does not silently close
  GitBook decisions or invent approval evidence.
- Never run cloud apply/destroy, publish, or ingest live data merely to validate
  a scaffold. Follow the user's actual task authorization for external actions.
