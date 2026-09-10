#!/usr/bin/env bash
# Apply supabase/schema.sql and every file in supabase/migrations/ (in name order) to the
# Supabase project, via the management API. Everything in those files is idempotent
# (create table if not exists / create or replace), so re-running is safe.
#
# Needs: SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)
#        SUPABASE_PROJECT_REF   (the xxxx in https://xxxx.supabase.co)
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_ACCESS_TOKEN:?set SUPABASE_ACCESS_TOKEN}"
: "${SUPABASE_PROJECT_REF:?set SUPABASE_PROJECT_REF}"

run_sql() {
  local file=$1
  local body
  body=$(python3 -c 'import json,sys;print(json.dumps({"query":open(sys.argv[1]).read()}))' "$file")
  local out code
  out=$(curl -sS -A "imperial-clocktower-migrate/1.0" -X POST \
    "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
    --data "$body" -w '\n%{http_code}')
  code=${out##*$'\n'}
  if [[ $code != 2* ]]; then echo "FAILED $file (HTTP $code): ${out%$'\n'*}" >&2; exit 1; fi
  echo "applied $file"
}

run_sql supabase/schema.sql
for f in $(ls supabase/migrations/*.sql 2>/dev/null | sort); do run_sql "$f"; done
echo "done"
