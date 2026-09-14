# External data providers (enrichment / company / market)

Timur’s POC intakes **manual uploads** into local quarantine. External providers
are optional enrichment sources later. Prefer contractable APIs with provenance
you can store in `source_artefacts` + `evidence_claims`; avoid undifferentiated
scraping of login-walled sites.

Keys stay out of Git (use ignored `.local/`). Contact enrichment and personal
data still need purpose/authority before production use.

## Strong API peers to Crustdata

| Provider | Best for | Notes |
| --- | --- | --- |
| [Crustdata](https://crustdata.com/) | People + company search/enrich | Your current path; search-then-enrich |
| [People Data Labs](https://www.peopledatalabs.com/) | Person/company enrich + search | Mature docs, bulk enrich, Snowflake feeds |
| [Apollo](https://www.apollo.io/) | People/company enrich + sequences | Common GTM stack; API credit model |
| [ZoomInfo](https://www.zoominfo.com/) | Enterprise B2B contacts/companies | Heavier contracts; strong coverage claims |
| [Cognism](https://www.cognism.com/) | EMEA/UK-heavy verified mobiles/emails | Often compared for compliance messaging |
| [Lusha](https://www.lusha.com/) | Lightweight contact enrich | Simpler than full graph vendors |
| [The Org](https://theorg.com/) | Org charts / reporting lines | Useful for role context, not CVs |
| [Hunter](https://hunter.io/) | Work email find/verify | Narrow; pair with a people graph |
| [Proxycurl](https://nubela.co/proxycurl/) | Profile/company URL enrichment | LinkedIn-URL oriented; check ToS carefully |
| [OpenCorporates](https://opencorporates.com/) | Legal entity registry (global) | Company facts, officers — not résumés |

Newer “agent-native” APIs (DataLayer, DataForB2B, Huntr, CompanyEnrich, AgentEnrich)
exist; treat them as secondary until you have a DPA, rate card, and sample
accuracy for your Singapore role families.

## Singapore-credible sources (high value for Timur)

| Source | Best for | Notes |
| --- | --- | --- |
| [ACRA / Bizfile API Marketplace](https://www.acra.gov.sg/resources/eservice-tools-portals/api-marketplace/) | Employer identity (UEN, status, SSIC) | Official company registry APIs — join on UEN |
| [Bizfile Entity Directory Search](https://www.bizfile.gov.sg/apimarketplace/data-api/eiq/entity-directory-search) | Lookup by UEN/name | Sandbox + production endpoints |
| [MyCareersFuture](https://www.mycareersfuture.gov.sg/) | Role market / salary bands / skills | Official SG jobs portal; good for Opportunity Twin calibration (not candidate PII) |
| [data.gov.sg](https://data.gov.sg/) | Open government datasets | Company/economy slices; check freshness and licence |
| First-party agency history | Prior placements, consented CVs | Matches locked “authorized first-party history” — highest credibility for Talent |

## How this maps to the local schema

1. Manual CV → `source_artefacts` (`kind=cv_upload`, `provider=manual`, status `quarantine`).
2. Parsed assertions → `evidence_claims` on a `subjects` row.
3. Enrichment later → new artefact (`kind=enrichment_snapshot`, `provider=crustdata|pdl|…`) + claims; link IDs in `subject_external_ids`.
4. Employers → `employers.uen` when known (ACRA/Bizfile); Opportunity Twin → `opportunity_twins`.

Do not treat any vendor graph as ground truth: store provider, fetch time, artefact
hash, and verification_state so CVs and third-party claims can contradict cleanly.
