-- Talent domain persistence for manual POC intake and future enrichment.
-- Application validates draft contracts; this migration stores tenant-scoped rows.
-- Storage URIs point at local/.local or future blob keys — no binary payloads in SQL.

CREATE TABLE timur.employers (
  tenant_id text NOT NULL REFERENCES timur.tenants(tenant_id),
  employer_id text NOT NULL,
  legal_name text,
  uen text,
  sector text,
  legal_name_attested boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, employer_id),
  CHECK (length(trim(employer_id)) > 0)
);
CREATE INDEX employers_uen ON timur.employers (tenant_id, uen) WHERE uen IS NOT NULL;

CREATE TABLE timur.subjects (
  tenant_id text NOT NULL REFERENCES timur.tenants(tenant_id),
  subject_id text NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, subject_id),
  CHECK (length(trim(subject_id)) > 0)
);

-- Maps a subject to an external provider identity (Crustdata, PDL, LinkedIn URL, etc.).
CREATE TABLE timur.subject_external_ids (
  tenant_id text NOT NULL,
  subject_id text NOT NULL,
  provider text NOT NULL CHECK (length(trim(provider)) > 0),
  external_id text NOT NULL CHECK (length(trim(external_id)) > 0),
  profile_url text,
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, provider, external_id),
  FOREIGN KEY (tenant_id, subject_id) REFERENCES timur.subjects(tenant_id, subject_id)
);
CREATE INDEX subject_external_by_subject ON timur.subject_external_ids (tenant_id, subject_id);

CREATE TABLE timur.authority_grants (
  tenant_id text NOT NULL REFERENCES timur.tenants(tenant_id),
  grant_id text NOT NULL,
  purpose text NOT NULL CHECK (length(trim(purpose)) > 0),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked', 'draft')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, grant_id),
  CHECK (length(trim(grant_id)) > 0)
);

-- Manual CV uploads and enrichment snapshots: metadata only; bytes live outside SQL.
CREATE TABLE timur.source_artefacts (
  tenant_id text NOT NULL REFERENCES timur.tenants(tenant_id),
  artefact_id text NOT NULL,
  subject_id text,
  kind text NOT NULL
    CHECK (kind IN ('cv_upload', 'manual_note', 'enrichment_snapshot', 'role_brief', 'other')),
  provider text NOT NULL DEFAULT 'manual' CHECK (length(trim(provider)) > 0),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  storage_uri text NOT NULL CHECK (length(trim(storage_uri)) > 0),
  mime_type text,
  original_filename text,
  status text NOT NULL DEFAULT 'quarantine'
    CHECK (status IN ('quarantine', 'accepted', 'rejected', 'superseded')),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(metadata) = 'object'),
  PRIMARY KEY (tenant_id, artefact_id),
  CHECK (length(trim(artefact_id)) > 0),
  FOREIGN KEY (tenant_id, subject_id) REFERENCES timur.subjects(tenant_id, subject_id)
);
CREATE INDEX source_artefacts_subject ON timur.source_artefacts (tenant_id, subject_id)
  WHERE subject_id IS NOT NULL;
CREATE INDEX source_artefacts_quarantine ON timur.source_artefacts (tenant_id, uploaded_at)
  WHERE status = 'quarantine';

CREATE TABLE timur.evidence_claims (
  tenant_id text NOT NULL,
  claim_id text NOT NULL,
  subject_id text NOT NULL,
  predicate text NOT NULL CHECK (predicate ~ '^[a-z][a-z0-9_.-]+$'),
  value jsonb NOT NULL,
  source_artefact_id text NOT NULL,
  artefact_hash text NOT NULL CHECK (artefact_hash ~ '^[a-f0-9]{64}$'),
  locator jsonb NOT NULL CHECK (jsonb_typeof(locator) = 'object'),
  observed_at timestamptz NOT NULL,
  valid_from date,
  valid_to date,
  verification_state text NOT NULL
    CHECK (verification_state IN (
      'extracted', 'recruiter_confirmed', 'candidate_confirmed', 'externally_verified', 'rejected'
    )),
  confidence_band text NOT NULL
    CHECK (confidence_band IN ('strong', 'moderate', 'weak', 'unknown')),
  processing_authority_ref text NOT NULL,
  contradiction_refs text[] NOT NULL DEFAULT '{}',
  supersedes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, claim_id),
  CHECK (length(trim(claim_id)) > 0),
  FOREIGN KEY (tenant_id, subject_id) REFERENCES timur.subjects(tenant_id, subject_id),
  FOREIGN KEY (tenant_id, source_artefact_id)
    REFERENCES timur.source_artefacts(tenant_id, artefact_id),
  FOREIGN KEY (tenant_id, processing_authority_ref)
    REFERENCES timur.authority_grants(tenant_id, grant_id)
);
CREATE INDEX evidence_claims_subject ON timur.evidence_claims (tenant_id, subject_id, predicate);
CREATE INDEX evidence_claims_artefact ON timur.evidence_claims (tenant_id, source_artefact_id);

CREATE TABLE timur.opportunity_twins (
  tenant_id text NOT NULL,
  opportunity_id text NOT NULL,
  status text NOT NULL
    CHECK (status IN ('draft', 'calibrating', 'active', 'on_hold', 'closed', 'cancelled')),
  employer_id text NOT NULL,
  role_title text NOT NULL CHECK (length(trim(role_title)) > 0),
  role_family text NOT NULL CHECK (length(trim(role_family)) > 0),
  country text NOT NULL DEFAULT 'SG' CHECK (country = 'SG'),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, opportunity_id),
  CHECK (length(trim(opportunity_id)) > 0),
  FOREIGN KEY (tenant_id, employer_id) REFERENCES timur.employers(tenant_id, employer_id)
);
CREATE INDEX opportunity_twins_active ON timur.opportunity_twins (tenant_id, status, role_family);

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'employers', 'subjects', 'subject_external_ids', 'authority_grants',
    'source_artefacts', 'evidence_claims', 'opportunity_twins'
  ]
  LOOP
    EXECUTE format('ALTER TABLE timur.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE timur.%I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_scope ON timur.%I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      tbl
    );
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE ON
  timur.employers,
  timur.subjects,
  timur.subject_external_ids,
  timur.authority_grants,
  timur.source_artefacts,
  timur.evidence_claims,
  timur.opportunity_twins
TO timur_app;
