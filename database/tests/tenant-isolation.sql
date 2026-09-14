\set ON_ERROR_STOP on
BEGIN;
INSERT INTO timur.tenants (tenant_id) VALUES ('synthetic-tenant-a'), ('synthetic-tenant-b');
INSERT INTO timur.outbox (tenant_id,event_id,event_type,aggregate_id,payload)
VALUES ('synthetic-tenant-a','a','SyntheticFixtureCreated','a','{}'),
       ('synthetic-tenant-b','b','SyntheticFixtureCreated','b','{}');
INSERT INTO timur.subjects (tenant_id, subject_id, display_name)
VALUES ('synthetic-tenant-a', 'subj-a', 'Synthetic A'),
       ('synthetic-tenant-b', 'subj-b', 'Synthetic B');
INSERT INTO timur.source_artefacts (
  tenant_id, artefact_id, subject_id, kind, provider, content_sha256, storage_uri, status
) VALUES (
  'synthetic-tenant-a', 'art-a', 'subj-a', 'cv_upload', 'manual',
  repeat('a', 64), 'file:.local/uploads/synthetic-tenant-a/art-a/original', 'quarantine'
), (
  'synthetic-tenant-b', 'art-b', 'subj-b', 'cv_upload', 'manual',
  repeat('b', 64), 'file:.local/uploads/synthetic-tenant-b/art-b/original', 'quarantine'
);
SET LOCAL ROLE timur_app;
DO $$ BEGIN
  IF (SELECT count(*) FROM timur.outbox) <> 0 THEN
    RAISE EXCEPTION 'Missing tenant context leaked rows';
  END IF;
  IF (SELECT count(*) FROM timur.source_artefacts) <> 0 THEN
    RAISE EXCEPTION 'Missing tenant context leaked source artefacts';
  END IF;
END $$;
SELECT set_config('app.tenant_id', 'synthetic-tenant-a', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM timur.outbox) <> 1 THEN
    RAISE EXCEPTION 'Tenant query did not return exactly its row';
  END IF;
  IF (SELECT count(*) FROM timur.source_artefacts) <> 1 THEN
    RAISE EXCEPTION 'Tenant source artefact query incorrect';
  END IF;
  IF EXISTS (SELECT 1 FROM timur.outbox WHERE tenant_id = 'synthetic-tenant-b') THEN
    RAISE EXCEPTION 'Cross tenant read succeeded';
  END IF;
  IF EXISTS (SELECT 1 FROM timur.subjects WHERE tenant_id = 'synthetic-tenant-b') THEN
    RAISE EXCEPTION 'Cross tenant subject read succeeded';
  END IF;
  BEGIN
    INSERT INTO timur.outbox (tenant_id,event_id,event_type,aggregate_id,payload)
    VALUES ('synthetic-tenant-b','denied','SyntheticFixtureCreated','b','{}');
    RAISE EXCEPTION 'Cross tenant insert succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  UPDATE timur.outbox SET attempts = 1 WHERE tenant_id = 'synthetic-tenant-b';
  IF FOUND THEN RAISE EXCEPTION 'Cross tenant update succeeded'; END IF;
  UPDATE timur.source_artefacts SET status = 'accepted' WHERE tenant_id = 'synthetic-tenant-b';
  IF FOUND THEN RAISE EXCEPTION 'Cross tenant artefact update succeeded'; END IF;
END $$;
ROLLBACK;
