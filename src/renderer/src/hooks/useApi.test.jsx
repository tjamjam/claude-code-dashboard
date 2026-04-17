import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useApi } from './useApi.js'

function mockApi(impl) {
  globalThis.window.api = { invoke: vi.fn(impl) }
  return globalThis.window.api
}

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state
  })
}

beforeEach(() => {
  setVisibility('visible')
})

afterEach(() => {
  vi.useRealTimers()
  delete globalThis.window.api
})

describe('useApi — initial fetch', () => {
  it('calls window.api.invoke with the /api-prefixed endpoint', async () => {
    const api = mockApi(() => Promise.resolve({ ok: true }))
    const { result } = renderHook(() => useApi('/overview'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(api.invoke).toHaveBeenCalledWith('/api/overview')
    expect(result.current.data).toEqual({ ok: true })
    expect(result.current.error).toBeNull()
  })

  it('starts in loading state with null data', () => {
    mockApi(() => new Promise(() => {}))
    const { result } = renderHook(() => useApi('/x'))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('captures the error message when the invoke rejects', async () => {
    mockApi(() => Promise.reject(new Error('boom')))
    const { result } = renderHook(() => useApi('/broken'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('boom')
    expect(result.current.data).toBeNull()
  })
})

describe('useApi — refetch', () => {
  it('refetch() sets loading true and refreshes data', async () => {
    let n = 0
    mockApi(() => Promise.resolve({ n: ++n }))
    const { result } = renderHook(() => useApi('/x'))
    await waitFor(() => expect(result.current.data).toEqual({ n: 1 }))

    await act(() => result.current.refetch())
    expect(result.current.data).toEqual({ n: 2 })
    expect(result.current.loading).toBe(false)
  })

  it('silent refetch does not toggle loading back to true', async () => {
    let n = 0
    mockApi(() => Promise.resolve({ n: ++n }))
    const { result } = renderHook(() => useApi('/x'))
    await waitFor(() => expect(result.current.data).toEqual({ n: 1 }))

    const states = []
    const unsub = () => states.push(result.current.loading)
    await act(async () => {
      const p = result.current.refetch(true)
      unsub()
      await p
    })
    expect(states).toEqual([false])
  })
})

describe('useApi — polling', () => {
  it('silently refetches on each interval tick', async () => {
    vi.useFakeTimers()
    const api = mockApi(() => Promise.resolve({ ok: true }))
    renderHook(() => useApi('/x', { intervalMs: 1000, refetchOnFocus: false }))
    await vi.waitFor(() => expect(api.invoke).toHaveBeenCalledTimes(1))

    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(api.invoke).toHaveBeenCalledTimes(2)

    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(api.invoke).toHaveBeenCalledTimes(3)
  })

  it('skips polling when the document is hidden', async () => {
    vi.useFakeTimers()
    const api = mockApi(() => Promise.resolve({}))
    renderHook(() => useApi('/x', { intervalMs: 1000, refetchOnFocus: false }))
    await vi.waitFor(() => expect(api.invoke).toHaveBeenCalledTimes(1))

    setVisibility('hidden')
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(api.invoke).toHaveBeenCalledTimes(1)
  })

  it('does not start polling when intervalMs is 0', async () => {
    vi.useFakeTimers()
    const api = mockApi(() => Promise.resolve({}))
    renderHook(() => useApi('/x', { intervalMs: 0, refetchOnFocus: false }))
    await vi.waitFor(() => expect(api.invoke).toHaveBeenCalledTimes(1))

    await act(async () => { await vi.advanceTimersByTimeAsync(60000) })
    expect(api.invoke).toHaveBeenCalledTimes(1)
  })

  it('clears the interval on unmount (no leaks)', async () => {
    vi.useFakeTimers()
    const api = mockApi(() => Promise.resolve({}))
    const { unmount } = renderHook(() => useApi('/x', { intervalMs: 1000, refetchOnFocus: false }))
    await vi.waitFor(() => expect(api.invoke).toHaveBeenCalledTimes(1))

    unmount()
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(api.invoke).toHaveBeenCalledTimes(1)
  })
})

describe('useApi — refetchOnFocus', () => {
  it('silently refetches when the window gains focus', async () => {
    const api = mockApi(() => Promise.resolve({}))
    renderHook(() => useApi('/x', { intervalMs: 0, refetchOnFocus: true }))
    await waitFor(() => expect(api.invoke).toHaveBeenCalledTimes(1))

    await act(async () => { window.dispatchEvent(new Event('focus')) })
    await waitFor(() => expect(api.invoke).toHaveBeenCalledTimes(2))
  })

  it('does not refetch on focus when the option is disabled', async () => {
    const api = mockApi(() => Promise.resolve({}))
    renderHook(() => useApi('/x', { intervalMs: 0, refetchOnFocus: false }))
    await waitFor(() => expect(api.invoke).toHaveBeenCalledTimes(1))

    await act(async () => { window.dispatchEvent(new Event('focus')) })
    expect(api.invoke).toHaveBeenCalledTimes(1)
  })

  it('removes the focus listener on unmount', async () => {
    const api = mockApi(() => Promise.resolve({}))
    const { unmount } = renderHook(() => useApi('/x', { intervalMs: 0, refetchOnFocus: true }))
    await waitFor(() => expect(api.invoke).toHaveBeenCalledTimes(1))

    unmount()
    await act(async () => { window.dispatchEvent(new Event('focus')) })
    expect(api.invoke).toHaveBeenCalledTimes(1)
  })
})
