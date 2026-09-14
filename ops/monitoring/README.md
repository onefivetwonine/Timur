# Monitoring implementation specification

`targets.yaml` is a proposed machine-readable policy input. It does not create alerts. Establish application instrumentation and observed baselines before accepting the targets as commitments.

Record request counts/errors/latency, process readiness, database connections/storage, outbox or Service Bus pending age/dead letters, ingestion/scanning failures, evidence digest mismatches, provider timeouts/cost, backup recoverable-point age, deletion backlog and audit write failures. Include environment, service and correlation ID; avoid names, CVs, secrets and high-cardinality candidate identifiers in metrics.

Implement Azure Monitor queries/metric alerts after deployed resource IDs and telemetry schemas exist. Route POC notifications to its owner and production incidents to a tested on-call route. Alert immediately on verified tenant isolation/evidence integrity failures; investigate missing telemetry as a separate fault. Availability counts legitimate authenticated service attempts and excludes expected client errors; define denominator and maintenance treatment before publishing an SLO. Health endpoints alone do not measure the product's useful availability.

For every alert record: signal/query, aggregation window, threshold, delay, resource/environment, owner, severity, runbook, notification route, synthetic firing test and resolution evidence. Use incident response for security or major service faults, backup runbook for protection loss, and deployment rollback for release regressions. Treat thresholds as initial proposals to tune from measurements.
