# Foundation verification

Completed locally on 2026-09-14. Node 26.8.2 was installed on this machine; the
repository targets Node24 and CI/container configurations select Node24. This
local run does not establish that the remote CI or container builds have passed.

| Check | Result |
| --- | --- |
| `npm run check` | Pass: repository invariants, all workspace typechecks and 14 contract/runtime/API tests |
| `npm run build` | Pass: shared packages, API, worker and Next.js production build |
| `npm run test:runtime -w @timur/web` | Pass: same standalone build renders POC/production settings and exits on unsafe configuration |
| `node --test scripts/checks/migration-guards.test.mjs` | Pass: 5 checks reject production, remote host, query override, wrong database and malformed URL without leaking credentials |
| Python backup/restore unit suite | Pass: 6 failure-path and guard tests |
| `python3 scripts/backup/verify-local-postgres.py` with PG16 tools | Pass: actual two-row restore, existing-target protection, corruption rejection; server stopped |
| `python3 tests/integration/verify-database.py` with PG16 tools | Pass: migrations/reapplication, drift rejection, missing-context and cross-tenant denial, real logical restore, grant reconstruction and restored RLS checks; server stopped |
| Terraform validate | Pass: POC, production and state-bootstrap roots against locked AzureRM4.81.0 |
| Terraform native mock tests | Pass: both environments; isolation, private services, Entra auth, HA, retention and deletion protection |
| Terraform formatting | Pass: recursive infrastructure check |
| `actionlint .github/workflows/ci.yml` and shell syntax | Pass |
| Workspace lockfile consistency | Pass: dependency declarations match package-lock.json |
| Git ignore checks | Pass: local credentials, state, plans, real backend config, node_modules and build output ignored |

Some tests require loopback/IPC sockets or child processes disallowed by the
execution sandbox. Their successful runs used approved escalation. PostgreSQL
16.14 was built from verified official source into `/tmp/timur-pg`; this is a
temporary verification toolchain, not a system installation or project dependency.

See the [backup drill evidence](../../ops/records/2026-09-14-local-backup-validation.md)
for archive-specific results. The integrated database test additionally exercised
the actual schema and application-role policies after restoring and reconstructing
ACLs. It does not implement or test deletion-ledger replay or business workflows.

## Limits and handoff

- No Azure resources were applied and no cloud deployment/restore was attempted.
- Docker is absent locally. Dockerfiles received static review; Compose/container
  build jobs are defined in CI but have not run on a remote repository.
- The local Git repository is initialized on `main`; files are uncommitted and no
  remote has been configured or publication performed.
- Registry/workload deployments, Entra authentication, SQL token integration,
  scheduled/independent backups, alert routing and live-data acceptance are named
  next-stage work, not implemented operational claims.
- Production RPO/RTO/SLO targets remain proposed. Local tiny-fixture timings do
  not establish production recoverability, scale or compliance.
