# Shared contracts

The five `schemas/` files are byte-for-byte GitBook draft 0.2.1 assets retrieved
2026-09-13. `provenance.json` records their original URLs, identifiers and SHA-256.
The upstream `human-talent.example` IDs are preserved deliberately; they are
identifiers, not runtime network dependencies. No schema is fetched at runtime.

`npm run contracts:generate` generates TypeScript from those drafts. Runtime
validation uses JSON Schema 2020-12, checks timestamps, rejects unknown root
fields, and requires a matching nonempty caller-supplied tenant context.
Pass tenant context from authenticated server state, never directly from request
headers or query parameters without verification.

Shape validation is not permission evaluation. These drafts leave fields such as
claim values and event payloads open and omit some nonempty ID constraints.
Processing authority, grant validity, expiry, purpose, recipient, evidence
resolution, chronology and ranking allowlists need explicit domain rules before
business endpoints exist. Generated types cannot prove any of those controls.

Opportunity Twin describes a known employer-role requirement in Talent V0.1;
it does not implement the separate Opportunity H0.3 discovery hypothesis.
