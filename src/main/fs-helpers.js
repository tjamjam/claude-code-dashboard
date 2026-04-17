import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

export function safeRead(filePath) {
  try { return fs.readFileSync(filePath, 'utf-8') } catch { return null }
}

export function safeJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')) } catch { return null }
}

export function safeMatter(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)
    return { frontmatter: data, content }
  } catch { return null }
}

export function dirs(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => d.name)
  } catch { return [] }
}

export function files(dirPath, ext) {
  try {
    return fs.readdirSync(dirPath)
      .filter(f => !f.startsWith('.') && (!ext || f.endsWith(ext)))
  } catch { return [] }
}

export function scanGithubRepos(reposDir) {
  const repos = []
  try {
    const entries = fs.readdirSync(reposDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    for (const entry of entries) {
      const p = join(reposDir, entry.name)
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
