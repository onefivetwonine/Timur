# Backup, recovery and disaster recovery

All numbers below are proposed operating targets requiring owner approval, funding and measured recovery drills. A configuration or successful dump is not evidence of recoverability. Local POC scripts cover PostgreSQL only; they do not schedule backups or capture blobs, roles, secrets or cloud resources.

## Recovery policy proposal

| Environment / asset | Proposed protection | Proposed RPO / RTO | Validation |
| --- | --- | --- | --- |
| Local POC, synthetic PostgreSQL | Daily and before migrations: custom-format logical dump; retain 7 daily successful copies on encrypted local storage, one independent encrypted copy | 24 hours / 4 hours | Monthly fresh-database drill and before POC milestone |
| Azure POC PostgreSQL | Managed PITR, proposed 7 days; pre-migration logical export if required | 24 hours / 4 hours | Monthly isolated restore |
| Production PostgreSQL | Managed PITR, proposed 35 days, independent recovery access; long-term backups only if approved retention requires them | 15 minutes / 4 hours for server/data fault | Quarterly timed PITR and before launch |
| Production authorised source blobs | Versioning and soft delete, proposed 35 days; application evidence-version references | 24 hours / 8 hours | Quarterly version recovery and DB/blob reconciliation |
| POC synthetic blobs | Reproducible fixtures; snapshot non-reproducible work alongside DB | 24 hours / 4 hours | Verify fixture checksum and evidence references |
| Quarantine blobs | Separate container and restrictive identity; short retention proposed 7 days | No availability promise; re-ingest authorised original | Never promote restored quarantine without fresh scanning |
| Audit and deletion ledger | Restricted append path, independent current deletion ledger and retention-aware audit export | 15 minutes / 4 hours | Restore replay tests; no raw candidate documents in audit |
| Terraform state and configuration | Separate state account, environment keys, versioning and restricted recovery identity | Last approved apply / 4 hours | State version recovery and refreshed plan |
| Regional outage | Singapore-region design; second region and residency approval unresolved | No committed RPO/RTO | Tabletop, region capability and residency decision before claims |

Operational redundancy is not a backup and does not by itself recover accidental deletion or corrupt application writes. Track completion time, size, oldest recoverable point, checksum, storage access, drill outcomes and backup age. Page or notify based on the environment specification in `ops/monitoring/targets.yaml`. Never delete the last verified recovery point automatically. Retention automation remains to be implemented and reviewed.

## Local POC PostgreSQL backup

Prerequisites: matching PostgreSQL client major version, an existing synthetic `timur_poc` database, a loopback listener, least-privilege credentials and a protected password file (`chmod 600`). Use an encrypted local disk. These archives are not encrypted by the script. Do not use production data or tunnel a production server onto localhost; the local-host check is an accident guard, not environment attestation.

```bash
export TIMUR_ENVIRONMENT=poc
export PGHOST=127.0.0.1
export PGPORT=5432
export PGUSER=postgres
# Configure PGPASSFILE privately; do not put passwords into commands or Git.
./scripts/backup/poc-postgres.sh .local/backups
```

Record the printed directory in the drill record. The script validates the archive table of contents and creates a SHA-256 checksum, but does not restore the database. A checksum detects damage; it does not establish trusted provenance. Failed files and private diagnostic logs are retained for investigation. Do not copy `.partial` files as completed backups. Logical dumps omit server roles; provision destination roles from controlled infrastructure/application setup.

## Local isolated restore

Only restore archives produced by a trusted operator from a trusted source. PostgreSQL archives may execute SQL during restore. Inspect provenance separately from the checksum, use a local throwaway instance without cloud credentials or network access to production, and prefer a dedicated restore role. A local restore role must have permission to create a fresh database.

```bash
export TIMUR_ENVIRONMENT=poc
export TIMUR_TRUST_BACKUP=yes
./scripts/restore/poc-postgres.sh .local/backups/REPLACE_WITH_COMPLETED_DIRECTORY timur_restore_drill_20260913
```

The target must be new; the script never drops or cleans a database. Failed restore targets and logs remain isolated for diagnosis. After restore: verify expected migration version, representative counts, tenant isolation, evidence digests, no unauthorised candidate access and deterministic POC outputs. Replay deletion decisions as below. Capture duration and observations in `ops/drills/restore-record.template.md`. The operator may remove the explicitly named drill database only after evidence is retained; there is no automated destructive cleanup.

## Production PostgreSQL PITR

1. Declare incident; pause writes, ingestion and workers if consistency is at risk. Capture incident UTC, suspected corruption start, last good transaction and deployment digest. Prevent notification/integration side effects.
2. Confirm source environment, subscription, server resource ID, retention window, network configuration, available quota and earliest/latest restore points through Azure. Choose a UTC point before corruption, with business owner acceptance of subsequent lost writes.
3. Start Azure Flexible Server point-in-time restore to a **new server** with an unambiguous recovery name in isolated networking. Do not alter or delete the source server. Review the generated operation and cost before executing it.
4. Reapply destination identities, firewall/private DNS, connection security, parameters, monitoring and approved configuration; do not assume every surrounding resource was recovered. Keep application traffic and consumers disabled.
5. Validate migration compatibility, tenant permissions, row counts, audit continuity, outbox deduplication and evidence references. Reconcile deleted/revoked records with the current independent deletion ledger. Check external side effects already sent after the selected point.
6. Obtain incident commander's cutover decision based on evidence. Change the application's secret/configuration reference to the new endpoint, deploy an identified revision, run smoke checks, then gradually resume traffic and ingestion. Keep old server isolated for the investigation.
7. Import/reconcile the replacement with Terraform under the state-recovery procedure. Review a refreshed plan before apply so infrastructure does not recreate or delete the restored server. Record actual RPO/RTO and gaps.

Azure supports a 7–35 day operational backup retention window and restores to a new server. Engine/version and regional constraints apply; inspect current capabilities before a drill. [Microsoft PostgreSQL business continuity](https://learn.microsoft.com/en-us/azure/postgresql/backup-restore/concepts-business-continuity), [restore operation](https://learn.microsoft.com/en-us/azure/postgresql/backup-restore/how-to-restore-latest-restore-point).

## Blobs, queues and consistent recovery

Inventory every DB evidence reference by tenant, container, object key, version ID and digest. Select a compatible object version for the database restore point; restore first into an isolated recovery destination, verify its digest and access rights, and then approve promotion. Missing evidence remains explicitly unavailable; do not invent a replacement or silently produce confident rankings from incomplete evidence. Restore source and quarantine independently. Scan recovered quarantine afresh. Confirm retention/legal hold decisions before changing any versions.

Blob version recovery depends on versioning being enabled before the event. Block-blob PITR requires soft delete, change feed and versioning and has operation/account limitations; it is a separate capability, not implied by versioning. Review account support and impact before enabling or restoring a range. [Microsoft versioning guidance](https://learn.microsoft.com/en-us/azure/storage/blobs/versioning-enable), [block-blob PITR](https://learn.microsoft.com/en-us/azure/storage/blobs/point-in-time-restore-overview).

POC PostgreSQL outbox rows recover with the DB. Production Service Bus messages must be treated as delivery state, not the canonical evidence record. Rebuild intended work from persisted job/outbox state with stable idempotency keys; reconcile already-completed external actions before replay. Resume workers only after stale, revoked and duplicate work is suppressed.

## Prevent deletion resurrection

Maintain a minimal independent deletion/revocation ledger outside the database recovery blast radius, keyed to stable tenant and subject identifiers, with request time, decision, scope and completion markers. Protect and back up that ledger without storing deleted CV content. This is a required design/control, not yet implemented by the scaffold.

Before any recovered system serves traffic, replay all later deletions, permission withdrawals and retention expiries against restored DB rows, search/index caches, original blobs, versions, derived summaries and pending jobs. Verify negative access tests and capture completion evidence. Unexpired backups containing deleted data stay access restricted until approved expiry; no ordinary user access or alternate use. Legal hold conflicts require the data steward's recorded decision. If the current ledger is unavailable, keep recovery isolated.

## Other dependencies and recovery order

1. Recover access through tested emergency identities, then networking/DNS, state access and infrastructure definitions at a signed/reviewed commit.
2. Recover Terraform remote state from the correct account/container/environment key version under an exclusive maintenance window. Preserve current state, validate lineage/serial and use `terraform plan -refresh-only` for review; never blindly overwrite a state file or run force-unlock on an active apply.
3. Recover Key Vault/configuration through controlled identities. Recreate managed identities and role bindings as necessary; rotate credentials suspected compromised. Never store secret values in Git or this runbook. Test Key Vault deletion/purge protections independently.
4. Restore canonical data and blob evidence; reconcile current deletion ledger and audit continuity.
5. Recover applications from recorded immutable image digests and migrations, then caches, queues and workers. Keep outbound side effects disabled until reconciled.
6. Complete user-facing smoke tests, reopen gradually and record measured recovery results.

A geographically independent backup requires explicit data-residency, cost, key-access and retention decisions. No regional recovery capability is claimed here.

## Reproducible local script verification

With PostgreSQL server and client binaries available on PATH, run `python3 scripts/backup/verify-local-postgres.py` as an unprivileged local user. It creates a separate password-protected temporary cluster on loopback port 55439 (override with `TIMUR_TEST_PGPORT`), exercises backup/restore against two synthetic rows, rejects an existing target and a corrupted archive, and stops its server. It retains private diagnostic files in the printed temporary directory. A sandbox may require explicit permission to bind a local listening socket. This smoke does not implement or verify the full application recovery checklist.

The [2026-09-14 execution record](../../ops/records/2026-09-14-local-backup-validation.md) records an actual PostgreSQL 16.14 pass; follow its limitations when reporting readiness.
