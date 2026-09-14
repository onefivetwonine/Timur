# Deployment and rollback

A release needs a commit, immutable image digest, configuration revision, migration identifiers, environment, owner and verification record. POC and production use independent resources, credentials, Terraform state and deployment identities; promote reviewed artifacts rather than copying POC data. Production activation remains a separately reviewed operational action.

## Before deployment

- Confirm correct environment/subscription and clean reviewed infrastructure plan. Record existing application revision, image digest and configuration references.
- Validate tests, container startup and migration compatibility against an isolated database. Confirm backup age and a previously verified recovery point.
- Use additive schema changes first, backfill idempotently, then switch application reads/writes. Remove obsolete schema only in a later release after the rollback window. Do not make an automatic down migration the recovery plan.
- Ensure application and worker versions can coexist and message schemas are compatible. Preserve idempotency keys and tenant context across versions.

## Rollout and rollback

Deploy a new Container Apps revision with controlled traffic and verify startup/readiness, representative authorised requests, denial of cross-tenant requests, outbox/job handling and error/latency indicators. Record the previous revision and compatible schema range. Advance traffic only with observed evidence; scale/health configuration must be verified in the target environment.

For an application regression, return traffic to the known-good revision and its approved configuration only if it remains compatible with the current schema and messages. Pause workers when replay or duplicate external effects are possible. Keep failed revision logs available. Do not blindly reverse migrations, restore an old database or reuse stale secrets. If schema/data are incompatible, apply a forward correction or use the isolated recovery runbook with a recorded data-loss decision.

Verify recovery with the same tenant and correctness checks; then reconcile deployment records and infrastructure state. Keep release evidence free of secrets and candidate content. Destructive production changes require a reviewed change record and a proven recovery path.
