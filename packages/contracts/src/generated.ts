// Generated from the GitBook draft schemas. Run npm run contracts:generate.
/**
 * Purpose- and action-scoped processing, contact, representation or disclosure authority record.
 */
export interface AuthorityGrant {
  schema_version: "0.2.1";
  tenant_id: string;
  authority_id: string;
  subject_id: string;
  authority_type: "processing" | "contact" | "representation" | "disclosure" | "work_pass_transaction";
  purpose_code: string;
  basis_code: string;
  /**
   * @minItems 1
   */
  actions: [
    "collect" | "use" | "contact" | "represent" | "disclose" | "submit" | "transact" | "retain",
    ...("collect" | "use" | "contact" | "represent" | "disclose" | "submit" | "transact" | "retain")[]
  ];
  data_categories?: string[];
  employer_id?: string | null;
  employer_uen?: string | null;
  opportunity_id?: string | null;
  recipient_id?: string | null;
  channels?: ("email" | "phone" | "sms" | "messaging" | "in_app" | "other")[];
  evidence_ref: string;
  notice_version?: string | null;
  valid_from: string;
  valid_to?: string | null;
  status: "active" | "expired" | "withdrawn" | "revoked" | "superseded";
  withdrawn_at?: string | null;
  supersedes?: string | null;
  attested_by?: string | null;
  created_at?: string;
}

/**
 * Auditable candidate-opportunity assessment containing evidence, gates and the proposed human action.
 */
export interface DecisionEnvelope {
  schema_version: "0.2.1";
  tenant_id: string;
  decision_id: string;
  subject_id: string;
  opportunity_id: string;
  employer_id?: string | null;
  evidence_assessments: {
    dimension: string;
    assessment: "strong" | "moderate" | "weak" | "unknown";
    claim_refs: string[];
    contradiction_refs?: string[];
    explanation: string;
  }[];
  gates: {
    gate_code: string;
    gate_class: "processing_authority" | "eligibility" | "feasibility" | "action_authority" | "regulatory_timing";
    result: "pass" | "fail" | "unknown" | "not_applicable";
    rule_version: string;
    evidence_refs?: string[];
    explanation: string;
  }[];
  next_action: {
    action_code: string;
    authority_result: "permitted" | "blocked" | "requires_attestation" | "unknown";
    authority_ref?: string | null;
    explanation: string;
  };
  human_decision?: {
    actor_id?: string;
    decision_code?: string;
    reason_code?: string;
    recorded_at?: string;
  } | null;
  versions: {
    policy_pack: string;
    decision_policy: string;
    extractor?: string | null;
    embedding_model?: string | null;
    model_region?: string | null;
    deployment_type?: string | null;
    schema: string;
  };
  correlation_id?: string | null;
  created_at: string;
}

/**
 * Tenant-scoped append-only event envelope for auditable state changes.
 */
export interface DomainEvent {
  schema_version: "0.2.1";
  event_id: string;
  tenant_id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  aggregate_version: number;
  occurred_at: string;
  recorded_at?: string | null;
  actor: {
    type: "human" | "service" | "system";
    id: string;
  };
  correlation_id?: string | null;
  causation_id?: string | null;
  idempotency_key?: string | null;
  policy_version?: string | null;
  payload: {
    [k: string]: unknown;
  };
}

/**
 * Versioned assertion with resolvable provenance, verification and contradiction state.
 */
export interface EvidenceClaim {
  schema_version: "0.2.1";
  tenant_id: string;
  claim_id: string;
  subject_id: string;
  predicate: string;
  value: unknown;
  source: {
    source_id: string;
    artefact_hash: string;
    locator:
      | {
          type: "text_span";
          start: number;
          end: number;
        }
      | {
          type: "pdf_region";
          page: number;
          /**
           * @minItems 4
           * @maxItems 4
           */
          bbox?: [unknown, unknown, unknown, unknown] | null;
        }
      | {
          type: "record_path";
          record_id: string;
          path: string;
        }
      | {
          type: "spreadsheet_range";
          sheet: string;
          cell_range: string;
        };
  };
  observed_at: string;
  valid_from?: string | null;
  valid_to?: string | null;
  verification_state: "extracted" | "recruiter_confirmed" | "candidate_confirmed" | "externally_verified" | "rejected";
  confidence_method?: string | null;
  confidence_band: "strong" | "moderate" | "weak" | "unknown";
  contradiction_refs?: string[];
  processing_authority_ref: string;
  extractor?: {
    model_id?: string;
    model_version?: string;
    deployment_type?: string;
    region?: string;
    schema_version?: string;
  } | null;
  supersedes?: string | null;
}

/**
 * Recruiter-confirmed representation of an employer's actionable hiring requirement.
 */
export interface OpportunityTwin {
  schema_version: "0.2.1";
  tenant_id: string;
  opportunity_id: string;
  status: "draft" | "calibrating" | "active" | "on_hold" | "closed" | "cancelled";
  employer: {
    employer_id: string;
    legal_name?: string | null;
    uen?: string | null;
    legal_name_attested: boolean;
    sector?: string | null;
    financial_services?: boolean | null;
  };
  role: {
    title: string;
    role_family: string;
    country: "SG";
    work_location?: string | null;
    employment_type?: string | null;
    vacancy_count?: number | null;
  };
  salary?: {
    currency: "SGD";
    period: "month";
    minimum: number;
    maximum: number;
    fixed_monthly_salary?: number | null;
  } | null;
  requirements: {
    requirement_id: string;
    label: string;
    kind: "capability" | "certification" | "experience" | "location" | "availability" | "other";
    mandatory: boolean;
    evidence_rule: string;
    minimum_evidence_band?: "strong" | "moderate" | "weak" | "unknown";
  }[];
  pass_context?: {
    anticipated_pass_type?: "none" | "ep" | "s_pass" | "unknown";
    employer_quota_state?: "available" | "unavailable" | "unknown" | "not_applicable";
    policy_pack_version?: string;
  } | null;
  fcf?: {
    required?: boolean | null;
    exemption_code?: string | null;
    advertisement_id?: string | null;
    opened_at?: string | null;
    closed_at?: string | null;
    material_change_at?: string | null;
  } | null;
  confirmed_by?: string | null;
  created_at: string;
  updated_at: string;
}

