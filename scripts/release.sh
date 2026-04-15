#!/bin/bash
set -euo pipefail

# Usage: ./scripts/release.sh [patch|minor|major]
# Default: patch (1.0.1 → 1.0.2)

BUMP="${1:-patch}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 1. Bump version in package.json
OLD_VERSION=$(node -p "require('./package.json').version")
npm version "$BUMP" --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "Version: $OLD_VERSION → $NEW_VERSION"

# 2. Commit and tag
git add package.json
git commit -m "Bump version to $NEW_VERSION"
git tag "v$NEW_VERSION"

# 3. Push commit and tag
git push && git push --tags

# 4. Load signing credentials
if [ -f "$ROOT/.env" ]; then
  set -a
  source "$ROOT/.env"
  set +a
fi

# 5. Build signed + notarized DMG
echo "Building DMG..."
npm run package:dmg

# 6. Find the DMG
DMG=$(find "$ROOT/dist" -name "Claude-Code-Dashboard-*.dmg" -not -name "*.blockmap" | head -1)
if [ -z "$DMG" ]; then
  echo "Error: DMG not found in dist/"
  exit 1
fi
echo "Built: $DMG"

# 7. Create GitHub release
echo "Creating release v$NEW_VERSION..."
gh release create "v$NEW_VERSION" "$DMG" \
  --title "v$NEW_VERSION" \
  --generate-notes

echo ""
echo "Done: https://github.com/tjamjam/claude-code-dashboard/releases/tag/v$NEW_VERSION"
