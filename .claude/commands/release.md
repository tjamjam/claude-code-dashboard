Release a new version of Claude Code Dashboard. Argument: patch (default), minor, or major.

The DMG build and GitHub Release are fully handled by `.github/workflows/release.yml`, which triggers on tags matching `v*`. This skill only prepares the repo and pushes the tag; CI does the rest.

Steps:
1. Review README.md for feature drift. Compare the "What it does" bullets and the lead paragraph against the current sidebar sections in `src/renderer/src/App.jsx`. If features are missing, renamed, or obsolete, update README.md as part of the pre-release commit. Auto-resolving download links (`releases/latest/...`) do not need version updates.
2. If the working tree has uncommitted feature work, commit it with a descriptive message before bumping the version, so the bump is a clean standalone commit.
3. Bump the version in package.json using `npm version $ARGUMENTS --no-git-tag-version` (default to patch if no argument given).
4. Commit the version bump: "Bump version to X.Y.Z".
5. Tag the commit as vX.Y.Z.
6. Push main and the tag: `git push origin main && git push origin vX.Y.Z`. The tag push triggers `.github/workflows/release.yml` on GitHub Actions, which builds the signed + notarized universal DMG and creates the GitHub Release.
7. Watch the CI run: `gh run watch --exit-status` (or `gh run list --workflow="Release DMG" --limit 1`). Typical duration is 8–15 minutes due to notarization.
8. Report the release URL: `https://github.com/tjamjam/claude-code-dashboard/releases/tag/vX.Y.Z`.

Do NOT run `npm run package:dmg` locally or `gh release create` directly during `/release` — those steps are redundant with CI and cause "Release.tag_name already exists" races. The `package:dmg` script stays available for local smoke builds but is not part of the release flow.
