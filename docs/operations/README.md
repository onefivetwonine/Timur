# Operations

Status: repository foundation; no cloud resources, scheduled jobs, alerts, on-call roster or recovery guarantees are established by these documents.

- [Backup and recovery](backup-and-recovery.md): policy proposals, local commands, Azure recovery, deletion reconciliation.
- [Incident response](incident-response.md): severity, containment, evidence and communication.
- [Deployments and rollback](deployment-and-rollback.md): migrations, revisions and rollback gates.
- [Launch checklist](launch-checklist.md): separate POC and production release evidence.
- [Access and retention](../security/access-and-retention.md): identity lifecycle, tenant boundaries, evidence handling.
- [Monitoring specification](../../ops/monitoring/README.md): proposed indicators and manual verification.

Accountable roles until named: platform owner owns infrastructure and recovery; application owner owns data correctness and deployment; data steward owns permission, retention and deletion reconciliation; incident commander owns coordination. One person may cover POC roles. Production requires named primary and backup owners recorded in `ops/inventory/owners.example.yaml` outside public contact channels.
