#!/usr/bin/env bash
# Delete GHCR images for deleted branches + untagged leftovers
set -euo pipefail

OWNER="${GITHUB_REPOSITORY_OWNER}"
REPO="${GITHUB_REPOSITORY#*/}"

if gh api "/orgs/${OWNER}" &>/dev/null; then P="orgs"; else P="users"; fi

# All live branches → normalized Docker tags
LIVE=$(gh api "repos/${GITHUB_REPOSITORY}/branches" --paginate --jq '.[].name' | \
  tr '/' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g')

cleanup() {
  local pkg="$1"
  local api="/${P}/${OWNER}/packages/container/${pkg}/versions"
  local versions
  versions=$(gh api "$api" --paginate 2>/dev/null) || return 0

  echo "$versions" | jq -c '.[]' | while IFS= read -r v; do
    local id tags
    id=$(echo "$v" | jq -r '.id')
    tags=$(echo "$v" | jq -r '(.metadata.container.tags // [])[]')

    if [ -z "$tags" ]; then
      echo "Delete untagged $id from $pkg"
      gh api --method DELETE "${api}/${id}" || true
    elif ! echo "$tags" | grep -qxF -f <(echo "$LIVE"); then
      echo "Delete $id ($tags) from $pkg — branch gone"
      gh api --method DELETE "${api}/${id}" || true
    fi
  done
}

cleanup "$REPO"
cleanup "${REPO}-dev"
