-- Internal persistence foundation. Product aggregates follow reviewed schemas later.
CREATE SCHEMA timur;
REVOKE ALL ON SCHEMA timur FROM PUBLIC;

CREATE TABLE timur.tenants (
  tenant_id text PRIMARY KEY CHECK (length(trim(tenant_id)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE timur.outbox (
  tenant_id text NOT NULL REFERENCES timur.tenants(tenant_id),
  event_id text NOT NULL,
  event_type text NOT NULL,
  aggregate_id text NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  processed_at timestamptz,
  PRIMARY KEY (tenant_id, event_id)
);
CREATE INDEX outbox_pending ON timur.outbox (tenant_id, available_at)
  WHERE processed_at IS NULL;

ALTER TABLE timur.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE timur.tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_scope ON timur.tenants
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
ALTER TABLE timur.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE timur.outbox FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_scope ON timur.outbox
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- Role created separately, with no ownership or BYPASSRLS privileges.
GRANT USAGE ON SCHEMA timur TO timur_app;
GRANT SELECT ON timur.tenants TO timur_app;
GRANT SELECT, INSERT, UPDATE ON timur.outbox TO timur_app;
