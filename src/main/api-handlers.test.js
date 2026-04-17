import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import { join } from 'path'
import {
  getOverview,
  getRules,
  getHooks,
  getPermissionsFull,
  getEnvVars,
  getTasks,
  getPluginsFull,
  getContext,
  getLaunchProfiles,
  LAUNCH_PROFILES
} from './api-handlers.js'

let root, claudeDir, reposDir

beforeEach(() => {
  root = fs.mkdtempSync(join(os.tmpdir(), 'api-handlers-'))
  claudeDir = join(root, 'claude')
  reposDir = join(root, 'github')
  fs.mkdirSync(claudeDir)
  fs.mkdirSync(reposDir)
})

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

// -------- helpers for seeding fixtures --------

function writeJSON(path, obj) {
  fs.mkdirSync(join(path, '..'), { recursive: true })
  fs.writeFileSync(path, JSON.stringify(obj, null, 2))
}

function writeFile(path, contents) {
  fs.mkdirSync(join(path, '..'), { recursive: true })
  fs.writeFileSync(path, contents)
}

function mkRepo(parent, name) {
  const p = join(parent, name)
  fs.mkdirSync(p, { recursive: true })
  fs.mkdirSync(join(p, '.git'))
  return p
}

// -------- getOverview --------

describe('getOverview', () => {
  it('returns zeroed counts for an empty claudeDir and reposDir', () => {
    const result = getOverview({ claudeDir, reposDir })
    expect(result).toEqual({
      skills: 0,
      agents: 0,
      teams: 0,
      plans: 0,
      commands: 0,
      projects: 0,
      projectsWithMemory: 0,
      repoSkills: 0,
      repoCommands: 0,
      repoAgents: 0,
      totalRepos: 0,
      reposWithConfig: 0
    })
  })

  it('counts global skills, agents, plans, and commands', () => {
    fs.mkdirSync(join(claudeDir, 'skills', 'my-skill'), { recursive: true })
    fs.mkdirSync(join(claudeDir, 'skills', 'other'), { recursive: true })
    writeFile(join(claudeDir, 'agents', 'helper.md'), '')
    writeFile(join(claudeDir, 'plans', 'idea.md'), '')
    writeFile(join(claudeDir, 'commands', 'cmd.md'), '')
    fs.mkdirSync(join(claudeDir, 'commands', 'subcmd'), { recursive: true })

    const result = getOverview({ claudeDir, reposDir })
    expect(result.skills).toBe(2)
    expect(result.agents).toBe(1)
    expect(result.plans).toBe(1)
    expect(result.commands).toBe(2)
  })

  it('counts teams only when they have a config.json or inboxes', () => {
    fs.mkdirSync(join(claudeDir, 'teams', 'real'), { recursive: true })
    writeJSON(join(claudeDir, 'teams', 'real', 'config.json'), { name: 'real' })
    fs.mkdirSync(join(claudeDir, 'teams', 'empty-dir'), { recursive: true })

    expect(getOverview({ claudeDir, reposDir }).teams).toBe(1)
  })

  it('counts projectsWithMemory only when memory dir has .md files', () => {
    fs.mkdirSync(join(claudeDir, 'projects', 'proj-a', 'memory'), { recursive: true })
    writeFile(join(claudeDir, 'projects', 'proj-a', 'memory', 'note.md'), '')
    fs.mkdirSync(join(claudeDir, 'projects', 'proj-b'), { recursive: true })

    const result = getOverview({ claudeDir, reposDir })
    expect(result.projects).toBe(2)
    expect(result.projectsWithMemory).toBe(1)
  })

  it('discovers repos at the top level and one level deep', () => {
    mkRepo(reposDir, 'flat-repo')
    fs.mkdirSync(join(reposDir, 'myorg'), { recursive: true })
    mkRepo(join(reposDir, 'myorg'), 'nested')

    const result = getOverview({ claudeDir, reposDir })
    expect(result.totalRepos).toBe(2)
  })

  it('flags a repo as configured when it has any Claude content', () => {
    const repo = mkRepo(reposDir, 'configured')
    writeFile(join(repo, 'CLAUDE.md'), '# hi')

    expect(getOverview({ claudeDir, reposDir }).reposWithConfig).toBe(1)
  })
})

// -------- getRules --------

describe('getRules', () => {
  it('returns empty arrays and zero total when no rules exist', () => {
    expect(getRules({ claudeDir, reposDir })).toEqual({ global: [], repos: [], totalCount: 0 })
  })

  it('reads global rules with id, name, and content', () => {
    writeFile(join(claudeDir, 'rules', 'style.md'), 'Use tabs.')
    const result = getRules({ claudeDir, reposDir })
    expect(result.global).toEqual([{ id: 'style', name: 'style', content: 'Use tabs.' }])
    expect(result.totalCount).toBe(1)
  })

  it('collects repo rules and sums them into totalCount', () => {
    writeFile(join(claudeDir, 'rules', 'a.md'), '')
    const repo = mkRepo(reposDir, 'app')
    writeFile(join(repo, '.claude', 'rules', 'repo-rule.md'), 'repo only')

    const result = getRules({ claudeDir, reposDir })
    expect(result.totalCount).toBe(2)
    expect(result.repos).toHaveLength(1)
    expect(result.repos[0].name).toBe('app')
    expect(result.repos[0].rules[0].name).toBe('repo-rule')
  })

  it('omits repos that have no rules', () => {
    const repo = mkRepo(reposDir, 'no-rules')
    writeFile(join(repo, 'CLAUDE.md'), '') // has config but no rules
    expect(getRules({ claudeDir, reposDir }).repos).toEqual([])
  })
})

// -------- getHooks --------

describe('getHooks', () => {
  it('returns empty structure when nothing is configured', () => {
    expect(getHooks({ claudeDir, reposDir })).toEqual({ sources: [], allEvents: [], totalHooks: 0 })
  })

  it('reads hooks from global settings.json and settings.local.json', () => {
    writeJSON(join(claudeDir, 'settings.json'), {
      hooks: { PreToolUse: [{ matcher: 'Bash', command: 'echo' }] }
    })
    writeJSON(join(claudeDir, 'settings.local.json'), {
      hooks: { SessionEnd: [{ command: 'cleanup' }, { command: 'log' }] }
    })

    const result = getHooks({ claudeDir, reposDir })
    expect(result.sources.map(s => s.source).sort()).toEqual(['global', 'global-local'])
    expect(result.allEvents).toEqual(['PreToolUse', 'SessionEnd'])
    expect(result.totalHooks).toBe(3)
  })

  it('includes repo-level hooks and totals them correctly', () => {
    const repo = mkRepo(reposDir, 'my-app')
    writeJSON(join(repo, '.claude', 'settings.json'), {
      hooks: { PostToolUse: [{ command: 'lint' }] }
    })

    const result = getHooks({ claudeDir, reposDir })
    expect(result.totalHooks).toBe(1)
    expect(result.sources[0].repoName).toBe('my-app')
  })

  it('skips settings files with empty hooks objects', () => {
    writeJSON(join(claudeDir, 'settings.json'), { hooks: {} })
    expect(getHooks({ claudeDir, reposDir }).sources).toEqual([])
  })
})

// -------- getPermissionsFull --------

describe('getPermissionsFull', () => {
  it('returns empty layers when nothing is configured', () => {
    const result = getPermissionsFull({ claudeDir, reposDir })
    expect(result.layers).toEqual([])
    expect(result.effectiveAllow).toEqual([])
    expect(result.effectiveDeny).toEqual([])
    expect(result.hasSandbox).toBe(false)
    expect(result.hasSkipDangerous).toBe(false)
  })

  it('aggregates allow and deny rules across global and repo settings', () => {
    writeJSON(join(claudeDir, 'settings.json'), {
      permissions: { allow: ['Bash(npm:*)'], deny: ['Bash(rm -rf /)'] }
    })
    const repo = mkRepo(reposDir, 'app')
    writeJSON(join(repo, '.claude', 'settings.json'), {
      permissions: { allow: ['Read(src/**)'] }
    })

    const result = getPermissionsFull({ claudeDir, reposDir })
    expect(result.effectiveAllow.sort()).toEqual(['Bash(npm:*)', 'Read(src/**)'])
    expect(result.effectiveDeny).toEqual(['Bash(rm -rf /)'])
  })

  it('surfaces sandbox and skipDangerousMode flags when present', () => {
    writeJSON(join(claudeDir, 'settings.json'), {
      sandbox: { enabled: true },
      skipDangerousModePermissionPrompt: true
    })
    const result = getPermissionsFull({ claudeDir, reposDir })
    expect(result.hasSandbox).toBe(true)
    expect(result.hasSkipDangerous).toBe(true)
  })

  it('skips settings files that have permissions:null, sandbox:null, skip:false', () => {
    writeJSON(join(claudeDir, 'settings.json'), { model: 'opus' })
    expect(getPermissionsFull({ claudeDir, reposDir }).layers).toEqual([])
  })
})

// -------- getEnvVars --------

describe('getEnvVars', () => {
  it('returns null globals and zero total when nothing is set', () => {
    const result = getEnvVars({ claudeDir, reposDir })
    expect(result.global).toBeNull()
    expect(result.globalLocal).toBeNull()
    expect(result.totalVars).toBe(0)
    expect(result.repos).toEqual([])
  })

  it('reads env vars from global settings and counts unique keys', () => {
    writeJSON(join(claudeDir, 'settings.json'), {
      env: { API_KEY: 'x', LOG_LEVEL: 'info' }
    })
    writeJSON(join(claudeDir, 'settings.local.json'), {
      env: { API_KEY: 'override', EXTRA: '1' }
    })

    const result = getEnvVars({ claudeDir, reposDir })
    expect(result.totalVars).toBe(3) // API_KEY counted once
  })

  it('includes repo env vars when present', () => {
    const repo = mkRepo(reposDir, 'with-env')
    writeJSON(join(repo, '.claude', 'settings.json'), { env: { REPO_VAR: '1' } })
    const result = getEnvVars({ claudeDir, reposDir })
    expect(result.repos).toHaveLength(1)
    expect(result.repos[0].env).toEqual({ REPO_VAR: '1' })
    expect(result.totalVars).toBe(1)
  })
})

// -------- getTasks --------

describe('getTasks', () => {
  it('returns empty structure when tasks dir does not exist', () => {
    expect(getTasks({ claudeDir })).toEqual({
      groups: [],
      totalSubtasks: 0,
      statusCounts: { completed: 0, in_progress: 0, pending: 0 }
    })
  })

  it('reads subtasks from a group and tracks status counts', () => {
    writeJSON(join(claudeDir, 'tasks', 'grp1', 'a.json'), {
      id: 'a', subject: 'first', status: 'completed'
    })
    writeJSON(join(claudeDir, 'tasks', 'grp1', 'b.json'), {
      id: 'b', subject: 'second', status: 'in_progress'
    })
    writeJSON(join(claudeDir, 'tasks', 'grp1', 'c.json'), {
      id: 'c', subject: 'third' // defaults to pending
    })

    const result = getTasks({ claudeDir })
    expect(result.totalSubtasks).toBe(3)
    expect(result.statusCounts).toEqual({ completed: 1, in_progress: 1, pending: 1 })
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].subtasks).toHaveLength(3)
  })

  it('skips malformed task files (missing subject or bad JSON)', () => {
    writeJSON(join(claudeDir, 'tasks', 'grp', 'valid.json'), { subject: 'ok' })
    writeJSON(join(claudeDir, 'tasks', 'grp', 'no-subject.json'), { status: 'completed' })
    writeFile(join(claudeDir, 'tasks', 'grp', 'bad.json'), '{ not json')

    const result = getTasks({ claudeDir })
    expect(result.totalSubtasks).toBe(1)
    expect(result.statusCounts.completed).toBe(0)
  })

  it('omits groups that end up with no valid subtasks', () => {
    writeFile(join(claudeDir, 'tasks', 'empty-grp', 'bad.json'), '{bad')
    expect(getTasks({ claudeDir }).groups).toEqual([])
  })
})

// -------- getPluginsFull --------

describe('getPluginsFull', () => {
  it('returns zeroed structure when the plugins dir is empty', () => {
    const result = getPluginsFull({ claudeDir })
    expect(result.totalInstalled).toBe(0)
    expect(result.totalMarketplaces).toBe(0)
    expect(result.installed).toEqual({})
    expect(result.blocklist).toEqual({ plugins: [] })
  })

  it('reads installed plugins, enabled flags, blocklist, and marketplaces', () => {
    writeJSON(join(claudeDir, 'plugins', 'installed_plugins.json'), {
      plugins: { 'my-plugin': { version: '1.0' } }
    })
    writeJSON(join(claudeDir, 'plugins', 'blocklist.json'), {
      plugins: [{ plugin: 'bad-plugin' }]
    })
    writeJSON(join(claudeDir, 'plugins', 'known_marketplaces.json'), {
      official: { url: 'https://example.com' }
    })
    writeJSON(join(claudeDir, 'settings.json'), {
      enabledPlugins: { 'my-plugin': true },
      extraKnownMarketplaces: { custom: {} }
    })

    const result = getPluginsFull({ claudeDir })
    expect(result.totalInstalled).toBe(1)
    expect(result.enabled).toEqual({ 'my-plugin': true })
    expect(result.blocklist.plugins).toHaveLength(1)
    expect(result.totalMarketplaces).toBe(2)
  })
})

// -------- getContext --------

describe('getContext', () => {
  it('returns nulls when no settings exist', () => {
    const result = getContext({ claudeDir })
    expect(result.model).toBeNull()
    expect(result.effortLevel).toBeNull()
    expect(result.thinkingEnabled).toBeNull()
    expect(result.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE).toBeNull()
  })

  it('merges settings.local.json over settings.json', () => {
    writeJSON(join(claudeDir, 'settings.json'), { model: 'sonnet', effortLevel: 'low' })
    writeJSON(join(claudeDir, 'settings.local.json'), { model: 'opus' })

    const result = getContext({ claudeDir })
    expect(result.model).toBe('opus')        // local overrides global
    expect(result.effortLevel).toBe('low')   // global preserved when not overridden
  })

  it('merges env vars from both settings files', () => {
    writeJSON(join(claudeDir, 'settings.json'), { env: { MAX_THINKING_TOKENS: '1000' } })
    writeJSON(join(claudeDir, 'settings.local.json'), { env: { CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: '50' } })

    const result = getContext({ claudeDir })
    expect(result.env.MAX_THINKING_TOKENS).toBe('1000')
    expect(result.env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE).toBe('50')
  })
})

// -------- getLaunchProfiles --------

describe('getLaunchProfiles', () => {
  it('returns the static profile list with current model and permissions', () => {
    writeJSON(join(claudeDir, 'settings.json'), {
      model: 'opus',
      permissions: { allow: ['Bash(npm:*)'] }
    })

    const result = getLaunchProfiles({ claudeDir })
    expect(result.currentModel).toBe('opus')
    expect(result.currentPermissions).toEqual({ allow: ['Bash(npm:*)'] })
    expect(result.profiles).toBe(LAUNCH_PROFILES)
    expect(result.profiles.length).toBeGreaterThan(0)
  })

  it('returns null current* when settings.json is missing', () => {
    const result = getLaunchProfiles({ claudeDir })
    expect(result.currentModel).toBeNull()
    expect(result.currentPermissions).toBeNull()
    expect(result.profiles.length).toBeGreaterThan(0)
  })
})
