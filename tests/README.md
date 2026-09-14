# Verification layers

- Workspace unit/contract tests: `npm test`.
- Migration guard tests: `node --test scripts/checks/migration-guards.test.mjs`.
- SQL tenant isolation: `make db-test` after local database initialization/migration.
- Backup script guard tests: `python3 -m unittest discover -s scripts/backup -p 'test_*.py' -v`.
- Terraform schema and mock plan tests: `make infra-check`.
- CI builds all three containers without pushing images.

Integration and evaluation folders document their scope. Passing scaffold tests
does not verify a recruitment workflow, policy legality, cloud deployment or
production recovery. Record actual runs in docs/reference/verification.md.
