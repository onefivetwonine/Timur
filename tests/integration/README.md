# Integration scope

Current executable SQL assertions live in `database/tests/tenant-isolation.sql`.
CI runs migrations against an ephemeral PostgreSQL16 service and exercises those
assertions under the non-owner application role. Backups are restored into a new
database and compared to the source where PostgreSQL clients are available.

`python3 tests/integration/verify-database.py` creates a temporary local cluster,
applies and reapplies migrations, checks drift rejection, exercises RLS and invokes
`restore-roundtrip.py`. Add PostgreSQL16 server/client tools to PATH first.
The real restore reconstructs grants from the controlled access file because
logical backups intentionally omit permissions.

Future integration suites should exercise ingestion/quarantine, purpose-scoped
authority, tenant-negative retrieval, retry/idempotency, deletion and recovery.
Do not replace those tests with mocks when claiming service acceptance.
