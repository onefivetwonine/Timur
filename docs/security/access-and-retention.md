# Access, secrets and information lifecycle

This is the baseline to implement and validate; it does not certify compliance or imply these controls already operate.

## Environment and identity boundaries

Use independent POC/production resources, deployment identities, databases, storage and remote state. Production credentials must never be present in local POC configuration. Prefer Azure managed identities for application-to-service access and federated short-lived identity for CI deployments. Restrict developer production access to named, time-bounded grants, audit elevation and test an independently controlled emergency route. Review grants quarterly and immediately on role change/departure.

Bind tenant identity from verified authentication, never solely from caller-submitted identifiers. Enforce tenant scope for relational queries, blob paths, jobs, audit reads and derived rankings. Test denied cross-tenant access. Separate read-only backup operators, restore operators, deployment identities and application roles where practical. Restores require elevated capabilities and isolated targets.

## Secrets and rotation

Keep values out of Git, logs, images, command arguments and incident records. Local environment files are ignored; use a protected password file for PostgreSQL clients. Production Key Vault holds required secrets; config records reference names/versions without values. Inventory each secret's owner, consumer, expiry and rotation procedure privately.

Proposed rotation: use short-lived workload credentials where supported; review remaining long-lived credentials at least every 90 days and rotate immediately after suspected disclosure. Introduce a new credential/version, validate consumers, switch references, revoke the previous credential and confirm old access fails. Plan rollback that does not resurrect a compromised credential. Key Vault recovery and emergency access need their own drill.

## Evidence and retention

Maintain separate authorised source and quarantine storage. Only scanned, permitted evidence enters the canonical pipeline. Store provenance, consent/authority, source time, tenant, object version/digest and retention class alongside evidence references. Unknown or revoked permissions block processing. Preserve source uncertainty and human accountability in outputs.

Retention periods in the backup runbook are operational proposals; a data steward must approve per-data-class periods before real candidate data enters production. Include canonical rows, source objects, prior object versions, quarantine, audit records, exports, backups, queues, model inputs/outputs and caches. Minimise personal content in audit records. Append-only audit access does not mean infinite retention or an implemented immutable storage guarantee.

Use a durable current deletion/revocation ledger to suppress recovered records before traffic resumes. Document legal holds, expiry jobs, failed deletions and verification evidence. Backups follow an approved restricted-access expiry policy; no restored copy may bypass a later deletion or permission withdrawal. See [recovery procedure](../operations/backup-and-recovery.md).

## Review gates

Before production: verify tenant isolation, authentication, migration privileges, upload limits/scanning, secret redaction, network exposure, dependency/container provenance and data deletion. Run a scoped security review when actual application behavior and deployment configuration exist. Track findings with an owner and remediation evidence; a checklist alone is not validation.
