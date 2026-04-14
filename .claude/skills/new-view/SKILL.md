---
name: New Dashboard View
description: Scaffold a complete new view — component, IPC handler, sidebar entry, and prompt card
---

Create a new dashboard view for the Claude Code Dashboard app. The user will describe what the view should show.

## Steps

1. **Create the component** at `src/renderer/src/components/{Name}View.jsx`:
   - Import `useApi` from `../hooks/useApi` and `PromptCard` from `./PromptCard`
   - Follow the standard pattern: loading state, optional detail view with `useState(null)`, list view with `className="card-grid"`
   - Add a `PromptCard` at the bottom of both list and detail views with contextual prompts
   - Use inline styles with CSS variables (`var(--accent)`, `var(--bg-card)`, etc.)
   - If showing items that can exist at both global and repo level, use `RepoItemsSection` and `SectionDivider`

2. **Add the IPC handler** in `src/main/index.js`:
   - Place it before the `createWindow()` function
   - Use `ipcMain.handle('/api/{endpoint}', () => { ... })`
   - Use safe helpers: `safeRead`, `safeJSON`, `safeMatter`, `dirs`, `files`
   - Return plain objects/arrays (serialized automatically over IPC)

3. **Register in App.jsx**:
   - Import the component
   - Add entry to `SECTIONS` object with `label`, `icon` (Unicode char), and `component`
   - Place it in logical order among existing sections

4. **Verify**:
   - `npm run dev` must show the new tab in the sidebar
   - Clicking it should load data and render without errors
   - Search/filter should work if applicable
