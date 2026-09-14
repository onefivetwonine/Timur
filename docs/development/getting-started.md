# Getting started (local)

This page is for engineers working in the repository. Product design and purpose
live in the root [README](../../README.md).

Use Node 24, npm 11 or 12, Python 3, Docker Compose v2 and PostgreSQL 16 client
tools. Docker and PostgreSQL clients are needed for the database/backup commands,
not for package builds or unit tests. Terraform 1.7+ is needed for infrastructure
checks; CI uses 1.15.9. Local development is a POC profile, not a third environment.
Python remains only while legacy backup/check scripts exist; new product and ops
code follows [ADR 0002 language boundaries](../architecture/decisions/0002-language-boundaries.md).

```sh
make install
make check
make build
make poc-init       # generates private random credentials in ignored .local/
make poc-db         # starts only local PostgreSQL on loopback port 5432
make migrate        # applies versioned migrations with checksum checks
make db-test        # verifies missing-context and cross-tenant denial
make poc-up         # builds/starts API, informational web page and idle worker
```

Web: http://localhost:3000. API liveness: http://localhost:8000/health/live.
API readiness: http://localhost:8000/health/ready (database connectivity only).
There are no candidate upload, ranking, authentication or outreach endpoints.
`make poc-down` stops containers while preserving the database volume.
`make backup` creates a local PostgreSQL archive; see the recovery runbook before
restoring. Do not delete the volume to reset credentials: existing data needs its
original credentials or a controlled rotation.

For application development without Docker containers, first build runtime with
`npm run build -w @timur/runtime`, then load `.local/poc.env` in your local shell
and run `npm run dev:api`, `npm run dev:web` or `npm run dev:worker`. Without a
database, API liveness works and readiness reports unavailable.

## Repository map

| Directory | Purpose |
| --- | --- |
| `apps/web` | Next.js informational shell; environment banner |
| `apps/api` | HTTP health API; business modules are future work |
| `apps/worker` | Idle worker lifecycle; no jobs consumed yet |
| `packages/runtime` | Shared strict runtime configuration |
| `packages/contracts` | Five GitBook draft schemas, hashes, generated types, validation |
| `database` | Ordered migrations and tenant-isolation SQL checks |
| `config/environments` | POC/production intent and runtime examples |
| `infra/modules` | Reusable Azure platform resources |
| `infra/environments/poc` | Independent synthetic POC Terraform root |
| `infra/environments/production` | Independent production Terraform root |
| `infra/bootstrap/state` | Protected remote-state infrastructure |
| `scripts/dev` | Local credentials, database initialization and migrations |
| `scripts/backup`, `scripts/restore` | Local PostgreSQL archive and isolated restore |
| `scripts/checks` | Repository, migration guard and Terraform checks |
| `data/synthetic` | Explicitly synthetic contract fixtures |
| `tests` | Integration and evaluation boundaries |
| `docs/architecture`, `docs/plans` | Source authority, decisions, implementation roadmap |
| `docs/operations`, `docs/security` | Recovery, incidents, access and release procedures |
| `ops` | Monitoring targets, ownership inventory, drill/evidence templates |
| `.github` | CI, dependency updates and PR template |

## Further reading

- [Architecture and source authority](../architecture/baseline.md)
- [Data sources tracker](../architecture/data-sources.md)
- [Environment configuration](../../config/README.md)
- [Azure infrastructure and state setup](../../infra/README.md)
- [Backup and disaster recovery](../operations/backup-and-recovery.md)
- [Implementation roadmap](../plans/implementation-roadmap.md)
- [External data providers](../plans/data-source-providers.md)
- [Production launch checklist](../operations/launch-checklist.md)
- [Verification record](../reference/verification.md)

The two environments isolate infrastructure, identities, secrets and data. Promote
reviewed code and migrations between environments; never copy production data to
POC. GitBook remains the product authority. This repository records implementation
choices without silently closing its pending decisions.
