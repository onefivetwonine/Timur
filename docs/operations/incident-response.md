# Incident response

This is a procedure template, not a staffed response service. Populate named primary/backup owners, private contact routes and Azure support entitlement before production.

| Severity | Trigger | Proposed acknowledgement / updates |
| --- | --- | --- |
| SEV1 | Suspected cross-tenant access, exposed candidate evidence, destructive corruption, production unavailable | 15 minutes / every 30 minutes |
| SEV2 | Material degraded ranking/ingestion, rising queue age, recovery protection lost | 1 business hour / every 2 hours |
| SEV3 | Limited defect with workaround, POC-only incident | Next business day / daily |

1. Record UTC detection, environment, scope, symptoms and incident ID in the private incident record. Assign incident commander, technical lead and data steward. Preserve access and audit evidence without pasting CVs, credentials or personal data into tickets.
2. Confirm affected tenants and permission boundaries. Stop affected jobs or disable the specific ingress/identity; isolate suspected compromised revisions. Preserve logs and evidence before destructive changes when feasible. If tenant confidentiality is uncertain, restrict affected operations immediately.
3. Separate restoration from investigation. Choose rollback for compatible code faults, isolated data restore for corruption, or credential containment for access compromise. Link the applicable recovery/deployment runbook.
4. Maintain a factual event timeline and decision log. External messages need a designated human owner and verified impact. The data steward obtains applicable privacy/legal advice and records any notification decision and deadline; this scaffold makes no compliance determination.
5. Reopen only after correctness, tenant boundaries, deletion reconciliation and smoke checks pass. Monitor for recurrence, record actual impact and recovery times, then hold a blameless review within five business days.

Security incident additions: revoke compromised sessions/tokens, rotate credentials, review managed-identity grants and service principals, audit secret/version reads, inspect evidence access logs and verify persistence was removed. Never destroy suspicious artifacts merely to clear alerts. Establish bounded, approved retention for investigative copies.
