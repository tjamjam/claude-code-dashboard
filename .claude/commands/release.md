Release a new version of Claude Code Dashboard. Argument: patch (default), minor, or major.

Steps:
1. Review README.md for feature drift. Compare the "What it does" bullets and the lead paragraph against the current sidebar sections in `src/renderer/src/App.jsx`. If features are missing, renamed, or obsolete, update README.md as part of the pre-release commit. Auto-resolving download links (`releases/latest/...`) do not need version updates.
2. If the working tree has uncommitted feature work, commit it with a descriptive message before bumping the version, so the version bump is a clean standalone commit.
3. Bump the version in package.json using `npm version $ARGUMENTS --no-git-tag-version` (default to patch if no argument given)
4. Commit the version bump: "Bump version to X.Y.Z"
5. Tag the commit as vX.Y.Z
6. Push the commit and tag
7. Run `npm run package:dmg` to build the signed, notarized universal DMG. Requires `.env` with APPLE_TEAM_ID, APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD. The script uses `dotenv-cli` to load `.env` into the build environment; confirm the electron-builder output does NOT say "skipped macOS notarization".
8. Find the built DMG in dist/ (named Claude-Code-Dashboard-universal.dmg)
9. Create a GitHub release for the new tag using `gh release create` with `--generate-notes` and attach the DMG
10. Report the release URL when done
