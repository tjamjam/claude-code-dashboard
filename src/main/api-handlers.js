import fs from 'fs'
import { join } from 'path'
import { safeRead, safeJSON, dirs, files, scanGithubRepos } from './fs-helpers.js'

export function getOverview({ claudeDir, reposDir }) {
  const skillCount = dirs(join(claudeDir, 'skills')).length
  const agentCount = files(join(claudeDir, 'agents'), '.md').length
  const teamDirs = dirs(join(claudeDir, 'teams'))
  const teamCount = teamDirs.filter(d => {
    const hasConfig = safeJSON(join(claudeDir, 'teams', d, 'config.json'))
    const hasInboxes = files(join(claudeDir, 'teams', d, 'inboxes'), '.json').length > 0
    return hasConfig || hasInboxes
  }).length
  const planCount = files(join(claudeDir, 'plans'), '.md').length
  const cmdDir = join(claudeDir, 'commands')
  const commandCount = files(cmdDir, '.md').filter(f => !f.startsWith('.')).length
    + dirs(cmdDir).length

  const projectDirs = dirs(join(claudeDir, 'projects'))
  const memoryCount = projectDirs.filter(d => {
    const memDir = join(claudeDir, 'projects', d, 'memory')
    return files(memDir, '.md').length > 0
  }).length

  const repoPaths = scanGithubRepos(reposDir)
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
}

export function getRules({ claudeDir, reposDir }) {
  const globalRulesDir = join(claudeDir, 'rules')
  const globalRules = files(globalRulesDir, '.md').map(f => ({
    id: f.replace('.md', ''),
    name: f.replace('.md', ''),
    content: safeRead(join(globalRulesDir, f)) || ''
  }))

  const repoPaths = scanGithubRepos(reposDir)
  const repos = repoPaths.map(rp => {
    const rulesDir = join(rp, '.claude', 'rules')
    const ruleFiles = files(rulesDir, '.md')
    if (!ruleFiles.length) return null
    return {
      name: rp.replace(reposDir + '/', ''),
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
}

export function getHooks({ claudeDir, reposDir }) {
  function extractHooks(settingsPath, label, source, repoName) {
    const s = safeJSON(settingsPath)
    const hooks = s?.hooks
    if (!hooks || !Object.keys(hooks).length) return null
    return { label, source, repoName, hooks }
  }

  const sources = [
    extractHooks(join(claudeDir, 'settings.json'), 'Global (settings.json)', 'global', null),
    extractHooks(join(claudeDir, 'settings.local.json'), 'Global (settings.local.json)', 'global-local', null),
  ].filter(Boolean)

  for (const rp of scanGithubRepos(reposDir)) {
    const name = rp.replace(reposDir + '/', '')
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
}

export function getPermissionsFull({ claudeDir, reposDir }) {
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
    extractLayer(join(claudeDir, 'settings.json'), '~/.claude/settings.json', 'global', null),
    extractLayer(join(claudeDir, 'settings.local.json'), '~/.claude/settings.local.json', 'global-local', null),
  ].filter(Boolean)

  for (const rp of scanGithubRepos(reposDir)) {
    const name = rp.replace(reposDir + '/', '')
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
}

export function getEnvVars({ claudeDir, reposDir }) {
  const globalSettings = safeJSON(join(claudeDir, 'settings.json'))
  const globalLocal = safeJSON(join(claudeDir, 'settings.local.json'))

  const repos = []
  for (const rp of scanGithubRepos(reposDir)) {
    const s = safeJSON(join(rp, '.claude', 'settings.json'))
    const sl = safeJSON(join(rp, '.claude', 'settings.local.json'))
    const env = s?.env || null
    const envLocal = sl?.env || null
    if (env || envLocal) {
      repos.push({
        name: rp.replace(reposDir + '/', ''),
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
}

export function getTasks({ claudeDir }) {
  const tasksDir = join(claudeDir, 'tasks')
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
}

export function getPluginsFull({ claudeDir }) {
  const pluginsDir = join(claudeDir, 'plugins')
  const installed = safeJSON(join(pluginsDir, 'installed_plugins.json'))
  const blocklist = safeJSON(join(pluginsDir, 'blocklist.json'))
  const marketplaces = safeJSON(join(pluginsDir, 'known_marketplaces.json'))
  const settings = safeJSON(join(claudeDir, 'settings.json'))

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
}

export function getContext({ claudeDir }) {
  const settings = safeJSON(join(claudeDir, 'settings.json'))
  const local = safeJSON(join(claudeDir, 'settings.local.json'))
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
}

export const LAUNCH_PROFILES = [
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

export function getLaunchProfiles({ claudeDir }) {
  const settings = safeJSON(join(claudeDir, 'settings.json'))
  return {
    currentModel: settings?.model || null,
    currentPermissions: settings?.permissions || null,
    profiles: LAUNCH_PROFILES,
  }
}
