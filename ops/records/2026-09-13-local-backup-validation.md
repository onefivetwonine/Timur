# Local POC backup validation — 2026-09-13

Scope: local synthetic POC script guardrails. This is not a production disaster-recovery drill.

## Completed

`python3 -m unittest discover -s scripts/backup -p 'test_*.py' -v` passed six tests using fake PostgreSQL executables:

- Backup completion/checksum/private file mode and fresh-target restore command flow.
- Production environment and remote host rejection before database calls.
- Application database target and untrusted archive rejection.
- Altered archive checksum rejection before target creation.
- Failed database creation stops before restore and retains diagnostics.
- Failed dump is not marked complete and retains diagnostics.

`bash -n scripts/backup/poc-postgres.sh scripts/restore/poc-postgres.sh` passed. Scripts clear libpq service and host-address overrides before connecting.

## Not completed

A real PostgreSQL backup and restore was requested using the temporary embedded PostgreSQL 16 validation installation. Its binary directory contains `postgres`, `initdb` and `pg_ctl` only. Required `pg_dump`, `pg_restore` and `createdb` executables are absent from that installation and the host PATH. No real archive, restored rows, measured RPO/RTO or completed recovery drill is claimed.

Next step: provide matching PostgreSQL client tools, start an isolated synthetic `timur_poc` database, create representative fixtures, run both scripts, compare restored rows and execute tenant/deletion checks. Record this separately from the mocked guardrail tests. The application's database connectivity validation is a separate activity and does not establish backup recoverability.

Update: the missing-client limitation was resolved in a later session. See the [2026-09-14 actual local backup/restore validation](2026-09-14-local-backup-validation.md); the limitations and results above describe the original session only.
