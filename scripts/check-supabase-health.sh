#!/usr/bin/env bash
set -euo pipefail

printf 'Supabase health snapshot: %s\n\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

checks=(
  db-stats
  table-stats
  index-stats
  traffic-profile
  outliers
  calls
  long-running-queries
  locks
  blocking
  bloat
)

for check in "${checks[@]}"; do
  printf '\n=== %s ===\n' "$check"
  npx supabase inspect db "$check" --linked
done

cat <<'EOF'

Compare this snapshot with the previous run and the Supabase dashboard.
Upgrade compute only when CPU, swap, or disk I/O remains elevated across the
full observation window after query frequency and database growth have fallen.
EOF
