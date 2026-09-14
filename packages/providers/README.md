# @timur/providers

Adapters for Talent enrichment, market context, and talent-search peers. Each
adapter pulls when credentials exist or returns `skipped`. Snapshots go to
ignored `.local/provider-snapshots/` — never commit them.

Product tracker (strategy + status): [`docs/architecture/data-sources.md`](../../docs/architecture/data-sources.md).

## Keys (`.local/providers.env`)

| Provider | Env | Notes |
| --- | --- | --- |
| Crustdata | `CRUSTDATA_API_KEY` | People + company |
| DINQ | `DINQ_API_KEY` | Talent search (`sk-…`) |
| People Data Labs | `PEOPLEDATALABS_API_KEY` | Enrich/search |
| Apollo | `APOLLO_API_KEY` | Companies/people |
| ZoomInfo | `ZOOMINFO_ACCESS_TOKEN` or user/pass | Enterprise |
| Cognism | `COGNISM_API_KEY` | Contacts |
| Lusha | `LUSHA_API_KEY` | Contact enrich |
| The Org | `THEORG_API_KEY` | Org charts |
| Hunter | `HUNTER_API_KEY` | Email find |
| Proxycurl | `PROXYCURL_API_KEY` | LinkedIn URL enrich |
| LinkedIn | — | No direct API; use Proxycurl/Crustdata/DINQ |
| GitHub | optional `GITHUB_TOKEN` | Public search works without |
| Hugging Face | optional `HF_TOKEN` | Public Hub search |
| OpenCorporates | `OPENCORPORATES_API_TOKEN` | Required by their API now |
| ACRA Bizfile | `ACRA_BIZFILE_API_KEY` | Official SG companies |
| MyCareersFuture | — | Public jobs |
| data.gov.sg | — | Open datasets |

```sh
cp config/environments/providers.env.example .local/providers.env
# edit keys
npm run providers:pull
```
