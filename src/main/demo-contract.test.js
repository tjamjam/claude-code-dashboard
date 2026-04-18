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
  getLaunchProfiles
} from './api-handlers.js'
import { demoHandlers } from './demo-data.js'

// Each case pairs a real handler with the IPC channel that its demo
// counterpart is registered under. The contract test seeds an empty
// fixture and asserts both paths return the same top-level key set,
// which catches the most common drift: a real handler gains a field
// and demo-data never learns about it, silently breaking demo mode.

const CASES = [
  { endpoint: '/api/overview',         run: getOverview },
  { endpoint: '/api/rules',            run: getRules },
  { endpoint: '/api/hooks',            run: getHooks },
  { endpoint: '/api/permissions-full', run: getPermissionsFull },
  { endpoint: '/api/env-vars',         run: getEnvVars },
  { endpoint: '/api/tasks',            run: getTasks },
  { endpoint: '/api/plugins-full',     run: getPluginsFull },
  { endpoint: '/api/context',          run: getContext },
  { endpoint: '/api/launch-profiles',  run: getLaunchProfiles }
]

let root, claudeDir, reposDir

beforeEach(() => {
  root = fs.mkdtempSync(join(os.tmpdir(), 'contract-'))
  claudeDir = join(root, 'claude')
  reposDir = join(root, 'github')
  fs.mkdirSync(claudeDir)
  fs.mkdirSync(reposDir)
})

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

describe('demo/real handler contract', () => {
  it.each(CASES)('$endpoint — demo-data.js registers a handler', ({ endpoint }) => {
    expect(typeof demoHandlers[endpoint]).toBe('function')
  })

  it.each(CASES)('$endpoint — top-level keys match between real and demo', async ({ endpoint, run }) => {
    const realResult = run({ claudeDir, reposDir })
    const demoResult = await demoHandlers[endpoint]()
    expect(Object.keys(realResult).sort()).toEqual(Object.keys(demoResult).sort())
  })

  it('/api/context — nested env keys match between real and demo', async () => {
    const realResult = getContext({ claudeDir })
    const demoResult = await demoHandlers['/api/context']()
    expect(Object.keys(realResult.env).sort()).toEqual(Object.keys(demoResult.env).sort())
  })

  it('/api/tasks — statusCounts keys match between real and demo', async () => {
    const realResult = getTasks({ claudeDir })
    const demoResult = await demoHandlers['/api/tasks']()
    expect(Object.keys(realResult.statusCounts).sort()).toEqual(Object.keys(demoResult.statusCounts).sort())
  })

  it('/api/launch-profiles — profile entries use a consistent shape', async () => {
    const realResult = getLaunchProfiles({ claudeDir })
    const demoResult = await demoHandlers['/api/launch-profiles']()
    const realProfileKeys = Object.keys(realResult.profiles[0]).sort()
    const demoProfileKeys = Object.keys(demoResult.profiles[0]).sort()
    expect(realProfileKeys).toEqual(demoProfileKeys)
  })
})
