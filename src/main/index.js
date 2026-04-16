import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { execSync } from 'child_process'
import os from 'os'
import fs from 'fs'
import matter from 'gray-matter'
import { isMAS, hasRequiredFolders, runSetup, getBasePaths, pickFolder, saveBookmark } from './sandbox.js'
import { DEMO, demoHandlers } from './demo-data.js'

// Resolved after setup (or immediately for non-MAS)
let CLAUDE_DIR
let REPOS_DIR

function initPaths() {
  const paths = getBasePaths()
  CLAUDE_DIR = process.env.CLAUDE_DIR_OVERRIDE || paths.claudeDir || join(os.homedir(), '.claude')
  REPOS_DIR = process.env.REPOS_DIR_OVERRIDE || paths.reposDir || join(os.homedir(), 'Documents', 'GitHub')
}

function safeRead(filePath) {
  try { return fs.readFileSync(filePath, 'utf-8') } catch { return null }
}

function safeJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')) } catch { return null }
}

function safeMatter(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)
    return { frontmatter: data, content }
  } catch { return null }
}

function dirs(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => d.name)
  } catch { return [] }
}

function files(dirPath, ext) {
  try {
    return fs.readdirSync(dirPath)
      .filter(f => !f.startsWith('.') && (!ext || f.endsWith(ext)))
  } catch { return [] }
}

function scanGithubRepos() {
  const githubDir = REPOS_DIR
  const repos = []
  try {
    const entries = fs.readdirSync(githubDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    for (const entry of entries) {
      const p = join(githubDir, entry.name)
      try {
        if (fs.statSync(join(p, '.git')).isDirectory()) repos.push(p)
      } catch {}
      try {
        for (const sub of fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('.'))) {
          const sp = join(p, sub.name)
          try { if (fs.statSync(join(sp, '.git')).isDirectory()) repos.push(sp) } catch {}
        }
      } catch {}
    }
  } catch {}
  return repos
}

// Overview stats
ipcMain.handle('/api/overview', () => {
  const skillCount = dirs(join(CLAUDE_DIR, 'skills')).length
  const agentCount = files(join(CLAUDE_DIR, 'agents'), '.md').length
  const teamDirs = dirs(join(CLAUDE_DIR, 'teams'))
  const teamCount = teamDirs.filter(d => {
    const hasConfig = safeJSON(join(CLAUDE_DIR, 'teams', d, 'config.json'))
    const hasInboxes = files(join(CLAUDE_DIR, 'teams', d, 'inboxes'), '.json').length > 0
    return hasConfig || hasInboxes
  }).length
  const planCount = files(join(CLAUDE_DIR, 'plans'), '.md').length
  const cmdDir = join(CLAUDE_DIR, 'commands')
  const commandCount = files(cmdDir, '.md').filter(f => !f.startsWith('.')).length
    + dirs(cmdDir).length

  const projectDirs = dirs(join(CLAUDE_DIR, 'projects'))
  const memoryCount = projectDirs.filter(d => {
    const memDir = join(CLAUDE_DIR, 'projects', d, 'memory')
    return files(memDir, '.md').length > 0
  }).length

  // Repo-level aggregates
  const repoPaths = scanGithubRepos()
  let repoSkills = 0, repoCommands = 0, repoAgents = 0, reposWithConfig = 0
  for (const rp of repoPaths) {
    const cd = join(rp, '.claude')
    const rSkills = dirs(join(cd, 'skills')).length
    const rCmds = files(join(cd, 'commands'), '.md').filter(f => !f.startsWith('.')).length + dirs(join(cd, 'commands')).length
    const rAgents = files(join(cd, 'agents'), '.md').length
    repoSkills += rSkills
    repoCommands += rCmds
    repoAgents += rAgents
    if (rSkills || rCmds || rAgents || fs.existsSync(join(rp, 'CLAUDE.md')) || fs.existsSync(cd)) reposWithConfig++
  }

  return {
    skills: skillCount,
    agents: agentCount,
    teams: teamCount,
    plans: planCount,
    commands: commandCount,
    projects: projectDirs.length,
    projectsWithMemory: memoryCount,
    repoSkills,
    repoCommands,
    repoAgents,
    totalRepos: repoPaths.length,
    reposWithConfig
  }
})

// Self-Improvement
ipcMain.handle('/api/insights', () => {
  const insights = []
  const settings = safeJSON(join(CLAUDE_DIR, 'settings.json'))

  // Model
  if (settings?.model) {
    insights.push({ id: 'model', type: 'info', title: 'Active model', message: `You're running ${settings.model} globally.` })
  }

  // Commands vs skills
  const cmdDir = join(CLAUDE_DIR, 'commands')
  const commandCount = files(cmdDir, '.md').filter(f => !f.startsWith('.')).length + dirs(cmdDir).length
  const skillCount = dirs(join(CLAUDE_DIR, 'skills')).length
  if (commandCount > 0) {
    insights.push({
      id: 'commands-vs-skills',
      type: 'tip',
      title: `${commandCount} command${commandCount !== 1 ? 's' : ''} in ~/.claude/commands/`,
      message: 'Commands are simple prompt templates — not structured skills. Both invoke with /name, but skills have metadata, versioning, and are more powerful. Consider promoting frequently-used commands to skills.'
    })
  }

  // Dangerous permissions
  const allowed = settings?.permissions?.allow || []
  const hasBroadBash = allowed.some(t => t === 'Bash' || t === 'Bash(*)')
  const skipPrompt = settings?.skipDangerousModePermissionPrompt || settings?.dangerouslySkipPermissions
  if (hasBroadBash || skipPrompt) {
    insights.push({
      id: 'broad-perms',
      type: 'warning',
      title: 'Broad permissions active',
      message: hasBroadBash
        ? 'Bash(*) allows all shell commands without prompting. Consider scoping to specific patterns.'
        : 'skipDangerousModePermissionPrompt is enabled — the safety confirmation is suppressed when launching with --dangerously-skip-permissions.'
    })
  }

  // No global CLAUDE.md
  if (!safeRead(join(CLAUDE_DIR, 'CLAUDE.md'))) {
    insights.push({
      id: 'no-claude-md',
      type: 'tip',
      title: 'No global CLAUDE.md',
      message: 'A global CLAUDE.md lets you give Claude persistent instructions and context across every project — role, preferences, conventions.'
    })
  }

  // Hooks
  const hooks = settings?.hooks || {}
  const hookEvents = Object.keys(hooks)
  if (hookEvents.length > 0) {
    const total = Object.values(hooks).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0)
    insights.push({
      id: 'hooks',
      type: 'info',
      title: `${total} hook${total !== 1 ? 's' : ''} configured`,
      message: `Automation running on: ${hookEvents.join(', ')}.`
    })
  }

  // Repos without config
  const repoPaths = scanGithubRepos()
  const noConfig = repoPaths.filter(rp =>
    !fs.existsSync(join(rp, '.claude')) && !fs.existsSync(join(rp, 'CLAUDE.md'))
  ).length
  if (repoPaths.length > 0 && noConfig > 0) {
    insights.push({
      id: 'repos-no-config',
      type: 'tip',
      title: `${noConfig} of ${repoPaths.length} repos have no Claude config`,
      message: 'These repos have no CLAUDE.md or .claude/ directory. Adding a CLAUDE.md gives Claude project-specific context.'
    })
  }

  return insights
})

// Skills
ipcMain.handle('/api/skills', () => {
  const skillsDir = join(CLAUDE_DIR, 'skills')
  return dirs(skillsDir).map(dir => {
    const skill = safeMatter(join(skillsDir, dir, 'SKILL.md'))
    const readme = safeRead(join(skillsDir, dir, 'README.md'))
    return {
      id: dir,
      name: skill?.frontmatter?.name || dir,
      description: skill?.frontmatter?.description || '',
      frontmatter: skill?.frontmatter || {},
      content: skill?.content || '',
      readme: readme || ''
    }
  })
})

// Agents
ipcMain.handle('/api/agents', () => {
  const agentsDir = join(CLAUDE_DIR, 'agents')
  return files(agentsDir, '.md').map(file => {
    const agent = safeMatter(join(agentsDir, file))
    return {
      id: file.replace('.md', ''),
      name: agent?.frontmatter?.name || file.replace('.md', ''),
      frontmatter: agent?.frontmatter || {},
      content: agent?.content || ''
    }
  })
})

// Teams
ipcMain.handle('/api/teams', () => {
  const teamsDir = join(CLAUDE_DIR, 'teams')
  return dirs(teamsDir).map(dir => {
    const config = safeJSON(join(teamsDir, dir, 'config.json'))
    const inboxDir = join(teamsDir, dir, 'inboxes')
    const inboxes = files(inboxDir, '.json').map(f => ({
      name: f.replace('.json', ''),
      data: safeJSON(join(inboxDir, f))
    }))
    return {
      id: dir,
      name: config?.name || dir,
      config: config || null,
      inboxes,
      hasConfig: !!config
    }
  })
})

// Settings
ipcMain.handle('/api/settings', () => {
  const global = safeJSON(join(CLAUDE_DIR, 'settings.json'))
  const local = safeJSON(join(CLAUDE_DIR, 'settings.local.json'))
  return { global, local }
})

// Memory by project
ipcMain.handle('/api/memory', () => {
  const projectsDir = join(CLAUDE_DIR, 'projects')
  return dirs(projectsDir).map(dir => {
    const memDir = join(projectsDir, dir, 'memory')
    const index = safeRead(join(memDir, 'MEMORY.md'))
    const memories = files(memDir, '.md')
      .filter(f => f !== 'MEMORY.md')
      .map(f => {
        const mem = safeMatter(join(memDir, f))
        return {
          id: f.replace('.md', ''),
          file: f,
          frontmatter: mem?.frontmatter || {},
          content: mem?.content || ''
        }
      })
    const claudeMd = safeRead(join(projectsDir, dir, 'CLAUDE.md'))
    const displayPath = '/' + dir.replace(/^-/, '').replace(/-/g, '/')

    return {
      id: dir,
      displayPath,
      memoryIndex: index,
      memories,
      claudeMd,
      hasMemory: memories.length > 0,
      hasIndex: !!index,
      hasClaude: !!claudeMd
    }
  }).filter(p => p.hasMemory || p.hasIndex || p.hasClaude)
})

// Plans
ipcMain.handle('/api/plans', () => {
  const plansDir = join(CLAUDE_DIR, 'plans')
  return files(plansDir, '.md').map(file => {
    const raw = safeRead(join(plansDir, file))
    const parsed = safeMatter(join(plansDir, file))
    const titleMatch = raw?.match(/^#\s+(.+)$/m)
    return {
      id: file.replace('.md', ''),
      file,
      title: titleMatch?.[1] || file.replace('.md', '').replace(/-/g, ' '),
      frontmatter: parsed?.frontmatter || {},
      content: parsed?.content || raw || ''
    }
  })
})

// Commands
ipcMain.handle('/api/commands', () => {
  const commandsDir = join(CLAUDE_DIR, 'commands')
  const results = []

  for (const file of files(commandsDir, '.md').filter(f => !f.startsWith('.'))) {
    const content = safeRead(join(commandsDir, file))
    results.push({
      id: file.replace('.md', ''),
      name: file.replace('.md', ''),
      files: [file],
      content: content || ''
    })
  }

  for (const dir of dirs(commandsDir)) {
    const cmdFiles = files(join(commandsDir, dir))
    const mdFile = cmdFiles.find(f => f.endsWith('.md'))
    const content = mdFile ? safeRead(join(commandsDir, dir, mdFile)) : null
    results.push({
      id: dir,
      name: dir,
      files: cmdFiles,
      content: content || ''
    })
  }

  return results
})

// CLAUDE.md
ipcMain.handle('/api/claude-md', () => {
  const global = safeRead(join(CLAUDE_DIR, 'CLAUDE.md'))
  return { global: global || '' }
})

// Plugins
ipcMain.handle('/api/plugins', () => {
  const pluginsDir = join(CLAUDE_DIR, 'plugins')
  const config = safeJSON(join(pluginsDir, 'config.json'))
  const installed = safeJSON(join(pluginsDir, 'installed_plugins.json'))
  return { config, installed }
})

// Repos
ipcMain.handle('/api/repos', () => {
  const githubDir = REPOS_DIR

  function isGitRepo(dirPath) {
    try { return fs.statSync(join(dirPath, '.git')).isDirectory() } catch { return false }
  }

  function scanRepo(repoPath) {
    const name = repoPath.replace(githubDir + '/', '')
    const claudeDir = join(repoPath, '.claude')
    const hasDotClaude = fs.existsSync(claudeDir)

    const claudeMd = safeRead(join(repoPath, 'CLAUDE.md'))
    const settings = safeJSON(join(claudeDir, 'settings.json'))
    const settingsLocal = safeJSON(join(claudeDir, 'settings.local.json'))

    const skillDirs = dirs(join(claudeDir, 'skills'))
    const skills = skillDirs.map(dir => {
      const skill = safeMatter(join(claudeDir, 'skills', dir, 'SKILL.md'))
      return {
        id: dir,
        name: skill?.frontmatter?.name || dir,
        description: skill?.frontmatter?.description || '',
        frontmatter: skill?.frontmatter || {},
        content: skill?.content || ''
      }
    })

    const commandFiles = files(join(claudeDir, 'commands'), '.md')
    const commandDirs = dirs(join(claudeDir, 'commands'))
    const commands = [
      ...commandFiles.filter(f => !f.startsWith('.')).map(f => ({
        id: f.replace('.md', ''),
        name: f.replace('.md', ''),
        content: safeRead(join(claudeDir, 'commands', f)) || ''
      })),
      ...commandDirs.map(dir => {
        const mdFile = files(join(claudeDir, 'commands', dir), '.md')[0]
        return {
          id: dir,
          name: dir,
          content: mdFile ? safeRead(join(claudeDir, 'commands', dir, mdFile)) || '' : ''
        }
      })
    ]

    const agentFiles = files(join(claudeDir, 'agents'), '.md')
    const agents = agentFiles.map(f => {
      const agent = safeMatter(join(claudeDir, 'agents', f))
      return {
        id: f.replace('.md', ''),
        name: agent?.frontmatter?.name || f.replace('.md', ''),
        frontmatter: agent?.frontmatter || {},
        content: agent?.content || ''
      }
    })

    const ruleFiles = files(join(claudeDir, 'rules'), '.md')
    const rules = ruleFiles.map(f => ({
      id: f.replace('.md', ''),
      name: f.replace('.md', ''),
      content: safeRead(join(claudeDir, 'rules', f)) || ''
    }))

    const hooks = settings?.hooks || settingsLocal?.hooks || null
    const mcpJson = safeJSON(join(repoPath, '.mcp.json'))

    const encodedPath = repoPath.replace(/\//g, '-')
    const memDir = join(CLAUDE_DIR, 'projects', encodedPath, 'memory')
    const memoryCount = files(memDir, '.md').filter(f => f !== 'MEMORY.md').length

    const configItems = []
    if (claudeMd) configItems.push('CLAUDE.md')
    if (hasDotClaude) configItems.push('.claude/')
    if (settings) configItems.push('settings')
    if (settingsLocal) configItems.push('settings.local')
    if (skills.length) configItems.push(`${skills.length} skill${skills.length !== 1 ? 's' : ''}`)
    if (commands.length) configItems.push(`${commands.length} command${commands.length !== 1 ? 's' : ''}`)
    if (agents.length) configItems.push(`${agents.length} agent${agents.length !== 1 ? 's' : ''}`)
    if (rules.length) configItems.push(`${rules.length} rule${rules.length !== 1 ? 's' : ''}`)
    if (hooks) configItems.push('hooks')
    if (mcpJson) configItems.push('.mcp.json')
    if (memoryCount) configItems.push(`${memoryCount} memor${memoryCount !== 1 ? 'ies' : 'y'}`)

    return {
      name,
      path: repoPath,
      hasDotClaude,
      claudeMd: claudeMd || null,
      settings: settings || null,
      settingsLocal: settingsLocal || null,
      skills,
      commands,
      agents,
      rules,
      hooks,
      mcpJson: mcpJson || null,
      memoryCount,
      configItems,
      hasConfig: configItems.length > 0
    }
  }

  try {
    const entries = fs.readdirSync(githubDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))

    const repos = []
    for (const entry of entries) {
      const entryPath = join(githubDir, entry.name)
      if (isGitRepo(entryPath)) {
        repos.push(scanRepo(entryPath))
      }
      try {
        const subEntries = fs.readdirSync(entryPath, { withFileTypes: true })
          .filter(d => d.isDirectory() && !d.name.startsWith('.'))
        for (const sub of subEntries) {
          const subPath = join(entryPath, sub.name)
          if (isGitRepo(subPath)) {
            repos.push(scanRepo(subPath))
          }
        }
      } catch { /* not a directory or not readable */ }
    }

    repos.sort((a, b) => {
      if (a.hasConfig && !b.hasConfig) return -1
      if (!a.hasConfig && b.hasConfig) return 1
      return a.name.localeCompare(b.name)
    })

    return repos
  } catch {
    return []
  }
})

// Permission matrix
ipcMain.handle('/api/permissions', () => {
  const settings = safeJSON(join(CLAUDE_DIR, 'settings.json'))
  const local = safeJSON(join(CLAUDE_DIR, 'settings.local.json'))

  const allow = [
    ...(settings?.permissions?.allow || []),
    ...(local?.permissions?.allow || [])
  ]
  const deny = [
    ...(settings?.permissions?.deny || []),
    ...(local?.permissions?.deny || [])
  ]

  // Collect installed plugin MCP servers
  // Cache dir structure: plugins/cache/[registry]/[plugin]/[version]/.mcp.json
  const cacheDir = join(CLAUDE_DIR, 'plugins', 'cache')
  const mcpServers = {}
  for (const registry of dirs(cacheDir)) {
    for (const plugin of dirs(join(cacheDir, registry))) {
      for (const version of dirs(join(cacheDir, registry, plugin))) {
        const mcpConfig = safeJSON(join(cacheDir, registry, plugin, version, '.mcp.json'))
        if (!mcpConfig) continue
        // .mcp.json may use top-level keys directly (not nested under mcpServers)
        const servers = mcpConfig.mcpServers || mcpConfig
        for (const [serverKey, serverConfig] of Object.entries(servers)) {
          if (typeof serverConfig !== 'object') continue
          // Claude Code namespaces plugin MCP tools as: plugin_[pluginname]_[serverkey]
          const pluginPrefix = `plugin_${plugin}_${serverKey}`
          mcpServers[pluginPrefix] = {
            plugin,
            registry,
            serverKey,
            config: serverConfig
          }
        }
      }
    }
  }

  return { allow, deny, mcpServers }
})

// Update a single tool's permission in ~/.claude/settings.json (disabled in MAS sandbox)
ipcMain.handle('/api/settings/permissions/update', (_, { tool, action }) => {
  if (isMAS) return { ok: false, error: 'Not available in App Store build' }
  const settingsPath = join(CLAUDE_DIR, 'settings.json')
  const settings = safeJSON(settingsPath) || {}
  if (!settings.permissions) settings.permissions = {}

  const stripTool = arr => (arr || []).filter(p => p.replace(/\(.*\)$/, '') !== tool)
  settings.permissions.allow = stripTool(settings.permissions.allow)
  settings.permissions.deny = stripTool(settings.permissions.deny)

  if (action === 'allow') settings.permissions.allow.push(`${tool}(*)`)
  else if (action === 'deny') settings.permissions.deny.push(tool)

  if (!settings.permissions.allow.length) delete settings.permissions.allow
  if (!settings.permissions.deny.length) delete settings.permissions.deny
  if (!Object.keys(settings.permissions).length) delete settings.permissions

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  return { ok: true }
})

// Setup / sandbox
ipcMain.handle('/api/setup/status', () => ({
  needsSetup: isMAS && !hasRequiredFolders(),
  isMAS,
  paths: getBasePaths(),
  reposDir: REPOS_DIR,
}))

// Change repos folder (available in all builds)
ipcMain.handle('/api/repos-dir/change', async () => {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) return { ok: false }
  const defaultPath = REPOS_DIR || join(os.homedir(), 'Documents', 'GitHub')
  const result = await pickFolder(win, 'Select your repositories folder', 'Choose the folder containing your Git repositories', defaultPath)
  if (!result) return { ok: false }
  saveBookmark('reposDir', result.path, result.bookmark)
  initPaths()
  return { ok: true, path: REPOS_DIR }
})

ipcMain.handle('/api/setup/run', async () => {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) return { ok: false, error: 'No window' }
  const result = await runSetup(win)
  if (result.ok) initPaths()
  return result
})

// Dev servers — find listening TCP ports matched to repo directories
// Disabled in MAS sandbox (lsof and process.kill are blocked)
ipcMain.handle('/api/dev-servers', () => {
  if (isMAS) return []
  try {
    const raw = execSync('lsof -iTCP -sTCP:LISTEN -n -P -F pcn', { encoding: 'utf-8', timeout: 5000 })

    // Parse lsof -F output: p=pid, c=command, n=name (host:port)
    const procs = []
    let cur = null
    for (const line of raw.split('\n')) {
      if (!line) continue
      if (line[0] === 'p') { cur = { pid: parseInt(line.slice(1)), ports: new Set() }; procs.push(cur) }
      else if (line[0] === 'c' && cur) cur.command = line.slice(1)
      else if (line[0] === 'n' && cur) {
        const m = line.match(/:(\d+)$/)
        if (m) cur.ports.add(parseInt(m[1]))
      }
    }

    // Batch-resolve working directories
    const pids = procs.map(p => p.pid)
    const pidCwd = {}
    if (pids.length) {
      try {
        const cwdRaw = execSync(`lsof -a -d cwd -p ${pids.join(',')} -F pn`, { encoding: 'utf-8', timeout: 5000 })
        let pid = null
        for (const line of cwdRaw.split('\n')) {
          if (!line) continue
          if (line[0] === 'p') pid = parseInt(line.slice(1))
          else if (line[0] === 'n' && pid) { pidCwd[pid] = line.slice(1); pid = null }
        }
      } catch {}
    }

    // Match to repos
    const repos = scanGithubRepos()
    const results = []
    for (const proc of procs) {
      const cwd = pidCwd[proc.pid]
      if (!cwd) continue
      const repo = repos.find(rp => cwd === rp || cwd.startsWith(rp + '/'))
      if (!repo) continue
      for (const port of proc.ports) {
        results.push({
          pid: proc.pid,
          port,
          command: proc.command || 'unknown',
          cwd,
          repoPath: repo,
          repoName: repo.split('/').pop(),
        })
      }
    }
    return results
  } catch {
    return []
  }
})

// Kill a dev server process (disabled in MAS sandbox)
ipcMain.handle('/api/dev-servers/kill', (_, { pid }) => {
  if (isMAS) return { ok: false, error: 'Not available in App Store build' }
  const parsed = parseInt(pid, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return { ok: false, error: 'Invalid PID' }
  try {
    process.kill(parsed, 'SIGTERM')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// Open external URL (for opening report.html in browser)
ipcMain.handle('open-external', (_, url) => {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return
  shell.openExternal(url)
})

// Usage data
ipcMain.handle('/api/usage', () => {
  const usageDir = join(CLAUDE_DIR, 'usage-data')
  const reportPath = join(usageDir, 'report.html')
  const hasReport = fs.existsSync(reportPath)

  // Aggregate session-meta
  const metaDir = join(usageDir, 'session-meta')
  const metaFiles = files(metaDir, '.json')
  let totalMessages = 0, totalCommits = 0, totalMinutes = 0
  const toolTotals = {}, projectCounts = {}, dates = []
  for (const f of metaFiles) {
    const m = safeJSON(join(metaDir, f))
    if (!m) continue
    totalMessages += (m.user_message_count || 0) + (m.assistant_message_count || 0)
    totalCommits += m.git_commits || 0
    totalMinutes += m.duration_minutes || 0
    if (m.start_time) dates.push(m.start_time)
    for (const [tool, count] of Object.entries(m.tool_counts || {})) {
      toolTotals[tool] = (toolTotals[tool] || 0) + count
    }
    if (m.project_path) {
      const name = m.project_path.split('/').pop()
      projectCounts[name] = (projectCounts[name] || 0) + 1
    }
  }

  // Top tools
  const topTools = Object.entries(toolTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // Top projects
  const topProjects = Object.entries(projectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // Date range
  dates.sort()
  const dateFrom = dates[0] ? dates[0].slice(0, 10) : null
  const dateTo = dates[dates.length - 1] ? dates[dates.length - 1].slice(0, 10) : null

  // Aggregate facets
  const facetsDir = join(usageDir, 'facets')
  const facetFiles = files(facetsDir, '.json')
  const outcomes = {}, frictionCats = {}
  for (const f of facetFiles) {
    const facet = safeJSON(join(facetsDir, f))
    if (!facet) continue
    if (facet.outcome) outcomes[facet.outcome] = (outcomes[facet.outcome] || 0) + 1
    for (const [cat, count] of Object.entries(facet.friction_counts || {})) {
      frictionCats[cat] = (frictionCats[cat] || 0) + count
    }
  }

  const reportHtml = hasReport ? safeRead(reportPath) : null

  return {
    hasReport,
    reportPath,
    reportHtml,
    totalSessions: metaFiles.length,
    analyzedSessions: facetFiles.length,
    totalMessages,
    totalCommits,
    totalHours: Math.round(totalMinutes / 60),
    dateFrom,
    dateTo,
    topTools,
    topProjects,
    outcomes,
    frictionCats,
  }
})

// Rules
ipcMain.handle('/api/rules', () => {
  const globalRulesDir = join(CLAUDE_DIR, 'rules')
  const globalRules = files(globalRulesDir, '.md').map(f => ({
    id: f.replace('.md', ''),
    name: f.replace('.md', ''),
    content: safeRead(join(globalRulesDir, f)) || ''
  }))

  const repoPaths = scanGithubRepos()
  const repos = repoPaths.map(rp => {
    const rulesDir = join(rp, '.claude', 'rules')
    const ruleFiles = files(rulesDir, '.md')
    if (!ruleFiles.length) return null
    return {
      name: rp.replace(REPOS_DIR + '/', ''),
      path: rp,
      rules: ruleFiles.map(f => ({
        id: f.replace('.md', ''),
        name: f.replace('.md', ''),
        content: safeRead(join(rulesDir, f)) || ''
      }))
    }
  }).filter(Boolean)

  return {
    global: globalRules,
    repos,
    totalCount: globalRules.length + repos.reduce((n, r) => n + r.rules.length, 0)
  }
})

// Hooks
ipcMain.handle('/api/hooks', () => {
  function extractHooks(settingsPath, label, source, repoName) {
    const s = safeJSON(settingsPath)
    const hooks = s?.hooks
    if (!hooks || !Object.keys(hooks).length) return null
    return { label, source, repoName, hooks }
  }

  const sources = [
    extractHooks(join(CLAUDE_DIR, 'settings.json'), 'Global (settings.json)', 'global', null),
    extractHooks(join(CLAUDE_DIR, 'settings.local.json'), 'Global (settings.local.json)', 'global-local', null),
  ].filter(Boolean)

  for (const rp of scanGithubRepos()) {
    const name = rp.replace(REPOS_DIR + '/', '')
    const s1 = extractHooks(join(rp, '.claude', 'settings.json'), `${name} (settings.json)`, 'repo', name)
    const s2 = extractHooks(join(rp, '.claude', 'settings.local.json'), `${name} (settings.local.json)`, 'repo-local', name)
    if (s1) sources.push(s1)
    if (s2) sources.push(s2)
  }

  const allEvents = [...new Set(sources.flatMap(s => Object.keys(s.hooks)))].sort()
  let totalHooks = 0
  for (const s of sources) {
    for (const arr of Object.values(s.hooks)) {
      if (Array.isArray(arr)) totalHooks += arr.length
    }
  }

  return { sources, allEvents, totalHooks }
})

// Permissions (full hierarchy)
ipcMain.handle('/api/permissions-full', () => {
  function extractLayer(settingsPath, label, source, repoName) {
    const s = safeJSON(settingsPath)
    if (!s) return null
    const perms = s.permissions || null
    const sandbox = s.sandbox || null
    const skip = s.skipDangerousModePermissionPrompt || false
    if (!perms && !sandbox && !skip) return null
    return { label, source, repoName, permissions: perms, sandbox, skipDangerousMode: skip }
  }

  const layers = [
    extractLayer(join(CLAUDE_DIR, 'settings.json'), '~/.claude/settings.json', 'global', null),
    extractLayer(join(CLAUDE_DIR, 'settings.local.json'), '~/.claude/settings.local.json', 'global-local', null),
  ].filter(Boolean)

  for (const rp of scanGithubRepos()) {
    const name = rp.replace(REPOS_DIR + '/', '')
    const l1 = extractLayer(join(rp, '.claude', 'settings.json'), `${name}/.claude/settings.json`, 'repo', name)
    const l2 = extractLayer(join(rp, '.claude', 'settings.local.json'), `${name}/.claude/settings.local.json`, 'repo-local', name)
    if (l1) layers.push(l1)
    if (l2) layers.push(l2)
  }

  const effectiveAllow = layers.flatMap(l => l.permissions?.allow || [])
  const effectiveDeny = layers.flatMap(l => l.permissions?.deny || [])
  const hasSandbox = layers.some(l => l.sandbox)
  const hasSkipDangerous = layers.some(l => l.skipDangerousMode)

  return { layers, effectiveAllow, effectiveDeny, hasSandbox, hasSkipDangerous }
})

// Environment variables
ipcMain.handle('/api/env-vars', () => {
  const globalSettings = safeJSON(join(CLAUDE_DIR, 'settings.json'))
  const globalLocal = safeJSON(join(CLAUDE_DIR, 'settings.local.json'))

  const repos = []
  for (const rp of scanGithubRepos()) {
    const s = safeJSON(join(rp, '.claude', 'settings.json'))
    const sl = safeJSON(join(rp, '.claude', 'settings.local.json'))
    const env = s?.env || null
    const envLocal = sl?.env || null
    if (env || envLocal) {
      repos.push({
        name: rp.replace(REPOS_DIR + '/', ''),
        path: rp,
        env,
        envLocal
      })
    }
  }

  const allVars = [
    ...Object.keys(globalSettings?.env || {}),
    ...Object.keys(globalLocal?.env || {}),
    ...repos.flatMap(r => [...Object.keys(r.env || {}), ...Object.keys(r.envLocal || {})])
  ]

  return {
    global: globalSettings?.env || null,
    globalLocal: globalLocal?.env || null,
    repos,
    totalVars: new Set(allVars).size
  }
})

// Tasks
ipcMain.handle('/api/tasks', () => {
  const tasksDir = join(CLAUDE_DIR, 'tasks')
  const groups = []
  const statusCounts = { completed: 0, in_progress: 0, pending: 0 }
  let totalSubtasks = 0

  for (const dir of dirs(tasksDir)) {
    const taskDir = join(tasksDir, dir)
    const subtasks = []
    for (const f of files(taskDir, '.json')) {
      const data = safeJSON(join(taskDir, f))
      if (!data || !data.subject) continue
      subtasks.push({
        id: data.id || f.replace('.json', ''),
        subject: data.subject || '',
        description: data.description || '',
        status: data.status || 'pending',
        blocks: data.blocks || [],
        blockedBy: data.blockedBy || []
      })
      const st = data.status || 'pending'
      if (statusCounts[st] !== undefined) statusCounts[st]++
      totalSubtasks++
    }
    if (subtasks.length > 0) {
      groups.push({ id: dir, subtasks })
    }
  }

  return { groups, totalSubtasks, statusCounts }
})

// Plugins (full)
ipcMain.handle('/api/plugins-full', () => {
  const pluginsDir = join(CLAUDE_DIR, 'plugins')
  const installed = safeJSON(join(pluginsDir, 'installed_plugins.json'))
  const blocklist = safeJSON(join(pluginsDir, 'blocklist.json'))
  const marketplaces = safeJSON(join(pluginsDir, 'known_marketplaces.json'))
  const settings = safeJSON(join(CLAUDE_DIR, 'settings.json'))

  const pluginEntries = installed?.plugins || {}
  const totalInstalled = Object.keys(pluginEntries).length

  return {
    installed: pluginEntries,
    enabled: settings?.enabledPlugins || {},
    blocklist: blocklist || { plugins: [] },
    marketplaces: marketplaces || {},
    extraMarketplaces: settings?.extraKnownMarketplaces || {},
    totalInstalled,
    totalMarketplaces: Object.keys(marketplaces || {}).length + Object.keys(settings?.extraKnownMarketplaces || {}).length
  }
})

// Context management
ipcMain.handle('/api/context', () => {
  const settings = safeJSON(join(CLAUDE_DIR, 'settings.json'))
  const local = safeJSON(join(CLAUDE_DIR, 'settings.local.json'))
  const merged = { ...settings, ...local }
  const env = { ...(settings?.env || {}), ...(local?.env || {}) }

  return {
    model: merged.model || null,
    effortLevel: merged.effortLevel || null,
    thinkingEnabled: merged.alwaysThinkingEnabled ?? null,
    env: {
      CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE || null,
      MAX_THINKING_TOKENS: env.MAX_THINKING_TOKENS || null,
      CLAUDE_CODE_MAX_CONTEXT_TOKENS: env.CLAUDE_CODE_MAX_CONTEXT_TOKENS || null,
      DISABLE_COMPACT: env.DISABLE_COMPACT || null,
      DISABLE_PROMPT_CACHING: env.DISABLE_PROMPT_CACHING || null,
    }
  }
})

// Launch profiles
ipcMain.handle('/api/launch-profiles', () => {
  const settings = safeJSON(join(CLAUDE_DIR, 'settings.json'))

  return {
    currentModel: settings?.model || null,
    currentPermissions: settings?.permissions || null,
    profiles: [
      { id: 'default', name: 'Default', category: 'Interactive', description: 'Standard interactive mode', command: 'claude' },
      { id: 'plan', name: 'Plan Mode', category: 'Interactive', description: 'Read-only exploration and planning', command: 'claude --permission-mode plan' },
      { id: 'accept-edits', name: 'Accept Edits', category: 'Interactive', description: 'Auto-accept file edits, still prompt for Bash', command: 'claude --permission-mode acceptEdits' },
      { id: 'headless', name: 'Headless', category: 'Automation', description: 'Non-interactive for scripts and CI', command: 'claude -p "your prompt" --output-format json' },
      { id: 'verbose', name: 'Verbose', category: 'Automation', description: 'Full turn-by-turn logging output', command: 'claude --verbose' },
      { id: 'opus', name: 'Opus', category: 'Model', description: 'Use Opus for complex reasoning tasks', command: 'claude --model opus' },
      { id: 'sonnet', name: 'Sonnet', category: 'Model', description: 'Use Sonnet for faster, cheaper execution', command: 'claude --model sonnet' },
      { id: 'haiku', name: 'Haiku', category: 'Model', description: 'Use Haiku for quick, simple tasks', command: 'claude --model haiku' },
      { id: 'worktree', name: 'Worktree', category: 'Specialized', description: 'Isolated git worktree for parallel work', command: 'claude --worktree' },
      { id: 'resume', name: 'Resume', category: 'Session', description: 'Continue the most recent conversation', command: 'claude --continue' },
      { id: 'budget', name: 'Budget Cap', category: 'Specialized', description: 'Set a maximum spend limit for a session', command: 'claude --max-budget-usd 5.00' },
      { id: 'max-turns', name: 'Turn Limit', category: 'Specialized', description: 'Limit the number of agentic turns', command: 'claude --max-turns 20' },
    ]
  }
})

// Capture screenshot at exact dimensions (for App Store)
ipcMain.handle('/api/screenshot', async () => {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) return { ok: false }
  const image = await win.capturePage()
  const png = image.toPNG()
  const size = image.getSize()
  const filename = `screenshot-${size.width}x${size.height}-${Date.now()}.png`
  const outPath = join(app.getPath('desktop'), filename)
  fs.writeFileSync(outPath, png)
  return { ok: true, path: outPath, width: size.width, height: size.height }
})

// In demo mode, override IPC handlers with fake data
if (DEMO) {
  for (const [channel, handler] of Object.entries(demoHandlers)) {
    try { ipcMain.removeHandler(channel) } catch {}
    ipcMain.handle(channel, handler)
  }
}

function createWindow() {
  initPaths()

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    useContentSize: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
