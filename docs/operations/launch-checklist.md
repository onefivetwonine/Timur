# Environment activation evidence

Unchecked means outstanding. A file, proposed setting or successful syntax check is not a completed operational control.

## POC activation

- [ ] Product owner records current GitBook scope and POC approval; all datasets are synthetic and deterministic outputs clearly identified.
- [ ] Local and cloud POC identities/resources are distinguished; no production credentials/data are available.
- [ ] Schema migrations and representative ingestion/evidence/tenant tests run against PostgreSQL.
- [ ] Database backup and fresh-target restore drill completed; record actual times and application verification.
- [ ] Blob fixture/source handling, quarantine rules and retention cleanup verified.
- [ ] Named POC owner, cost budget/alerts and resource teardown record agreed.
- [ ] Prototype limitations documented; scaffold health checks are not represented as product completion.

## Production activation

- [ ] Product scope, data-source permission and decision accountability approved.
- [ ] Separate subscription/resource boundaries, state backend, deployment identity and production approval policy configured.
- [ ] Authentication, tenant authorization, least privilege, private database access, managed identities and secret rotation tested.
- [ ] Migration, ingestion, deterministic replay and provider-neutral AI gateway policies tested with authorised representative data.
- [ ] POC AI mode cannot accidentally become a production decision path; provider failure and uncertain evidence produce explicit safe outcomes.
- [ ] Retention schedule, deletion ledger, audit access/retention and restored-data suppression implemented and tested.
- [ ] PostgreSQL PITR, source blob recovery, secret/config access and Terraform state drills recorded with actual RPO/RTO.
- [ ] Regional resilience and Singapore data-residency limitations accepted explicitly.
- [ ] Alerts provisioned with tested private notification routes and named primary/backup responders.
- [ ] Rollback tested against current schema; immutable image provenance and deployment evidence retained.
- [ ] External integrations and queue replay verified to prevent duplicate or unauthorised effects.
- [ ] Load/capacity/cost tests and service targets reviewed; customer-facing commitments match measured capability.
