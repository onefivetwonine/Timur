# Runtime configuration

Shared server-side configuration for API, worker and web. `loadConfig()` requires `TIMUR_ENVIRONMENT=poc|production`. POC accepts only synthetic data. `TIMUR_DATA_MODE` defaults to `synthetic`; `controlled` labels the production scaffold's intended classification but does not authorize importing data. External AI must remain disabled and the provider must remain `deterministic`. No provider implementation or invocation exists yet.

Missing environment names, aliases, unknown data modes, enabled external AI and unsupported providers stop startup. `PORT` is validated separately by the API. Never put database URLs, API keys or other secrets into configuration logs or web public variables.

Run `npm run build --workspace @timur/runtime` before dependent workspace builds. Run `npm run test --workspace @timur/runtime` for environment safety checks.
