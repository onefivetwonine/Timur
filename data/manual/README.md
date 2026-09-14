# Manual POC intake (local)

Before Azure blob storage exists, quarantine files under ignored local storage:

```text
.local/uploads/<tenant_id>/<artefact_id>/original
```

Record each upload in PostgreSQL `timur.source_artefacts` with:

- `provider = manual`
- `kind = cv_upload` (or `role_brief` / `manual_note`)
- `status = quarantine`
- `content_sha256` of the bytes
- `storage_uri` pointing at that path (e.g. `file:.local/uploads/...`)

Never commit upload binaries or personal data. Synthetic fixtures stay in
`data/synthetic/`. Apply schema with `make poc-db` then `make migrate`
(migrations `0001` + `0002`).
