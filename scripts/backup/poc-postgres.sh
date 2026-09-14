#!/usr/bin/env bash
# Local synthetic POC only. Authentication: PGPASSFILE or standard libpq password lookup.
set -euo pipefail
umask 077
[[ ${TIMUR_ENVIRONMENT:-} == poc ]] || { echo 'Set TIMUR_ENVIRONMENT=poc; this script cannot back up production.' >&2; exit 2; }
[[ ${PGHOST:-127.0.0.1} == 127.0.0.1 || ${PGHOST:-127.0.0.1} == localhost || ${PGHOST:-127.0.0.1} == ::1 ]] || { echo 'Only a local POC database is allowed.' >&2; exit 2; }
[[ ${PGDATABASE:-timur_poc} == timur_poc ]] || { echo 'Only database timur_poc is allowed.' >&2; exit 2; }
for command in pg_dump pg_restore sha256sum mktemp; do command -v "$command" >/dev/null || { echo "Missing tool: $command" >&2; exit 2; }; done
unset PGSERVICE PGSERVICEFILE PGHOSTADDR
export PGCONNECT_TIMEOUT=10
backup_root=${1:-.local/backups}
mkdir -p -- "$backup_root"
backup_dir=$(mktemp -d "$backup_root/poc-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
trap 'echo "Backup failed; diagnostic files retained in $backup_dir (restrict access)." >&2' ERR
pg_dump --host="${PGHOST:-127.0.0.1}" --port="${PGPORT:-5432}" --username="${PGUSER:-postgres}" --dbname=timur_poc --no-password --format=custom --no-owner --no-acl --file="$backup_dir/database.dump.partial" 2>"$backup_dir/backup.stderr"
pg_restore --list "$backup_dir/database.dump.partial" >"$backup_dir/archive.list"
mv "$backup_dir/database.dump.partial" "$backup_dir/database.dump"
(cd "$backup_dir" && sha256sum database.dump >SHA256SUMS)
printf 'environment=poc\ndatabase=timur_poc\ncreated_utc=%s\nclassification=synthetic-only\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >"$backup_dir/manifest.txt"
printf 'Backup complete: %s\nRestore has NOT been verified. Follow docs/operations/backup-and-recovery.md.\n' "$backup_dir"
