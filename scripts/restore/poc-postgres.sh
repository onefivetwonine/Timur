#!/usr/bin/env bash
# Restore only a trusted archive to a fresh local drill database. Never drops databases.
set -euo pipefail
umask 077
[[ ${TIMUR_ENVIRONMENT:-} == poc ]] || { echo 'Set TIMUR_ENVIRONMENT=poc; production restore is unsupported.' >&2; exit 2; }
[[ $# == 2 ]] || { echo 'Usage: poc-postgres.sh BACKUP_DIRECTORY timur_restore_UNIQUE_ID' >&2; exit 2; }
[[ ${PGHOST:-127.0.0.1} == 127.0.0.1 || ${PGHOST:-127.0.0.1} == localhost || ${PGHOST:-127.0.0.1} == ::1 ]] || { echo 'Only a local isolated restore target is allowed.' >&2; exit 2; }
[[ $2 =~ ^timur_restore_[a-z0-9_]+$ && ${#2} -le 63 ]] || { echo 'Target must start timur_restore_ and contain only lowercase letters, digits and underscores (63 characters maximum).' >&2; exit 2; }
[[ ${TIMUR_TRUST_BACKUP:-} == yes ]] || { echo 'Archives can execute SQL. Verify provenance, then set TIMUR_TRUST_BACKUP=yes.' >&2; exit 2; }
for command in createdb pg_restore sha256sum; do command -v "$command" >/dev/null || { echo "Missing tool: $command" >&2; exit 2; }; done
unset PGSERVICE PGSERVICEFILE PGHOSTADDR
export PGCONNECT_TIMEOUT=10
backup_dir=$(cd -- "$1" && pwd)
target=$2
[[ -f "$backup_dir/database.dump" && -f "$backup_dir/SHA256SUMS" && -f "$backup_dir/manifest.txt" ]] || { echo 'Incomplete backup.' >&2; exit 2; }
[[ $(cat "$backup_dir/SHA256SUMS") =~ ^[a-f0-9]{64}\ \ database.dump$ ]] || { echo 'Invalid checksum manifest.' >&2; exit 2; }
(cd "$backup_dir" && sha256sum --check --status SHA256SUMS)
[[ $(sed -n '1p' "$backup_dir/manifest.txt") == environment=poc ]] || { echo 'Backup is not marked POC.' >&2; exit 2; }
connection=(--host="${PGHOST:-127.0.0.1}" --port="${PGPORT:-5432}" --username="${PGUSER:-postgres}" --no-password)
log_dir=$(mktemp -d "$backup_dir/restore-$target-XXXXXX")
trap 'echo "Restore failed; any newly created database and logs at $log_dir were retained. Do not expose this target to the application." >&2' ERR
# createdb fails if target exists. No --clean, dropdb or reuse path exists.
createdb "${connection[@]}" --template=template0 -- "$target" 2>"$log_dir/create.stderr"
pg_restore "${connection[@]}" --dbname="$target" --no-owner --no-acl --exit-on-error --single-transaction "$backup_dir/database.dump" 2>"$log_dir/restore.stderr"
printf 'Archive restored into %s. Logs: %s\nApplication, tenant-isolation and deletion checks remain required before claiming recovery.\n' "$target" "$log_dir"
