import { describe, it, expect } from 'vitest'
import { isSensitive, maskIfSensitive, SENSITIVE_PATTERNS } from './sensitive.js'

describe('isSensitive', () => {
  it.each([
    ['ANTHROPIC_API_KEY'],
    ['API_KEY'],
    ['STRIPE_SECRET'],
    ['GITHUB_TOKEN'],
    ['DB_PASSWORD'],
    ['AWS_CREDENTIAL_FILE']
  ])('flags %s as sensitive', (name) => {
    expect(isSensitive(name)).toBe(true)
  })

  it.each([
    ['NEXT_PUBLIC_URL'],
    ['LOG_LEVEL'],
    ['NODE_ENV'],
    ['DISABLE_TELEMETRY'],
    ['CLAUDE_AUTOCOMPACT_PCT_OVERRIDE']
  ])('does not flag %s as sensitive', (name) => {
    expect(isSensitive(name)).toBe(false)
  })

  it('matches regardless of case', () => {
    expect(isSensitive('api_key')).toBe(true)
    expect(isSensitive('MyToken')).toBe(true)
  })

  it('matches the pattern as a substring, not just whole-word', () => {
    expect(isSensitive('ENCRYPTION_KEY_V2')).toBe(true)
    expect(isSensitive('OAUTH_REFRESH_TOKEN')).toBe(true)
  })

  it('returns false for empty or nullish input', () => {
    expect(isSensitive('')).toBe(false)
    expect(isSensitive(null)).toBe(false)
    expect(isSensitive(undefined)).toBe(false)
  })

  it('covers every canonical pattern', () => {
    for (const p of SENSITIVE_PATTERNS) {
      expect(isSensitive(`MY_${p}_VALUE`)).toBe(true)
    }
  })
})

describe('maskIfSensitive', () => {
  it('masks the value when the name matches a sensitive pattern', () => {
    expect(maskIfSensitive('API_KEY', 'sk-abc123')).toBe('***')
  })

  it('returns the raw value when the name is not sensitive', () => {
    expect(maskIfSensitive('LOG_LEVEL', 'debug')).toBe('debug')
  })

  it('returns the raw value even when it looks like a secret, if the name is safe', () => {
    expect(maskIfSensitive('GREETING', 'my-super-secret-treasure')).toBe('my-super-secret-treasure')
  })
})
