# Architecture baseline

Repository foundation authorized by the user on 2026-09-13, continued 2026-09-14.
The instruction explicitly includes both POC and production structure, full
infrastructure folders and backup planning. It authorizes this local scaffold;
it does not assert that the GitBook owners signed its open product decisions or
that an operating environment has been approved for personal data.

## Source authority

Read against GitBook documentation D0.3.20 on 2026-09-13. The Working Architecture
Contract remains v0.2; D0.3.13 is a working POC-A overlay. Locked decisions, approved
ADRs, current policy packs and canonical schemas outrank working hypotheses and
archived material. The GitBook register is authoritative for its open decisions.

| Source | Position carried into this repository |
| --- | --- |
| [Overview](https://app.gitbook.com/s/FkviPqGRiQmXp5lCD9IA/timur-human-talent-decision-intelligence) | One product; Talent V0.1, Opportunity H0.3 hypothesis |
| [Locked decisions](https://app.gitbook.com/s/FkviPqGRiQmXp5lCD9IA/timur-human-talent-decision-intelligence/locked-decisions) | Singapore agency; authorized first-party history; PostgreSQL; Azure |
| [POC-A charter](https://app.gitbook.com/s/FkviPqGRiQmXp5lCD9IA/d0.3.13-poc-a-charter-and-independent-review-recommendations) | Synthetic, deterministic loop; no external model spend or actions |
| [Azure pilot](https://app.gitbook.com/s/FkviPqGRiQmXp5lCD9IA/architecture-overview/azure-pilot-architecture) | Modular API, asynchronous jobs, Blob, PostgreSQL, Entra |
| [Production boundary](https://app.gitbook.com/s/FkviPqGRiQmXp5lCD9IA/architecture-overview/production-shaped-azure-architecture) | Tenant isolation from the start; additions require an identified trigger |
| [Canonical schemas](https://app.gitbook.com/s/FkviPqGRiQmXp5lCD9IA/reference/canonical-schemas) | Import five drafts unchanged; generate shared types |
| [Pending register](https://app.gitbook.com/s/FkviPqGRiQmXp5lCD9IA/pending-items-work-in-progress-and-discussion-register) | Formal approvals, live-data controls and measured acceptance stay open |

Operational data-source strategy and provider tracker for this repository:
[Data sources](data-sources.md). Keep that page aligned with GitBook when the
product register accepts the same subsection.

## Implementation shape

One TypeScript monorepo reduces cross-language contract drift. Next.js serves the
web shell; a small Node HTTP API exposes health; an idle worker proves lifecycle
and shutdown behavior. The future API remains a modular monolith. Split domain
modules only as concrete workflows arrive; do not create dozens of empty services.

Shared JSON Schema validation is a boundary aid, not evidence verification or
authorization. A caller must derive tenant identity from authenticated membership.
Database application roles have no ownership/BYPASSRLS; tenant-sensitive tables
use row-level security and transaction-local context. SQL credentials and migrations
use separate principals. No candidate/business endpoint exists in this scaffold.

The five upstream schemas are draft version 0.2.1 with original placeholder `$id`
hosts preserved. Source hashes prevent silent editing. The `opportunity-twin`
schema is the known role requirement used by Talent, not Opportunity discovery.
Domain evaluation, authority expiry/purpose/recipient rules and deletion propagation
remain necessary before those schemas become executable product contracts.

## Two environments, one release lineage

| Concern | POC | Production foundation |
| --- | --- | --- |
| Data default | Synthetic only | Synthetic until controlled-data acceptance |
| Runtime provider | Deterministic; no external AI | Same safe default |
| Database | Local PG16 or dedicated Azure PG16 | Dedicated private Azure PG16 with HA |
| Jobs | Transactional PostgreSQL outbox target | Service Bus target; canonical work must remain replayable |
| Secrets | Local ignored generated values; cloud workload bindings later | Managed identities/Key Vault; SQL token integration later |
| State | Dedicated backend | Separate backend and deployment identity |
| Recovery | Local dump/isolated restore; Azure PITR | Azure PITR, object versions, controlled recovery plan |
| Access | Loopback local shell; internal Azure environment | Internal Azure environment pending authenticated access design |

Production templates include private data paths, HA and deletion protection as
conservative starting choices for the user's explicit second environment. Their
cost and operational implications require review at deployment. No claim is made
that those services are necessary for a zero-cost POC or already provisioned.
There is no WAF/APIM, Kubernetes, graph database, multi-cloud or live model setup.

## Build versus operate

Terraform creates platform foundations when explicitly applied: network, database,
objects, identities, monitoring workspace and Container Apps environment. It does
not currently create workload revisions, a registry, alert routing, Entra login,
SQL token refresh or an independent backup scheduler. Each is a named delivery
item in the roadmap. Native Azure retention settings are implemented; runbook
targets remain proposed until tested and accepted.

POC-A's Top 10/Best 5 acceptance shape and role family remain product decisions;
no ranking or quality claim is implemented here. Live-data gates are not a reason
to leave the local scaffold empty, and the scaffold is not a reason to skip them.
