#!/usr/bin/env bash
# Push docs/architecture/data-sources.md into GitBook under Architecture overview.
# Auth: GITBOOK_TOKEN in .local/gitbook.env (gitignored).
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
set -a
# shellcheck disable=SC1091
[ -f .local/gitbook.env ] && . ./.local/gitbook.env
set +a
: "${GITBOOK_TOKEN:?Set GITBOOK_TOKEN in .local/gitbook.env}"

SPACE_ID="${GITBOOK_SPACE_ID:-FkviPqGRiQmXp5lCD9IA}"
PAGE_TITLE="${GITBOOK_PAGE_TITLE:-Data sources}"
PARENT_PATH="${GITBOOK_PARENT_PATH:-architecture-overview}"
MARKDOWN_FILE="${1:-docs/architecture/data-sources.md}"

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

eval "$(PAGE_TITLE="$PAGE_TITLE" PARENT_PATH="$PARENT_PATH" python3 - <<'PY'
import json, os
from pathlib import Path
data = json.loads(Path("/tmp/timur-gitbook-pages.json").read_text())
title = os.environ["PAGE_TITLE"]
want_path = os.environ["PARENT_PATH"].strip("/")
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
    if t == title or path.endswith("/data-sources") or path == "data-sources":
        existing = n["id"]
    if path == want_path:
        parent = n["id"]
if not parent:
    for n in walk(pages):
        if (n.get("title") or "").lower() == "architecture overview":
            parent = n["id"]
            break
print(f"existing_id={existing!r}")
print(f"parent_id={parent!r}")
PY
)"

if [ -z "${parent_id:-}" ] && [ -z "${existing_id:-}" ]; then
  echo "Could not find Architecture overview or Data sources page" >&2
  exit 1
fi

echo "Parent: ${parent_id:-none}"
echo "Existing Data sources: ${existing_id:-none}"

cr="$(gbapi POST "/spaces/${SPACE_ID}/change-requests" \
  -d '{"subject":"Update Data sources tracker (Talent V0.1 providers)"}')"
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
echo "Merge the CR in GitBook to publish."
