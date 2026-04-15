Release a new version of Claude Code Dashboard. Argument: patch (default), minor, or major.

Steps:
1. Bump the version in package.json using `npm version $ARGUMENTS --no-git-tag-version` (default to patch if no argument given)
2. Commit the version bump: "Bump version to X.Y.Z"
3. Tag the commit as vX.Y.Z
4. Push the commit and tag
5. Run `npm run package:dmg` to build the signed, notarized universal DMG (requires .env with APPLE_TEAM_ID, APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD)
6. Find the built DMG in dist/ (named Claude-Code-Dashboard-universal.dmg)
7. Create a GitHub release for the new tag using `gh release create` with `--generate-notes` and attach the DMG
8. Report the release URL when done
