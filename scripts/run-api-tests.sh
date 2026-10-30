#!/usr/bin/env bash
# Runs the official RealWorld Hurl tests that are in scope for this project.
# Usage (server must be running): SPEC_DIR=../realworld-spec HOST=http://localhost:3000 ./scripts/run-api-tests.sh
set -euo pipefail

SPEC_DIR="${SPEC_DIR:-../realworld-spec}"
export HOST="${HOST:-http://localhost:3000}"

FILES=()
for name in auth errors_auth articles errors_articles pagination favorites; do
  FILES+=("$SPEC_DIR/specs/api/hurl/$name.hurl")
done

"$SPEC_DIR/specs/api/run-api-tests-hurl.sh" "${FILES[@]}"
