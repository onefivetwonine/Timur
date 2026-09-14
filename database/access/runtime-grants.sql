-- Reapply after a --no-acl logical restore, using a trusted migration principal.
-- Role timur_app must already exist with no ownership, superuser or BYPASSRLS.
REVOKE ALL ON SCHEMA timur FROM PUBLIC;
GRANT USAGE ON SCHEMA timur TO timur_app;
GRANT SELECT ON timur.tenants TO timur_app;
GRANT SELECT, INSERT, UPDATE ON timur.outbox TO timur_app;
GRANT SELECT, INSERT, UPDATE ON
  timur.employers,
  timur.subjects,
  timur.subject_external_ids,
  timur.authority_grants,
  timur.source_artefacts,
  timur.evidence_claims,
  timur.opportunity_twins
TO timur_app;
