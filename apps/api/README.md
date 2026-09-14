# API foundation

Node 24 HTTP service, default port 8000. Build `@timur/runtime` first, then run `npm run dev --workspace @timur/api` from the root with the environment variables loaded.

- `GET /health/live`: process liveness; no database dependency.
- `GET /health/ready`: PostgreSQL `SELECT 1`; returns 503 without a configured, reachable database. A successful result confirms foundation database connectivity only, not schema migration status, authentication or product readiness.
- Other routes return 404; non-GET methods return 405.

`DATABASE_URL` is a server-only secret. Use the local database for POC. Production database TLS must be enforced by its connection configuration and Azure server; never disable certificate verification. Health responses omit connection details and errors.

Authentication, authorization, migrations, tenant isolation and recruitment APIs have not been implemented. Do not add business routes before their security boundaries exist. Shutdown drains HTTP requests and closes database connections.
