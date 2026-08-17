import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

const setSystemPrefersDark = (matches: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  )
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-bs-theme')
    setSystemPrefersDark(false)
  })

  it('defaults to auto when nothing is stored, regardless of system preference', () => {
    setSystemPrefersDark(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('auto')
  })

  it('falls back to auto (not the system theme) when the stored value is invalid', () => {
    localStorage.setItem('sk:theme', 'not-a-real-theme')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('auto')
  })

  it('respects an explicitly stored theme', () => {
    localStorage.setItem('sk:theme', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('resolves data-bs-theme from the system preference while in auto mode', () => {
    setSystemPrefersDark(true)
    renderHook(() => useTheme())
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe(
      'dark'
    )
  })

  it('persists the choice and updates state when setTheme is called', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('sk:theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe(
      'dark'
    )
  })
})
