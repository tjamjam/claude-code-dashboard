import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import os from 'os'
import fs from 'fs'
import matter from 'gray-matter'

const CLAUDE_DIR = join(os.homedir(), '.claude')

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

  return {
    skills: skillCount,
    agents: agentCount,
    teams: teamCount,
    plans: planCount,
    commands: commandCount,
    projects: projectDirs.length,
    projectsWithMemory: memoryCount
  }
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
  const githubDir = join(os.homedir(), 'Documents', 'GitHub')

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

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
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
