# Claude Code Dashboard

Electron desktop app that visualizes and manages your Claude Code configuration. Scans `~/.claude/` (global) and `~/Documents/GitHub/` (all repos) to show skills, agents, commands, memory, settings, MCP servers, and provide actionable insights.

## Architecture

Three-process Electron app:

- **Main** (`src/main/index.js`) — Node.js process with full filesystem access. All data reads happen here via `ipcMain.handle('/api/*', handler)`. Uses `safeRead`, `safeJSON`, `safeMatter`, `dirs`, `files` helpers.
- **Preload** (`src/preload/index.js`) — Context bridge exposing `window.api.invoke(channel, ...args)` and `window.api.openExternal(url)`. No direct Node access in renderer.
- **Renderer** (`src/renderer/src/`) — React app. Fetches data exclusively through `useApi('/endpoint')` hook which calls `window.api.invoke`.

## Adding a New View

1. Create `src/renderer/src/components/MyView.jsx` following the standard pattern:
   - `useApi('/my-endpoint')` for data
   - Loading state: `if (loading) return <div className="loading">Loading</div>`
   - Detail view pattern: `if (selected) return <DetailView />`
   - Include `<PromptCard>` at the bottom with a contextual prompt
2. Add IPC handler in `src/main/index.js`: `ipcMain.handle('/api/my-endpoint', () => { ... })`
3. Register in `src/renderer/src/App.jsx` SECTIONS object with label, icon, and component

## Adding an IPC Endpoint

Define in `src/main/index.js` before `createWindow()`. Use the safe helpers:
- `safeRead(path)` — returns string or null
- `safeJSON(path)` — returns parsed object or null
- `safeMatter(path)` — returns `{ frontmatter, content }` or null
- `dirs(path)` — returns directory names array (skips hidden)
- `files(path, ext)` — returns filenames array with optional extension filter

## Key Patterns

- **useApi hook** returns `{ data, loading, error, refetch }`. Call `refetch(true)` for silent background refresh.
- **Inline styles everywhere** — no CSS modules. Use CSS variables from `App.css` (e.g., `var(--accent)`, `var(--bg-card)`, `var(--border)`).
- **PromptCard** on every view — list views get bulk audit prompts, detail views get item-specific prompts with interpolated name/content.
- **RepoItemsSection** shared component for showing repo-level items grouped by repo name on Skills/Agents/Commands pages.
- **SectionDivider** from RepoItemsSection for "Global" / "In Repos" labels.

## Styling

Design system lives in `src/renderer/src/App.css` as CSS custom properties:
- Accent: `--accent: #8b5cf6` (purple)
- Cards: `--bg-card`, `--border`, `--radius`, `--shadow`
- Text hierarchy: `--text`, `--text-secondary`, `--text-tertiary`
- Status colors: green (`#059669` allowed), red (`#dc2626` denied), amber (`#d97706` warning)
- Font: Inter (Google Fonts). Mono: `'SF Mono','Fira Code',monospace`

Dark sidebar (`--sidebar-bg: #16161e`), light main content (`--bg: #f3f4f6`).

## Commits

Use conventional commits: `feat:`, `fix:`, `style:`. Multi-line body for non-trivial changes. Always include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` trailer.

## Development

```
npm run dev        # Electron + Vite hot reload
npm run build      # Production build to out/
npm run package    # Build + create macOS DMG (arm64)
```

Renderer changes hot-reload automatically. Main process changes require restarting `npm run dev`.
