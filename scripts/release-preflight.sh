#!/usr/bin/env sh
set -e

if [ "$(git branch --show-current)" != "main" ]; then
  echo "❌ Release must run on branch main (current: $(git branch --show-current))"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree is not clean. Commit or stash before release."
  exit 1
fi

git fetch origin

behind="$(git rev-list HEAD..origin/main --count 2>/dev/null || echo 0)"
if [ "$behind" -ne 0 ]; then
  echo "❌ main is $behind commit(s) behind origin/main. Run: git pull --rebase origin main"
  exit 1
fi

echo "✓ Git: branch main, clean, synced with origin/main"
