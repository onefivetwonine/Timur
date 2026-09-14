#!/usr/bin/env bash
# Push docs/architecture/data-sources.md into the Timur GitBook space via a change request.
# Auth: GITBOOK_TOKEN in the environment or .local/gitbook.env (gitignored).
# Token: https://app.gitbook.com/account/developer
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
mapfile -t ids < <(PAGE_TITLE="$PAGE_TITLE" python3 - <<'PY' <<<"$pages_json"
import json, os, sys
data = json.load(sys.stdin)
title = os.environ["PAGE_TITLE"]
pages = data.get("pages") or data.get("items") or []

def walk(nodes):
    for n in nodes:
        yield n
        yield from walk(n.get("pages") or n.get("nodes") or [])

existing = ""
parent = ""
for n in walk(pages):
    path = (n.get("path") or "").strip("/")
    t = (n.get("title") or "")
    if t == title:
        existing = n["id"]
    if path == "architecture-overview" or t.lower() in {
        "architecture overview", "architecture", "working architecture"
    }:
        parent = n["id"]
if not parent:
    for n in walk(pages):
        if "architecture" in (n.get("title") or "").lower():
            parent = n["id"]
            break
print(existing)
print(parent)
PY
)

existing_id="${ids[0]:-}"
parent_id="${ids[1]:-}"
if [ -z "$parent_id" ] && [ -z "$existing_id" ]; then
  echo "Could not find an Architecture parent page or existing Data sources page in space $SPACE_ID" >&2
  echo "$pages_json" | python3 -c 'import json,sys; d=json.load(sys.stdin); pages=d.get("pages") or d.get("items") or [];
import pprint; pprint.pp([{k:n.get(k) for k in ("id","title","path")} for n in pages[:30]])'
  exit 1
fi

cr="$(gbapi POST "/spaces/${SPACE_ID}/change-requests" \
  -d '{"subject":"Add Data sources tracker (Talent V0.1 providers)"}')"
cr_id="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])' <<<"$cr")"
cr_url="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("urls",{}).get("app") or "")' <<<"$cr")"

if [ -n "$existing_id" ]; then
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
echo "GitBook change request: ${cr_url:-https://app.gitbook.com/s/${SPACE_ID}/~/changes/${cr_id}}"
echo "Review and merge in GitBook to publish."
