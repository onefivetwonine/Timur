# @timur/providers

Adapters for Talent enrichment and market context peers. Each adapter either
pulls when credentials are present or returns `skipped` with the missing env
var. Snapshots go to ignored `.local/provider-snapshots/` — never commit them.

| Provider | Env |
| --- | --- |
| Crustdata | `CRUSTDATA_API_KEY` |
| People Data Labs | `PEOPLEDATALABS_API_KEY` |
| Apollo | `APOLLO_API_KEY` |
| ZoomInfo | `ZOOMINFO_ACCESS_TOKEN` (or username/password) |
| Cognism | `COGNISM_API_KEY` |
| Lusha | `LUSHA_API_KEY` |
| The Org | `THEORG_API_KEY` |
| Hunter | `HUNTER_API_KEY` |
| Proxycurl | `PROXYCURL_API_KEY` |
| OpenCorporates | optional `OPENCORPORATES_API_TOKEN` |
| ACRA Bizfile | `ACRA_BIZFILE_API_KEY` |
| MyCareersFuture | none (public jobs search) |

```sh
# keys only under ignored .local/
cp config/environments/providers.env.example .local/providers.env
npm run build -w @timur/providers
node --env-file=.local/providers.env scripts/providers/pull-available.mjs
```
