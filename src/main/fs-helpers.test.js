import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import { join } from 'path'
import {
  safeRead,
  safeJSON,
  safeMatter,
  dirs,
  files,
  scanGithubRepos
} from './fs-helpers.js'

let tmp

beforeEach(() => {
  tmp = fs.mkdtempSync(join(os.tmpdir(), 'fs-helpers-'))
})

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('safeRead', () => {
  it('returns file contents as a string', () => {
    const p = join(tmp, 'hello.txt')
    fs.writeFileSync(p, 'hi')
    expect(safeRead(p)).toBe('hi')
  })

  it('returns null when the file does not exist', () => {
    expect(safeRead(join(tmp, 'nope.txt'))).toBeNull()
  })

  it('returns null when the path is a directory', () => {
    expect(safeRead(tmp)).toBeNull()
  })
})

describe('safeJSON', () => {
  it('returns the parsed object for valid JSON', () => {
    const p = join(tmp, 'cfg.json')
    fs.writeFileSync(p, JSON.stringify({ a: 1, b: [2, 3] }))
    expect(safeJSON(p)).toEqual({ a: 1, b: [2, 3] })
  })

  it('returns null for malformed JSON without throwing', () => {
    const p = join(tmp, 'bad.json')
    fs.writeFileSync(p, '{ not valid json')
    expect(safeJSON(p)).toBeNull()
  })

  it('returns null when the file is missing', () => {
    expect(safeJSON(join(tmp, 'missing.json'))).toBeNull()
  })

  it('returns null for an empty file', () => {
    const p = join(tmp, 'empty.json')
    fs.writeFileSync(p, '')
    expect(safeJSON(p)).toBeNull()
  })
})

describe('safeMatter', () => {
  it('parses frontmatter and content', () => {
    const p = join(tmp, 'doc.md')
    fs.writeFileSync(p, '---\nname: demo\n---\nbody text')
    const result = safeMatter(p)
    expect(result.frontmatter).toEqual({ name: 'demo' })
    expect(result.content.trim()).toBe('body text')
  })

  it('returns empty frontmatter when there is none', () => {
    const p = join(tmp, 'plain.md')
    fs.writeFileSync(p, 'just body, no frontmatter')
    const result = safeMatter(p)
    expect(result.frontmatter).toEqual({})
    expect(result.content).toContain('just body')
  })

  it('returns null when the file is missing', () => {
    expect(safeMatter(join(tmp, 'missing.md'))).toBeNull()
  })
})

describe('dirs', () => {
  it('returns directory names, excluding files', () => {
    fs.mkdirSync(join(tmp, 'skills'))
    fs.mkdirSync(join(tmp, 'agents'))
    fs.writeFileSync(join(tmp, 'not-a-dir.md'), 'x')
    expect(dirs(tmp).sort()).toEqual(['agents', 'skills'])
  })

  it('excludes hidden dot-directories', () => {
    fs.mkdirSync(join(tmp, 'real'))
    fs.mkdirSync(join(tmp, '.DS_Store'))
    fs.mkdirSync(join(tmp, '.git'))
    expect(dirs(tmp)).toEqual(['real'])
  })

  it('returns an empty array when the path does not exist', () => {
    expect(dirs(join(tmp, 'nope'))).toEqual([])
  })

  it('returns an empty array when the path is a file', () => {
    const p = join(tmp, 'file.txt')
    fs.writeFileSync(p, 'x')
    expect(dirs(p)).toEqual([])
  })
})

describe('files', () => {
  it('returns all non-hidden files when no extension is given', () => {
    fs.writeFileSync(join(tmp, 'a.md'), '')
    fs.writeFileSync(join(tmp, 'b.json'), '')
    fs.writeFileSync(join(tmp, '.hidden'), '')
    expect(files(tmp).sort()).toEqual(['a.md', 'b.json'])
  })

  it('filters by extension when provided', () => {
    fs.writeFileSync(join(tmp, 'a.md'), '')
    fs.writeFileSync(join(tmp, 'b.json'), '')
    fs.writeFileSync(join(tmp, 'c.md'), '')
    expect(files(tmp, '.md').sort()).toEqual(['a.md', 'c.md'])
  })

  it('excludes hidden files even when matching the extension', () => {
    fs.writeFileSync(join(tmp, 'visible.md'), '')
    fs.writeFileSync(join(tmp, '.hidden.md'), '')
    expect(files(tmp, '.md')).toEqual(['visible.md'])
  })

  it('returns an empty array when the directory does not exist', () => {
    expect(files(join(tmp, 'nope'))).toEqual([])
  })
})

describe('scanGithubRepos', () => {
  function makeRepo(parent, name) {
    const p = join(parent, name)
    fs.mkdirSync(p, { recursive: true })
    fs.mkdirSync(join(p, '.git'))
    return p
  }

  it('finds top-level repos (directories containing .git)', () => {
    const a = makeRepo(tmp, 'repo-a')
    const b = makeRepo(tmp, 'repo-b')
    fs.mkdirSync(join(tmp, 'not-a-repo'))
    const result = scanGithubRepos(tmp).sort()
    expect(result).toEqual([a, b].sort())
  })

  it('finds repos nested one level deep (org/project pattern)', () => {
    fs.mkdirSync(join(tmp, 'myorg'))
    const nested = makeRepo(join(tmp, 'myorg'), 'project')
    expect(scanGithubRepos(tmp)).toContain(nested)
  })

  it('skips hidden directories', () => {
    fs.mkdirSync(join(tmp, '.cache'))
    fs.mkdirSync(join(tmp, '.cache', '.git'))
    expect(scanGithubRepos(tmp)).toEqual([])
  })

  it('returns an empty array when the repos directory does not exist', () => {
    expect(scanGithubRepos(join(tmp, 'missing'))).toEqual([])
  })

  it('does not throw when a subdirectory cannot be read', () => {
    makeRepo(tmp, 'good')
    fs.writeFileSync(join(tmp, 'a-file.txt'), 'x')
    expect(() => scanGithubRepos(tmp)).not.toThrow()
  })
})
