import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  MouseEvent,
  ReactNode
} from 'react'
import { NavLink, Location, useNavigate } from 'react-router-dom'
import Badge from 'react-bootstrap/Badge'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight'
import { faGaugeHigh } from '@fortawesome/free-solid-svg-icons/faGaugeHigh'
import { faTableCellsLarge } from '@fortawesome/free-solid-svg-icons/faTableCellsLarge'
import { faFolder } from '@fortawesome/free-solid-svg-icons/faFolder'
import { faCartShopping } from '@fortawesome/free-solid-svg-icons/faCartShopping'
import { faGear } from '@fortawesome/free-solid-svg-icons/faGear'
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons/faShieldHalved'
import { faBookOpen } from '@fortawesome/free-solid-svg-icons/faBookOpen'
import { faList } from '@fortawesome/free-solid-svg-icons/faList'
import { faBolt } from '@fortawesome/free-solid-svg-icons/faBolt'
import { faRss } from '@fortawesome/free-solid-svg-icons/faRss'
import {
  useAppStore,
  useAccessRequests,
  useDevices,
  useLoginStatus,
  usePlugins,
  type Plugin,
  useMultiSourcePaths,
  useReconciledGroups,
  useSourcePriorities,
  usePriorityOverrides,
  usePriorityGroups,
  useActiveConflictCount,
  useUnconfiguredGnssSources,
  useHistoryProviderUnavailable
} from '../../store'
import classNames from 'classnames'
import { isOverrideDormantUnderGroups } from '../../utils/sourceGroups'
import SidebarFooter from './../SidebarFooter/SidebarFooter'
import SidebarForm from './../SidebarForm/SidebarForm'
import SidebarHeader from './../SidebarHeader/SidebarHeader'

// ---------- types (unchanged) ----------
interface BadgeData {
  variant?: string
  text?: string
  color?: string
  class?: string
}

interface NavItemData {
  name: string
  url?: string
  icon?: IconDefinition
  badge?: BadgeData | null
  badges?: (BadgeData | null)[]
  class?: string
  variant?: string
  title?: boolean
  divider?: boolean
  children?: NavItemData[]
  wrapper?: {
    element: string
    attributes?: Record<string, unknown>
  }
  props?: Record<string, unknown>
}

function pathMatchesChild(pathname: string, childUrl: string): boolean {
  return pathname === childUrl || pathname.startsWith(childUrl + '/')
}

interface SidebarProps {
  location: Location
  // Mobile off-canvas visibility. Desktop (>= lg) always renders the
  // sidebar statically regardless of this value — see Offcanvas's
  // `responsive="lg"` below. Owned by the layout container (Full.tsx)
  // and toggled from the header's menu button.
  show: boolean
  onHide: () => void
}

export default function Sidebar({ location, show, onHide }: SidebarProps) {
  const navigate = useNavigate()
  const appStore = useAppStore()
  const accessRequests = useAccessRequests()
  const devices = useDevices()
  const loginStatus = useLoginStatus()
  const plugins = usePlugins()
  const conflictCount = useActiveConflictCount()

  const multiSourcePaths = useMultiSourcePaths()
  const reconciled = useReconciledGroups()
  const sourcePrioritiesData = useSourcePriorities()
  const priorityOverridesData = usePriorityOverrides()
  const priorityGroupsData = usePriorityGroups()

  // Two reasons a group needs the user's attention:
  //   1. it has no saved ranking yet ("Unranked"), or
  //   2. it has a saved ranking but a new source has started publishing
  //      one of the group's paths since the last save — that source sits
  //      unranked at the bottom and will only take over after the
  //      configured timeouts elapse on every ranked source.
  // Both feed the same warning badge so a user notices the new device
  // without having to open the page.
  const unconfiguredPriorityCount = useMemo(() => {
    return reconciled.filter(
      (g) => g.matchedSavedId === null || g.newcomerSources.length > 0
    ).length
  }, [reconciled])

  // Path-level overrides where not every current publisher is listed. The
  // scan is scoped to paths the user has flagged as an explicit override —
  // fan-out entries (which only list group sources that actually publish
  // the path) are intentional and must not trigger a warning. Publishers
  // are further restricted to the group's saved source list so a source
  // the user trashed from the group does not haunt the override warning.
  const overridesWithMissingSourcesCount = useMemo(() => {
    if (!multiSourcePaths || !sourcePrioritiesData?.sourcePriorities) return 0
    const overrideSet = new Set(priorityOverridesData?.paths ?? [])
    if (overrideSet.size === 0) return 0

    // Use the server-reconciled group composition to scope the publisher
    // check: for each saved group, every path in its `paths` belongs to
    // that group's source set. Falling back to the raw publisher list
    // when no group covers a path keeps unscoped overrides working.
    const groupSourcesByPath = new Map<string, Set<string>>()
    for (const g of reconciled) {
      const sourceSet = new Set(g.sources)
      for (const p of g.paths) groupSourcesByPath.set(p, sourceSet)
    }

    const groups = priorityGroupsData?.groups ?? []
    let count = 0
    for (const pp of sourcePrioritiesData.sourcePriorities) {
      if (!overrideSet.has(pp.path)) continue
      // Fan-out overrides intentionally accept every source; "missing"
      // doesn't apply, so they never contribute to the warning badge.
      if (pp.priorities.length === 1 && pp.priorities[0].sourceRef === '*') {
        continue
      }
      // Dormant overrides (every source belongs to a deactivated
      // group) are skipped: the engine isn't applying them, so the
      // user doesn't need to be nagged about a missing publisher
      // that wouldn't have been routed anyway.
      if (isOverrideDormantUnderGroups(pp.priorities, groups)) continue
      const allPublishers = multiSourcePaths[pp.path]
      if (!allPublishers || allPublishers.length === 0) continue
      const restrict = groupSourcesByPath.get(pp.path)
      const publishers = restrict
        ? allPublishers.filter((ref) => restrict.has(ref))
        : allPublishers
      if (publishers.length === 0) continue
      const listed = new Set(
        pp.priorities.map((p) => p.sourceRef).filter(Boolean)
      )
      const hasMissing = publishers.some((ref) => !listed.has(ref))
      if (hasMissing) count++
    }
    return count
  }, [
    multiSourcePaths,
    sourcePrioritiesData,
    priorityOverridesData,
    priorityGroupsData,
    reconciled
  ])

  const nowMs = Date.now() // eslint-disable-line react-hooks/purity -- expired status is stable
  const expiredDeviceCount = devices.filter(
    (d) => d.tokenExpiry && d.tokenExpiry * 1000 < nowMs
  ).length

  const unconfiguredGnssCount = useUnconfiguredGnssSources().length
  const historyProviderUnavailable = useHistoryProviderUnavailable()

  const items = useMemo((): NavItemData[] => {
    const appUpdates = appStore.updates.length
    let updatesBadge: BadgeData | null = null
    let serverUpdateBadge: BadgeData | null = null
    let accessRequestsBadge: BadgeData | null = null
    let expiredDevicesBadge: BadgeData | null = null

    if (appUpdates > 0) {
      updatesBadge = {
        variant: 'success',
        text: `${appUpdates}`,
        color: 'success'
      }
    }

    if (accessRequests.length > 0) {
      accessRequestsBadge = {
        variant: 'success',
        text: `${accessRequests.length}`,
        color: 'success'
      }
    }

    if (expiredDeviceCount > 0) {
      expiredDevicesBadge = {
        variant: 'danger',
        text: `${expiredDeviceCount}`,
        color: 'danger'
      }
    }

    if (appStore.storeAvailable === false) {
      updatesBadge = {
        variant: 'danger',
        text: 'OFFLINE'
      }
    }

    if (appStore.serverUpdate) {
      serverUpdateBadge = {
        variant: 'danger',
        text: appStore.serverUpdate,
        color: 'danger'
      }
    }

    const unconfiguredCount = plugins.filter((plugin: Plugin) => {
      const bundled = (plugin as Record<string, unknown>).bundled as
        boolean | undefined
      const schema = (plugin as Record<string, unknown>).schema as
        { properties?: Record<string, unknown> } | undefined
      const data = (plugin as Record<string, unknown>).data as
        { configuration?: unknown } | undefined
      return (
        !bundled &&
        schema?.properties &&
        Object.keys(schema.properties).length > 0 &&
        (data?.configuration === null || data?.configuration === undefined)
      )
    }).length

    let unconfiguredBadge: BadgeData | null = null
    if (unconfiguredCount > 0) {
      unconfiguredBadge = {
        variant: 'warning',
        text: `${unconfiguredCount}`,
        color: 'warning'
      }
    }

    const isAdmin =
      loginStatus.authenticationRequired === false ||
      loginStatus.userLevel === 'admin'

    const dataChildren: NavItemData[] = [
      { name: 'Browser', url: '/data/browser' },
      { name: 'Metadata', url: '/data/meta' }
    ]
    if (isAdmin) {
      dataChildren.push({
        name: 'Connections',
        url: '/data/connections/-'
      })
    }
    const prioritiesAttentionCount =
      unconfiguredPriorityCount + overridesWithMissingSourcesCount
    if (isAdmin) {
      dataChildren.push(
        {
          name: 'NMEA Discovery',
          url: '/data/sources',
          badge:
            conflictCount > 0
              ? { variant: 'warning', text: `${conflictCount}` }
              : null
        },
        {
          name: 'Priorities',
          url: '/data/priorities',
          badge:
            prioritiesAttentionCount > 0
              ? {
                  variant: 'warning',
                  text: `${prioritiesAttentionCount}`
                }
              : null
        },
        {
          name: 'Preferences',
          url: '/data/preferences',
          badge:
            unconfiguredGnssCount > 0
              ? { variant: 'warning', text: `${unconfiguredGnssCount}` }
              : null
        },
        { name: 'Fiddler', url: '/data/fiddler' },
        { name: 'BLE Manager', url: '/data/blemanager' }
      )
    }

    const result: NavItemData[] = [
      {
        name: 'Dashboard',
        url: '/dashboard',
        icon: faGaugeHigh
      },
      {
        name: 'Webapps',
        url: '/webapps',
        icon: faTableCellsLarge
      },
      ((): NavItemData => {
        const dataBadgeCount = isAdmin
          ? prioritiesAttentionCount + conflictCount + unconfiguredGnssCount
          : 0
        return {
          name: 'Data',
          url: '/data',
          icon: faFolder,
          badge:
            dataBadgeCount > 0
              ? { variant: 'warning', text: `${dataBadgeCount}` }
              : null,
          children: dataChildren
        }
      })()
    ]

    const historyProviderBadge: BadgeData | null = historyProviderUnavailable
      ? { variant: 'warning', text: '!' }
      : null

    if (isAdmin) {
      result.push(
        {
          name: 'Apps & Plugins',
          url: '/apps',
          icon: faCartShopping,
          badges: [updatesBadge, unconfiguredBadge, historyProviderBadge],
          children: [
            {
              name: 'Store',
              url: '/apps/store',
              badge: updatesBadge
            },
            {
              name: 'Configuration',
              url: '/apps/configuration/-',
              badges: [unconfiguredBadge, historyProviderBadge]
            }
          ]
        },
        {
          name: 'Server',
          url: '/serverConfiguration',
          icon: faGear,
          children: [
            {
              name: 'Settings',
              url: '/serverConfiguration/settings'
            },
            {
              name: 'Server Logs',
              url: '/serverConfiguration/log'
            },
            {
              name: 'Update',
              url: '/serverConfiguration/update',
              badge: serverUpdateBadge
            },
            {
              name: 'Backup/Restore',
              url: '/serverConfiguration/backuprestore'
            }
          ]
        }
      )
    }

    if (isAdmin) {
      const securityBadges: BadgeData[] = []
      if (accessRequestsBadge) securityBadges.push(accessRequestsBadge)
      if (expiredDevicesBadge) securityBadges.push(expiredDevicesBadge)

      const security: NavItemData = {
        name: 'Security',
        url: '/security',
        icon: faShieldHalved,
        badges: securityBadges,
        children: [
          {
            name: 'Settings',
            url: '/security/settings'
          },
          {
            name: 'Users',
            url: '/security/users'
          }
        ]
      }
      if (loginStatus.allowDeviceAccessRequests) {
        security.children!.push({
          name: 'Devices',
          url: '/security/devices',
          badge: expiredDevicesBadge
        })
      }
      if (
        loginStatus.allowNewUserRegistration ||
        loginStatus.allowDeviceAccessRequests
      ) {
        security.children!.push({
          name: 'Access Requests',
          url: '/security/access/requests',
          badge: accessRequestsBadge
        })
      }
      result.push(security)
    }

    result.push({
      name: 'Documentation',
      url: '/documentation',
      icon: faBookOpen
    })

    result.push({
      name: 'Path Reference',
      url: '/documentation/paths',
      icon: faList
    })

    result.push({
      name: 'OpenApi',
      url: `${window.location.protocol}//${window.location.host}/doc/openapi`,
      icon: faBolt,
      props: {
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    })

    result.push({
      name: 'AsyncApi',
      url: '/asyncapi',
      icon: faRss
    })

    return result
  }, [
    appStore,
    accessRequests,
    expiredDeviceCount,
    loginStatus,
    plugins,
    conflictCount,
    unconfiguredPriorityCount,
    overridesWithMissingSourcesCount,
    unconfiguredGnssCount,
    historyProviderUnavailable
  ])

  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(
    () => new Set<string>()
  )

  const lastPathnameRef = useRef<string | null>(null)

  // Auto-open dropdown matching the current path (only on pathname changes)
  useEffect(() => {
    if (lastPathnameRef.current === location.pathname) return

    const toOpen: string[] = []
    for (const item of items) {
      if (item.children?.length && item.url) {
        const hasActiveChild = item.children.some(
          (child) => child.url && pathMatchesChild(location.pathname, child.url)
        )
        if (hasActiveChild) {
          toOpen.push(item.url)
        }
      }
    }
    if (toOpen.length > 0) {
      // Expansion is a one-shot reaction to a route change that the user can
      // then override by collapsing, so it cannot be derived during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenDropdowns((prev) => {
        if (toOpen.every((url) => prev.has(url))) return prev
        const next = new Set(prev)
        for (const url of toOpen) {
          next.add(url)
        }
        return next
      })
    }
    lastPathnameRef.current = location.pathname
  }, [location.pathname, items])

  // NavLink navigates via pushState, which fires no popstate, so the mobile
  // off-canvas sidebar would stay open on top of the page the user just
  // picked. Only leaf links close it: toggling a dropdown open also
  // navigates (to the group's remembered page), and closing there would
  // hide the children the user is about to choose from.
  const closeMobileSidebar = useCallback(() => {
    onHide()
  }, [onHide])

  const handleClick = useCallback(
    (item: NavItemData) => (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      const itemUrl = item.url || ''
      const wasOpen = openDropdowns.has(itemUrl)
      setOpenDropdowns((prev) => {
        const next = new Set(prev)
        if (wasOpen) {
          next.delete(itemUrl)
        } else {
          next.add(itemUrl)
        }
        return next
      })
      if (!wasOpen && item.children?.length && item.url) {
        const storageKey = `admin.v1.sidebar.lastPage.${item.url}`
        let lastPage: string | null = null
        try {
          lastPage = localStorage.getItem(storageKey)
        } catch (e) {
          console.warn('localStorage.getItem failed:', e)
        }
        const target =
          lastPage && item.children.some((c) => c.url === lastPage)
            ? lastPage
            : item.children[0].url
        if (target) {
          navigate(target)
        }
      }
    },
    [navigate, openDropdowns]
  )

  useEffect(() => {
    for (const item of items) {
      if (item.children?.length && item.url) {
        const matchedChild = item.children.find(
          (child) => child.url && pathMatchesChild(location.pathname, child.url)
        )
        if (matchedChild?.url) {
          try {
            localStorage.setItem(
              `admin.v1.sidebar.lastPage.${item.url}`,
              matchedChild.url
            )
          } catch (e) {
            console.warn('localStorage.setItem failed:', e)
          }
        }
      }
    }
  }, [location.pathname, items])

  // ---------- render helpers (BS5-native) ----------

  const renderBadge = (badgeData?: BadgeData | null): ReactNode => {
    if (!badgeData) return null
    return (
      <Badge
        bg={badgeData.variant || 'secondary'}
        className={classNames('ms-2', badgeData.class)}
      >
        {badgeData.text}
      </Badge>
    )
  }

  const renderBadges = (item: NavItemData): ReactNode => {
    if (item.badges) {
      return (
        <>
          {item.badges.map(
            (b) =>
              b && (
                <React.Fragment
                  key={`${b.variant ?? ''}-${b.class ?? ''}-${b.text ?? ''}`}
                >
                  {renderBadge(b)}
                </React.Fragment>
              )
          )}
        </>
      )
    }
    return renderBadge(item.badge)
  }

  const renderIcon = (icon?: IconDefinition): ReactNode => {
    if (!icon) return null
    return <FontAwesomeIcon icon={icon} className="me-2" />
  }

  const renderNavLink = (item: NavItemData, key: number): ReactNode => {
    const url = item.url || ''
    const isExternal = url.startsWith('http')

    const content = (
      <>
        {renderIcon(item.icon)}
        <span className="flex-grow-1">{item.name}</span>
        {renderBadges(item)}
      </>
    )

    if (isExternal) {
      return (
        <li key={key}>
          <a
            href={url}
            className="sidebar-link d-flex align-items-center"
            onClick={closeMobileSidebar}
            {...(item.props || {})}
          >
            {content}
          </a>
        </li>
      )
    }

    return (
      <li key={key}>
        <NavLink
          to={url}
          className={({ isActive }) =>
            classNames('sidebar-link d-flex align-items-center', {
              active: isActive
            })
          }
          onClick={closeMobileSidebar}
          {...(item.props || {})}
        >
          {content}
        </NavLink>
      </li>
    )
  }

  const renderNavGroup = (item: NavItemData, key: number): ReactNode => {
    const isOpen = openDropdowns.has(item.url || '')
    const collapseId = `sidebar-group-${(item.url || String(key)).replace(/\//g, '-')}`

    return (
      <li key={key}>
        <a
          href="#"
          className="sidebar-link d-flex align-items-center"
          onClick={handleClick(item)}
          aria-expanded={isOpen}
          aria-controls={collapseId}
        >
          {renderIcon(item.icon)}
          <span className="flex-grow-1">{item.name}</span>
          {renderBadges(item)}
          <FontAwesomeIcon
            icon={faChevronRight}
            className="ms-2 sidebar-caret"
          />
        </a>
        <ul
          id={collapseId}
          className={classNames('sidebar-children list-unstyled', {
            show: isOpen
          })}
        >
          {(item.children || []).map((child, idx) => renderNavLink(child, idx))}
        </ul>
      </li>
    )
  }

  const renderItem = (item: NavItemData, idx: number): ReactNode => {
    if (item.title) {
      return (
        <li key={idx} className="mt-3 mb-1">
          <span className="d-block px-2 text-muted small fw-semibold text-uppercase">
            {item.name}
          </span>
        </li>
      )
    }
    if (item.divider) {
      return <li key={idx} className="border-top my-2" role="separator" />
    }
    if (item.children?.length) {
      return renderNavGroup(item, idx)
    }
    return renderNavLink(item, idx)
  }

  // Single Offcanvas with `responsive="lg"`: renders as a normal static
  // block at the lg breakpoint and up, and becomes a slide-over off-canvas
  // panel (with backdrop, Escape-to-close, and a close button) below it.
  // Replaces the old sidebar-minimized / sidebar-compact machinery
  // entirely — no separate desktop "minimize" mode for now (see
  // STYLING.md notes on the CoreUI sidebar removal for why).
  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      responsive="lg"
      data-bs-theme="dark"
      className="bg-dark border-end sidebar-offcanvas"
      style={{ width: 240 }}
    >
      <Offcanvas.Header closeButton className="d-lg-none border-bottom">
        <Offcanvas.Title as="span" className="fs-6 fw-semibold">
          Menu
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="d-flex flex-column p-3">
        <SidebarHeader />
        <SidebarForm />

        <nav className="flex-grow-1 overflow-auto" aria-label="Main navigation">
          <ul className="sidebar-nav mb-auto list-unstyled ps-0">
            {items.map((item, idx) => renderItem(item, idx))}
          </ul>
        </nav>

        <SidebarFooter />
      </Offcanvas.Body>
    </Offcanvas>
  )
}
