# Implementation roadmap

This is an engineering delivery plan, not a claim that all product features or
production controls exist. The initial user request is fulfilled by the repository
foundation. Subsequent stages turn it into a working Talent product and operated
service; each stage has concrete exit evidence.

| Stage | Deliverables | Exit evidence |
| --- | --- | --- |
| Foundation (this repository) | Workspace, service shells, imported schemas, environment roots, SQL infrastructure, CI, backup/incident plans | Package checks/builds; Terraform validation/mock tests; local database/restore evidence where tools permit |
| Synthetic Talent loop | Intake quarantine, parser adapter, claims, identity review, retrieval, gates, decision/audit; idempotent outbox consumer | A synthetic role completes the loop; missing authority cannot invoke an action; tenant-negative tests |
| Evaluation | Freeze role family, fixtures, adjudication and numeric acceptance thresholds with product owner | Reproducible baseline and holdout results; no ranking-quality claim before this |
| Azure POC deployment | State/OIDC, registry, digest-pinned workloads, internal DNS/access, Entra login, SQL managed-identity role/token refresh, minimal data roles | Reproducible deployment and authenticated synthetic smoke test, rollback and restore drill |
| Production operations | Private connected runner, capacity/cost review, alert routing, backup schedules, recovery access, incident/on-call ownership | Recovery and rollback drill meets accepted targets; alert reaches actual owner; supply-chain evidence |
| Controlled-data pilot | Operating entity, EA/DPO/KEO ownership, purpose/source rights, privacy/retention/deletion workflows, gateway profile if needed | Named acceptance record and end-to-end negative tests before personal data enters |
| Release | Defined SLOs, load/security acceptance, onboarding/offboarding, support, release decision | Signed launch checklist with evidence links and known risks |

## First domain modules

Add cohesive modules under `apps/api/src/modules/` as implemented: intake,
evidence, identity, role requirements, retrieval, gates, authority, decisions and
audit. Add adapters under the relevant module or shared package only when reused.
Do not create microservices or hypothetical connectors for empty interfaces.

Workers must persist job intent transactionally, claim work with concurrency
control, retry with bounded backoff, dead-letter poison work and deduplicate by
tenant/event. Production Service Bus transports commands; the canonical work
record must support replay after recovery. The current worker consumes nothing.

## Infrastructure and recovery backlog

- Pin immutable release images; add an image registry, SBOM/signature verification
  and Container Apps workload resources after identity contracts are implemented.
- Separate deploy, migration, runtime and recovery identities. Record OIDC trust
  subjects and private-runner connectivity; do not put credentials in source.
- Wire alerts from `ops/monitoring/targets.yaml` to named owners and exercise them.
- Accept RPO/RTO/retention with business and data owners. Implement scheduling,
  encryption and independent backup custody where required; protect the latest
  verified copy from automatic expiry.
- Implement an independent deletion/revocation ledger and recovery replay so
  restored backups cannot resurrect removed data or withdrawn action permissions.
- Rehearse PostgreSQL PITR, blob-version recovery, image rollback, failed migration,
  state recovery and lost-credential response in isolated targets.

Owners are role placeholders in `ops/inventory/owners.example.yaml`; assigning an
actual person and recording evidence is part of operational acceptance. Opportunity
H0.3, autonomous actions and live external connectors remain outside Talent V0.1.
