\set ON_ERROR_STOP on
BEGIN;
INSERT INTO timur.tenants (tenant_id) VALUES ('synthetic-tenant-a'), ('synthetic-tenant-b');
INSERT INTO timur.outbox (tenant_id,event_id,event_type,aggregate_id,payload)
VALUES ('synthetic-tenant-a','a','SyntheticFixtureCreated','a','{}'),
       ('synthetic-tenant-b','b','SyntheticFixtureCreated','b','{}');
SET LOCAL ROLE timur_app;
DO $$ BEGIN
  IF (SELECT count(*) FROM timur.outbox) <> 0 THEN
    RAISE EXCEPTION 'Missing tenant context leaked rows';
  END IF;
END $$;
SELECT set_config('app.tenant_id', 'synthetic-tenant-a', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM timur.outbox) <> 1 THEN
    RAISE EXCEPTION 'Tenant query did not return exactly its row';
  END IF;
  IF EXISTS (SELECT 1 FROM timur.outbox WHERE tenant_id = 'synthetic-tenant-b') THEN
    RAISE EXCEPTION 'Cross tenant read succeeded';
  END IF;
  BEGIN
    INSERT INTO timur.outbox (tenant_id,event_id,event_type,aggregate_id,payload)
    VALUES ('synthetic-tenant-b','denied','SyntheticFixtureCreated','b','{}');
    RAISE EXCEPTION 'Cross tenant insert succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  UPDATE timur.outbox SET attempts = 1 WHERE tenant_id = 'synthetic-tenant-b';
  IF FOUND THEN RAISE EXCEPTION 'Cross tenant update succeeded'; END IF;
END $$;
ROLLBACK;
