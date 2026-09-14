# External data providers (enrichment / company / market / talent search)

Timur’s POC intakes **manual uploads** into local quarantine. External providers
are optional enrichment and market-context sources. Prefer contractable APIs with
provenance in `source_artefacts` + `evidence_claims`; avoid scraping login walls.

Keys stay out of Git (ignored `.local/providers.env`). Contact enrichment and
personal data still need purpose/authority before production use. Vendor ranking
or outreach copy is never Timur decision authority.

## Wired in `@timur/providers` (17)

| Provider | Best for | Key |
| --- | --- | --- |
| [Crustdata](https://crustdata.com/) | People + company search/enrich | `CRUSTDATA_API_KEY` |
| [DINQ](https://dinq.me/) | NL talent search across public sources | `DINQ_API_KEY` |
| [People Data Labs](https://www.peopledatalabs.com/) | Person/company enrich + search | `PEOPLEDATALABS_API_KEY` |
| [Apollo](https://www.apollo.io/) | People/company enrich | `APOLLO_API_KEY` |
| [ZoomInfo](https://www.zoominfo.com/) | Enterprise B2B | `ZOOMINFO_ACCESS_TOKEN` |
| [Cognism](https://www.cognism.com/) | Verified contacts | `COGNISM_API_KEY` |
| [Lusha](https://www.lusha.com/) | Lightweight contact enrich | `LUSHA_API_KEY` |
| [The Org](https://theorg.com/) | Org charts | `THEORG_API_KEY` |
| [Hunter](https://hunter.io/) | Work email find/verify | `HUNTER_API_KEY` |
| [Proxycurl](https://nubela.co/proxycurl/) | LinkedIn URL enrichment | `PROXYCURL_API_KEY` |
| LinkedIn | Profile URL namespace only | via Proxycurl / Crustdata / DINQ |
| [GitHub](https://docs.github.com/en/rest) | Public eng signals / orgs | optional `GITHUB_TOKEN` |
| [Hugging Face](https://huggingface.co/docs/hub/api) | Model/author signals | optional `HF_TOKEN` |
| [OpenCorporates](https://opencorporates.com/) | Legal entities | `OPENCORPORATES_API_TOKEN` |
| [ACRA / Bizfile](https://www.acra.gov.sg/resources/eservice-tools-portals/api-marketplace/) | SG UEN / company facts | `ACRA_BIZFILE_API_KEY` |
| [MyCareersFuture](https://www.mycareersfuture.gov.sg/) | SG role market / salaries | none |
| [data.gov.sg](https://data.gov.sg/) | Open gov datasets | none |

Secondary vendors (DataLayer, Huntr, CompanyEnrich, AgentEnrich, Clearbit/Breeze)
are not wired until you have a DPA and sample accuracy for your role families.

## Pull

```sh
cp config/environments/providers.env.example .local/providers.env
# fill keys you have
npm run providers:pull
```

Snapshots: `.local/provider-snapshots/` only.

## Schema mapping

1. Manual CV → `source_artefacts` (`provider=manual`, quarantine).
2. Parsed assertions → `evidence_claims` on `subjects`.
3. Enrichment → artefact + claims; IDs in `subject_external_ids`.
4. Employers → `employers.uen` when known; roles → `opportunity_twins`.
