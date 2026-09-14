# Worker foundation

Node 24 process with configuration validation, a 30-second heartbeat and SIGTERM/SIGINT shutdown. It intentionally has no queue, ingestion, inference or data processing code. It must not be described as an operational recruitment worker.

Build `@timur/runtime` first. Start with `npm run dev --workspace @timur/worker` after loading environment variables. Future work must define durable job claims, idempotency, retry/dead-letter handling, permission checks, tenant boundaries and observable processing before enabling jobs.
