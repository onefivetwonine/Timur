# Web foundation

Next.js informational page on port 3000, with runtime configuration validation and a persistent POC/synthetic banner. All content renders dynamically so the same image can identify its actual deployment environment. The production banner also states that recruitment workflows are unavailable.

Build `@timur/runtime` first; use `npm run dev --workspace @timur/web` with the environment loaded. The web Dockerfile produces a standalone server, runs as the unprivileged Node user, and requires runtime `TIMUR_ENVIRONMENT`. No environment values are compiled into public client variables.

There is no authentication, candidate collection, ranking, or administrative interface. This page is not a production release claim.

References: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

The build script supplies `TIMUR_ENVIRONMENT=poc` for build-time initialization only. Dynamic pages and startup instrumentation validate the actual runtime environment; a production process still requires `TIMUR_ENVIRONMENT=production`.

After building, run `npm run test:runtime --workspace @timur/web` to verify both environment banners from the same standalone output and process rejection of unsafe runtime configuration. This smoke test binds temporary loopback ports.
