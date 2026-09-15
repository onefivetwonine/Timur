#!/usr/bin/env bash
# Push a markdown file into the Timur GitBook space via change request.
# Auth: GITBOOK_TOKEN in .local/gitbook.env (gitignored).
#
# Usage:
#   scripts/docs/push-gitbook-page.sh \
#     --file docs/plans/v0.1-milestones.md \
#     --title "Talent V0.1 engineering milestones" \
#     --parent-path product-strategy \
#     [--merge]
#
# --merge merges the CR into live space content after a successful content push.
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
set -a
# shellcheck disable=SC1091
[ -f .local/gitbook.env ] && . ./.local/gitbook.env
set +a
: "${GITBOOK_TOKEN:?Set GITBOOK_TOKEN in .local/gitbook.env}"

SPACE_ID="${GITBOOK_SPACE_ID:-FkviPqGRiQmXp5lCD9IA}"
MARKDOWN_FILE=""
PAGE_TITLE=""
PARENT_PATH=""
DO_MERGE=0
MATCH_PATH_SUFFIX=""

while [ $# -gt 0 ]; do
  case "$1" in
    --file) MARKDOWN_FILE="$2"; shift 2 ;;
    --title) PAGE_TITLE="$2"; shift 2 ;;
    --parent-path) PARENT_PATH="$2"; shift 2 ;;
    --match-path-suffix) MATCH_PATH_SUFFIX="$2"; shift 2 ;;
    --merge) DO_MERGE=1; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

: "${MARKDOWN_FILE:?--file is required}"
: "${PAGE_TITLE:?--title is required}"
: "${PARENT_PATH:?--parent-path is required}"
[ -f "$MARKDOWN_FILE" ] || { echo "Missing file: $MARKDOWN_FILE" >&2; exit 1; }

if [ -z "$MATCH_PATH_SUFFIX" ]; then
  MATCH_PATH_SUFFIX="$(basename "$MARKDOWN_FILE" .md)"
fi

gbapi() {
  local method="$1" path="$2"; shift 2
  curl -sS --fail-with-body -X "$method" \
    "https://api.gitbook.com/v1${path}" \
    -H "Authorization: Bearer ${GITBOOK_TOKEN}" \
    -H "Content-Type: application/json" "$@"
}

markdown_json="$(python3 -c 'import json, pathlib, sys; print(json.dumps(pathlib.Path(sys.argv[1]).read_text()))' "$MARKDOWN_FILE")"
user="$(gbapi GET /user)"
python3 -c 'import json,sys; u=json.load(sys.stdin); print("Authenticated as", u.get("displayName") or u.get("id"))' <<<"$user"

pages_json="$(gbapi GET "/spaces/${SPACE_ID}/content/pages")"
printf '%s' "$pages_json" > /tmp/timur-gitbook-pages.json

eval "$(PAGE_TITLE="$PAGE_TITLE" PARENT_PATH="$PARENT_PATH" MATCH_PATH_SUFFIX="$MATCH_PATH_SUFFIX" python3 - <<'PY'
import json, os
from pathlib import Path
data = json.loads(Path("/tmp/timur-gitbook-pages.json").read_text())
title = os.environ["PAGE_TITLE"]
want_path = os.environ["PARENT_PATH"].strip("/")
suffix = os.environ["MATCH_PATH_SUFFIX"].strip("/")
pages = data.get("pages") or data.get("items") or []

def walk(nodes):
    for n in nodes:
        yield n
        yield from walk(n.get("pages") or n.get("nodes") or [])

existing = ""
parent = ""
for n in walk(pages):
    path = (n.get("path") or "").strip("/")
    t = n.get("title") or ""
    if t == title or path.endswith("/" + suffix) or path == suffix:
        existing = n["id"]
    if path == want_path:
        parent = n["id"]
print(f"existing_id={existing!r}")
print(f"parent_id={parent!r}")
PY
)"

if [ -z "${parent_id:-}" ] && [ -z "${existing_id:-}" ]; then
  echo "Could not find parent path '${PARENT_PATH}' or existing page '${PAGE_TITLE}'" >&2
  exit 1
fi

echo "Parent: ${parent_id:-none}"
echo "Existing page: ${existing_id:-none}"

cr="$(gbapi POST "/spaces/${SPACE_ID}/change-requests" \
  -d "$(PAGE_TITLE="$PAGE_TITLE" python3 -c 'import json,os; print(json.dumps({"subject":"Update "+os.environ["PAGE_TITLE"]}))')")"
cr_id="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])' <<<"$cr")"
cr_url="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("urls",{}).get("app") or "")' <<<"$cr")"

if [ -n "${existing_id}" ]; then
  body="$(EXISTING="$existing_id" MD="$markdown_json" python3 - <<'PY'
import json, os
print(json.dumps({
  "changes": [{
    "operation": "update_page",
    "page": os.environ["EXISTING"],
    "document": {"markdown": json.loads(os.environ["MD"])},
  }]
}))
PY
)"
else
  body="$(PARENT="$parent_id" TITLE="$PAGE_TITLE" MD="$markdown_json" python3 - <<'PY'
import json, os
print(json.dumps({
  "changes": [{
    "operation": "insert_page",
    "title": os.environ["TITLE"],
    "into": os.environ["PARENT"],
    "document": {"markdown": json.loads(os.environ["MD"])},
  }]
}))
PY
)"
fi

gbapi POST "/spaces/${SPACE_ID}/change-requests/${cr_id}/content" -d "$body" >/dev/null
echo "GitBook change request: ${cr_url}"

if [ "$DO_MERGE" -eq 1 ]; then
  merge="$(gbapi POST "/spaces/${SPACE_ID}/change-requests/${cr_id}/merge")"
  python3 -c 'import json,sys; m=json.load(sys.stdin); print("Merge result:", m.get("status") or m.get("result") or m)' <<<"$merge"
  echo "Merged into live space content."
else
  echo "Merge the CR in GitBook to publish, or re-run with --merge."
fi
