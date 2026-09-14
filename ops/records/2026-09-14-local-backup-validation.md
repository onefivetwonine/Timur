# Local POC backup validation — 2026-09-14

Status: actual synthetic PostgreSQL backup/restore smoke passed. This supersedes the missing-client limitation in the [previous record](2026-09-13-local-backup-validation.md). It is not a production disaster-recovery drill or a complete application recovery test.

## Toolchain and scope

Downloaded PostgreSQL 16.14 source from the [official PostgreSQL release directory](https://ftp.postgresql.org/pub/source/v16.14/) and verified the archive against that directory's SHA-256 file. Built with `--prefix=/tmp/timur-pg --without-readline --without-icu`, then installed only into that temporary prefix; no system installation or cloud resources were used.

The reproducible script `scripts/backup/verify-local-postgres.py` creates its own private temporary cluster with a generated password, SCRAM authentication, a loopback listener and two synthetic rows. It executes the repository backup and restore scripts against that cluster and stops the server in cleanup. The initial sandbox run could not create a loopback socket; rerunning the exact test with approved sandbox escalation succeeded.

```bash
PATH=/tmp/timur-pg/bin:$PATH python3 scripts/backup/verify-local-postgres.py
python3 -m unittest discover -s scripts/backup -p 'test_*.py' -v
bash -n scripts/backup/poc-postgres.sh scripts/restore/poc-postgres.sh
```

## Observed results

- Actual custom-format PostgreSQL archive created and restored into a fresh `timur_restore_actual_drill` database.
- Both synthetic records, including their distinct tenant labels and evidence strings, matched the original query exactly.
- A second restore into the same target failed, with its existing rows unchanged.
- Deliberately modifying the archive caused checksum validation to fail before the alternate target database was created.
- Original archive bytes restored after the deliberate corruption test; isolated PostgreSQL server stopped.
- Reported backup/restore interval: **0.079 seconds**, for this two-row fixture on this machine only. This excludes full disaster recovery and establishes no RPO/RTO commitment.
- All six mocked safety/failure-path tests passed; shell syntax validation passed.

Private temporary diagnostic directory for this execution: `/tmp/timur-backup-verification-7ldwyorq`. These files are ephemeral, not a durable backup or an artifact assumed to survive another session.

## Remaining validation

The fixture demonstrates database archive recovery and script guardrails. It does not validate application migrations, authorization enforcement, deleted-record suppression, source/blob restoration, audit continuity, real workload scale, Azure PITR, regional recovery or production operating targets. Complete the full [restore drill record](../drills/restore-record.template.md) once those systems exist. Distinct tenant labels in fixture rows do not constitute a tenant-isolation test.
