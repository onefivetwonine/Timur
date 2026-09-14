#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
terraform fmt -check -recursive infra
for path in infra/bootstrap/state infra/environments/poc infra/environments/production; do
  terraform -chdir="$path" init -backend=false -input=false -lockfile=readonly
  terraform -chdir="$path" validate
done
for environment in poc production; do
  terraform -chdir="infra/environments/$environment" test
done
