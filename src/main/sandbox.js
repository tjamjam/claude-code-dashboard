import { app, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'

const BOOKMARKS_PATH = join(app.getPath('userData'), 'folder-bookmarks.json')

// Whether we're running as a Mac App Store build.
// process.mas is set by Electron for MAS builds. We also check the sandbox
// environment variable as a fallback — if the app is running inside the
// macOS App Sandbox, treat it as MAS regardless.
export const isMAS =
  process.mas === true ||
  process.env.MAS === '1' ||
  process.env.APP_SANDBOX_CONTAINER_ID != null

function readBookmarks() {
  try { return JSON.parse(fs.readFileSync(BOOKMARKS_PATH, 'utf-8')) } catch { return {} }
}

function writeBookmarks(data) {
  fs.writeFileSync(BOOKMARKS_PATH, JSON.stringify(data, null, 2))
}

// Save a security-scoped bookmark for a folder
export function saveBookmark(key, folderPath, securityScopedBookmark) {
  const bookmarks = readBookmarks()
  bookmarks[key] = { path: folderPath, bookmark: securityScopedBookmark || null }
  writeBookmarks(bookmarks)
}

// Track which bookmarks have been resolved this session
const resolvedBookmarks = new Set()

// Get saved folder paths (resolving bookmarks if in sandbox)
export function getSavedPaths() {
  const bookmarks = readBookmarks()
  // In MAS sandbox, resolve security-scoped bookmarks to regain access after relaunch
  if (isMAS) {
    for (const key of ['claudeDir', 'reposDir']) {
      const entry = bookmarks[key]
      if (entry?.bookmark && !resolvedBookmarks.has(key)) {
        try {
          app.startAccessingSecurityScopedResource(entry.bookmark)
          resolvedBookmarks.add(key)
        } catch {}
      }
    }
  }
  return {
    claudeDir: bookmarks.claudeDir?.path || null,
    reposDir: bookmarks.reposDir?.path || null,
  }
}

// Check if both required folders have been configured
export function hasRequiredFolders() {
  const paths = getSavedPaths()
  return !!(paths.claudeDir && paths.reposDir)
}

// Prompt user to select a folder, returns { path, bookmark } or null
export async function pickFolder(win, title, message, defaultPath) {
  const result = await dialog.showOpenDialog(win, {
    title,
    message,
    defaultPath,
    properties: ['openDirectory', 'createDirectory'],
    securityScopedBookmarks: isMAS,
  })
  if (result.canceled || !result.filePaths.length) return null
  return {
    path: result.filePaths[0],
    bookmark: result.bookmarks?.[0] || null,
  }
}

// Validate that a folder looks like a .claude config directory
function looksLikeClaudeDir(dirPath) {
  // Check for any typical .claude contents
  const markers = ['settings.json', 'settings.local.json', 'projects', 'skills', 'commands', 'agents', 'CLAUDE.md']
  for (const m of markers) {
    try { if (fs.existsSync(join(dirPath, m))) return true } catch {}
  }
  // Empty .claude dir is also valid (fresh install), check the folder name
  return dirPath.endsWith('.claude')
}

// Validate that a folder looks like a repos directory (contains at least one git repo)
function looksLikeReposDir(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      try { if (fs.statSync(join(dirPath, entry.name, '.git')).isDirectory()) return true } catch {}
    }
  } catch {}
  // Accept any directory — it might just not have repos yet
  return true
}

// Run the full setup flow: pick both folders
export async function runSetup(win) {
  const claudeResult = await pickFolder(
    win,
    'Select your Claude configuration folder',
    'Select the .claude folder in your home directory (usually ~/.claude)',
    join(app.getPath('home'), '.claude'),
  )
  if (!claudeResult) return { ok: false }

  if (!looksLikeClaudeDir(claudeResult.path)) {
    return {
      ok: false,
      error: `That doesn't look like a .claude folder. Expected ~/.claude but got "${claudeResult.path}". Look for a folder named .claude in your home directory (it may be hidden).`,
    }
  }

  const reposResult = await pickFolder(
    win,
    'Select your repositories folder',
    'Select the folder containing your Git repositories (e.g. ~/Documents/GitHub)',
    join(app.getPath('home'), 'Documents', 'GitHub'),
  )
  if (!reposResult) return { ok: false }

  saveBookmark('claudeDir', claudeResult.path, claudeResult.bookmark)
  saveBookmark('reposDir', reposResult.path, reposResult.bookmark)
  return { ok: true }
}

// Resolve the base paths: uses bookmarks in MAS, falls back to defaults
export function getBasePaths() {
  const saved = getSavedPaths()

  if (isMAS) {
    // In sandbox mode, we must use the user-granted paths
    return {
      claudeDir: saved.claudeDir,
      reposDir: saved.reposDir,
    }
  }

  // Non-MAS: use saved paths if available, otherwise default
  const home = app.getPath('home')
  return {
    claudeDir: saved.claudeDir || join(home, '.claude'),
    reposDir: saved.reposDir || join(home, 'Documents', 'GitHub'),
  }
}
