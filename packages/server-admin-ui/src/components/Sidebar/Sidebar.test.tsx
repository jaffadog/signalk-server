import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, type Location } from 'react-router-dom'
import Sidebar from './Sidebar'

vi.mock('../../store', () => ({
  useAppStore: () => ({
    updates: [],
    storeAvailable: true,
    serverUpdate: undefined
  }),
  useAccessRequests: () => [],
  useDevices: () => [],
  useLoginStatus: () => ({ authenticationRequired: false }),
  usePlugins: () => [],
  useMultiSourcePaths: () => ({}),
  useReconciledGroups: () => [],
  useSourcePriorities: () => ({ sourcePriorities: [] }),
  usePriorityOverrides: () => ({ paths: [] }),
  usePriorityGroups: () => ({ groups: [] }),
  useActiveConflictCount: () => 0,
  useUnconfiguredGnssSources: () => [],
  useHistoryProviderUnavailable: () => false
}))

function renderSidebar(pathname = '/dashboard') {
  const location = {
    pathname,
    search: '',
    hash: '',
    state: null,
    key: 'test'
  } as Location
  const onHide = vi.fn()
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <Sidebar location={location} show onHide={onHide} />
    </MemoryRouter>
  )
  return onHide
}

describe('Sidebar', () => {
  it('calls onHide when a page is picked', () => {
    // NavLink navigates via pushState, which fires no popstate, so nothing
    // else takes the overlay down and it covers the page just opened.
    const onHide = renderSidebar()
    fireEvent.click(screen.getByText('Webapps'))
    expect(onHide).toHaveBeenCalled()
  })

  it('calls onHide when a submenu entry is picked', () => {
    const onHide = renderSidebar()
    fireEvent.click(screen.getByText('Data'))
    fireEvent.click(screen.getByText('Metadata'))
    expect(onHide).toHaveBeenCalled()
  })

  it('does not call onHide when a dropdown is expanded', () => {
    // Expanding also navigates (to the group's remembered page), but the
    // user is about to pick from the children that just appeared.
    const onHide = renderSidebar()
    fireEvent.click(screen.getByText('Data'))
    expect(onHide).not.toHaveBeenCalled()
  })

  it('does not call onHide when a dropdown is collapsed', () => {
    // Rendering under /data/browser auto-opens the group, so a single click
    // collapses it.
    const onHide = renderSidebar('/data/browser')
    fireEvent.click(screen.getByText('Data'))
    expect(onHide).not.toHaveBeenCalled()
  })

  it('calls onHide when an external link is picked', () => {
    // The new tab leaves the current page untouched, but the menu entry was
    // acted on — leaving the overlay up means finding it on return.
    const onHide = renderSidebar()
    fireEvent.click(screen.getByText('OpenApi'))
    expect(onHide).toHaveBeenCalled()
  })
})
