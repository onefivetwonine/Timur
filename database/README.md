# Database foundation

PostgreSQL 16 is shared by local POC and Azure templates. `migrations/` contains
ordered, immutable SQL migrations; `scripts/dev/migrate.mjs` records SHA-256 in
`public.timur_schema_migrations`, serializes migrations with an advisory lock,
and refuses changed or missing migration history. Each file runs transactionally.
Only local synthetic POC migration execution is enabled by that script.

`0001_foundation.sql` creates tenant and transactional outbox infrastructure.
It does not create candidate tables, implement ingestion, claim audit integrity,
or consume work. The worker is deliberately idle. Domain-event persistence and
each of the five product aggregates need a reviewed subsequent migration.

The application connects as `timur_app`, which owns no tables and has no
`BYPASSRLS`. A service must set `app.tenant_id` using `SET LOCAL`/`set_config` in
every transaction after resolving authenticated tenant membership. Never trust a
client-supplied tenant ID. Session-level settings may leak across pooled clients.
Database RLS is defense in depth: a compromised shared service role can choose a
tenant setting; it is not a replacement for application authorization.

Superuser/migration credentials bypass RLS and must never serve application
requests. Tenant creation belongs to a separately authorized provisioning path.
The migration grants no deletion permission to the runtime role; a future
controlled deletion worker requires distinct rights and audit evidence.

Local setup: `make poc-init`, `make poc-db`, `make migrate`. Use `make db-test`
to exercise missing-context denial and cross-tenant reads/writes in a rolled-back
transaction. PostgreSQL client tools are required for db-test and backup scripts.

For a complete isolated local integration run with PostgreSQL16 server/client tools
on PATH, run `python3 tests/integration/verify-database.py`. It creates and stops a
temporary cluster, verifies migration idempotency/drift rejection, checks RLS,
restores a real archive, reconstructs grants and reruns tenant checks. Private
diagnostic files remain under `/tmp`; no existing application database is used.

Logical backups omit ACLs. After an isolated restore, provision the runtime role
and apply `database/access/runtime-grants.sql` through a trusted migration
principal before testing application access. Restoring data alone does not restore
the access model. Native Azure PITR has different behavior; verify it separately.

Production migration execution needs private network access, Entra token
authentication and a separate migration principal. See infrastructure README and
the deployment runbook. Do not adapt the local password flow to production.
Before a production migration: restore rehearsal, lock/latency estimate, backwards
compatible expand/contract plan, and an identified last compatible image digest.
