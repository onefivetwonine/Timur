# Timur

**Human Talent Decision Intelligence** — a system that helps recruiters decide
who fits a hiring requirement, with evidence you can inspect, authority you can
enforce, and outcomes a human remains accountable for.

Timur is not an autonomous hiring bot. It does not invent a single match score,
reject candidates on its own, or reach out to people without an explicit grant
to act.

## What it is for

Talent V0.1 answers one operational question for a Singapore agency context:

> Given a confirmed role requirement, which people should a recruiter review
> next — and on what evidence, under what purpose, with what unknowns still open?

Typical use:

1. A recruiter confirms an **Opportunity Twin** — the employer’s actionable
   hiring requirement (role family, constraints, must-haves, location).
2. Evidence about people and experience enters as **claims** with provenance
   (CV text, attested history, third-party professional context), not as opaque
   embeddings alone.
3. The system retrieves and gates candidates under **authority** (who may
   process this data, for what purpose, until when).
4. A **decision envelope** records what was recommended, what was uncertain,
   and what a human decided — suitable for audit and later review.

Opportunity discovery (H0.3) is a separate product hypothesis. It is not part of
Talent V0.1.

## Design principles

| Principle | Meaning in Timur |
| --- | --- |
| Evidence over score fusion | Prefer inspectable claims and gates. No fused “match %” as the product truth. |
| Provenance is mandatory | Every assertion carries source, time, and verification state. Unknowns stay visible. |
| Tenant isolation from day one | Data and jobs are scoped by tenant; cross-tenant access is a defect. |
| Purpose and action authority | Processing and outreach require grants; missing authority blocks the action. |
| Human accountability | Recommendations assist; rejection and outreach remain human-controlled. |
| Synthetic before personal | POC defaults to synthetic, deterministic behaviour until controlled-data acceptance. |
| One product surface | Shared contracts and a modular API; infrastructure is Azure + PostgreSQL. |

## System shape

```text
                 ┌─────────────────────────────────────────┐
                 │              Talent V0.1                 │
  Recruiter UI ──┤  intake → evidence → identity → retrieve │
                 │       → gates → authority → decision     │
                 └───────────────┬─────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
        Opportunity         Evidence            Decision
        Twin (role)         Claims              Envelope
              │                  │                  │
              └────────────┬─────┴──────────────────┘
                           ▼
                 PostgreSQL (system of record)
                 + object storage (quarantine / source)
                 + async jobs (outbox → workers)
```

**Contracts** (draft, versioned) define the language of the product:

- **Opportunity Twin** — recruiter-confirmed role requirement
- **Evidence Claim** — versioned assertion with resolvable provenance
- **Authority Grant** — who may process or act, for what purpose
- **Decision Envelope** — recorded recommendation / human outcome
- **Domain Event** — durable facts for audit and replay

**Runtime posture:** deterministic processing in foundation mode; external AI and
outbound recruitment actions stay off until deliberately accepted. POC and
production share one codebase and release lineage, with separate identities,
secrets, state, and data.

## What this repository contains

This GitHub repository is the engineering codebase for that design: application
shells, shared contract packages, tenant-aware database foundations, Azure
environment templates, and operational baselines. Product authority and open
decisions remain in GitBook; this repo implements without silently closing them.

For local setup, checks, and infrastructure procedures, see
[Getting started](docs/development/getting-started.md). Data source strategy and
the provider tracker live in
[Data sources](docs/architecture/data-sources.md). Near-term Talent V0.1 exits
and what each milestone unlocks:
[V0.1 engineering milestones](docs/plans/v0.1-milestones.md).
