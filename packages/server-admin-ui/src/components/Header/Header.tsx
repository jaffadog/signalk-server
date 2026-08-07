import { useState, type MouseEvent } from 'react'
import Alert from 'react-bootstrap/Alert'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Navbar from 'react-bootstrap/Navbar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons/faCircleNotch'
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock'
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons/faEllipsisVertical'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons/faTriangleExclamation'
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck'
import {
  useLoginStatus,
  useRestarting,
  useRestartRequired,
  useBackpressureWarning
} from '../../store'
import { logoutAction, restartAction } from '../../actions'
import { MODES, useTheme } from '../../hooks/useTheme'
import signalKLogo from '../../assets/signal-k-logo-image-text.svg'

// Header banners are absolutely positioned just below the navbar. The
// stacked offset places a second banner below the first when both show.
const BANNER_TOP = '55px'
const BANNER_TOP_STACKED = '100px'

interface HeaderProps {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const loginStatus = useLoginStatus()
  const restarting = useRestarting()
  const restartRequired = useRestartRequired()
  const backpressureWarning = useBackpressureWarning()

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen)
  }

  const mobileSidebarToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    onToggleSidebar()
  }

  const handleLogout = () => {
    logoutAction()
  }

  const handleRestart = () => {
    restartAction()
  }

  const showRestartBanner =
    restartRequired &&
    loginStatus.status === 'loggedIn' &&
    loginStatus.userLevel === 'admin'

  const { theme, setTheme } = useTheme()
  const activeMode = MODES.find((m) => m.mode === theme)!

  return (
    <Navbar
      as="header"
      expand="lg"
      fixed="top"
      bg="body-tertiary"
      className="border-bottom app-navbar"
    >
      {showRestartBanner && (
        <Alert
          variant="warning"
          className="restart-required-warning"
          style={{
            position: 'absolute',
            top: BANNER_TOP,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1050,
            margin: 0,
            padding: '8px 16px',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <FontAwesomeIcon icon={faTriangleExclamation} /> Server settings
          changed –{' '}
          <Alert.Link href="#/" onClick={handleRestart}>
            restart the server
          </Alert.Link>{' '}
          for them to take effect.
        </Alert>
      )}
      {backpressureWarning && (
        <Alert
          variant="warning"
          className="backpressure-warning"
          style={{
            position: 'absolute',
            top: showRestartBanner ? BANNER_TOP_STACKED : BANNER_TOP,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1050,
            margin: 0,
            padding: '8px 16px',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <FontAwesomeIcon icon={faTriangleExclamation} /> Network congestion
          detected – some updates were skipped. Check your connection.
        </Alert>
      )}
      <button
        type="button"
        className="navbar-toggler d-lg-none"
        onClick={mobileSidebarToggle}
        aria-label="Toggle sidebar"
      >
        <span className="navbar-toggler-icon" />
      </button>
      <Navbar.Brand href="#" className="ms-2">
        <img
          src={signalKLogo}
          style={{ width: 110, height: 'auto' }}
          alt="Signal K"
        />
      </Navbar.Brand>
      <Nav className="ms-auto">
        {/* Desktop: show items directly */}
        <NavDropdown
          align="end"
          className="theme-dropdown d-none d-sm-block"
          title={<FontAwesomeIcon icon={activeMode.icon} />}
          id="basic-nav-dropdown"
        >
          {MODES.map(({ mode, label, icon }) => (
            <NavDropdown.Item
              key={mode}
              active={theme === mode}
              onClick={() => setTheme(mode)}
              className="d-flex justify-content-between align-items-center"
            >
              <span>
                <FontAwesomeIcon icon={icon} className="me-2" /> {label}
              </span>
              {theme === mode && <FontAwesomeIcon icon={faCheck} />}
            </NavDropdown.Item>
          ))}
        </NavDropdown>{' '}
        {loginStatus.status === 'loggedIn' &&
          loginStatus.userLevel === 'admin' && (
            <Nav.Item className="d-none d-sm-block">
              <Nav.Link href="#/" onClick={handleRestart}>
                <FontAwesomeIcon
                  icon={faCircleNotch}
                  spin={restarting}
                  className={restarting ? 'text-danger' : ''}
                />{' '}
                Restart
              </Nav.Link>
            </Nav.Item>
          )}
        {loginStatus.status === 'loggedIn' && (
          <Nav.Item className="d-none d-sm-block">
            <Nav.Link href="#/" onClick={handleLogout}>
              <FontAwesomeIcon icon={faLock} /> Logout
            </Nav.Link>
          </Nav.Item>
        )}
        {loginStatus.status !== 'loggedIn' &&
          loginStatus.authenticationRequired && (
            <Nav.Item className="d-none d-sm-block px-3">
              <Nav.Link href="#/login">
                <FontAwesomeIcon icon={faLock} /> Login
              </Nav.Link>
            </Nav.Item>
          )}
        {/* Mobile: consolidate into one menu. Icon is deliberately not a
            hamburger — the sidebar toggle on the far left already owns that
            glyph, and using it twice in the same header reads as one broken
            control rather than two distinct ones. */}
        <NavDropdown
          className="d-sm-none"
          align="end"
          show={dropdownOpen}
          onToggle={toggleDropdown}
          title={<FontAwesomeIcon icon={faEllipsisVertical} />}
          id="mobile-nav-dropdown"
        >
          {MODES.map(({ mode, label, icon }) => (
            <NavDropdown.Item
              key={mode}
              active={theme === mode}
              onClick={() => setTheme(mode)}
              className="d-flex justify-content-between align-items-center"
            >
              <span>
                <FontAwesomeIcon icon={icon} className="me-2" /> {label}
              </span>
              {theme === mode && <FontAwesomeIcon icon={faCheck} />}
            </NavDropdown.Item>
          ))}
          {loginStatus.status === 'loggedIn' &&
            loginStatus.userLevel === 'admin' && (
              <NavDropdown.Item onClick={handleRestart}>
                <FontAwesomeIcon
                  icon={faCircleNotch}
                  spin={restarting}
                  className={restarting ? 'text-danger' : ''}
                />{' '}
                Restart
              </NavDropdown.Item>
            )}
          {loginStatus.status === 'loggedIn' && (
            <NavDropdown.Item onClick={handleLogout}>
              <FontAwesomeIcon icon={faLock} /> Logout
            </NavDropdown.Item>
          )}
          {loginStatus.status !== 'loggedIn' &&
            loginStatus.authenticationRequired && (
              <NavDropdown.Item href="#/login">
                <FontAwesomeIcon icon={faLock} /> Login
              </NavDropdown.Item>
            )}
        </NavDropdown>
      </Nav>
    </Navbar>
  )
}
