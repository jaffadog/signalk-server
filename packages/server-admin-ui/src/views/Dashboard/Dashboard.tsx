import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from 'react-bootstrap/Card'
import ProgressBar from 'react-bootstrap/ProgressBar'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Table from 'react-bootstrap/Table'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightToBracket } from '@fortawesome/free-solid-svg-icons/faArrowRightToBracket'
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons/faArrowRightFromBracket'
import classNames from 'classnames'
import { useServerStats, useWsStatus, useStore } from '../../store'
import type { ProviderStatistics, ProviderStatus } from '../../store/types'
import '../../styles/fa-pulse.css'

export default function Dashboard() {
  const serverStatistics = useServerStats()
  const websocketStatus = useWsStatus()
  const providerStatus = useStore((state) => state.providerStatus) ?? []
  const navigate = useNavigate()

  const deltaRate = serverStatistics?.deltaRate ?? 0
  const numberOfAvailablePaths = serverStatistics?.numberOfAvailablePaths ?? 0
  const wsClients = serverStatistics?.wsClients ?? 0
  const providerStatistics: Record<string, ProviderStatistics> =
    serverStatistics?.providerStatistics ?? {}
  const uptime = serverStatistics?.uptime ?? 0

  const errorCount = providerStatus.filter((s) => s.type === 'error').length
  const uptimeNum = typeof uptime === 'number' ? uptime : 0
  const uptimeD = Math.floor(uptimeNum / (60 * 60 * 24))
  const uptimeH = Math.floor((uptimeNum % (60 * 60 * 24)) / (60 * 60))
  const uptimeM = Math.floor((uptimeNum % (60 * 60)) / 60)
  const deltaRateNum = typeof deltaRate === 'number' ? deltaRate : 0
  let errors = ''
  if (errorCount > 0) {
    errors = `(${errorCount} errors)`
  }

  const getLinkType = (providerId: string): string => {
    try {
      return (
        providerStatus.find((item) => item.id === providerId)?.statusType ||
        'provider'
      )
    } catch (_) {
      return 'provider'
    }
  }

  const getInputPulseClass = (providerStats: ProviderStatistics): string => {
    const colorClass = providerStats.deltaCount ? 'text-primary' : 'text-muted'
    if ((providerStats.deltaRate || 0) > 50)
      return `${colorClass} fa-pulse-fast`
    if ((providerStats.deltaRate || 0) > 0) return `${colorClass} fa-pulse`
    return colorClass
  }

  const getOutputPulseClass = (providerStats: ProviderStatistics): string => {
    const colorClass = providerStats.writeCount ? 'text-primary' : 'text-muted'
    if ((providerStats.writeRate || 0) > 50)
      return `${colorClass} fa-pulse-fast`
    if ((providerStats.writeRate || 0) > 0) return `${colorClass} fa-pulse`
    return colorClass
  }

  const renderActivity = (
    providerId: string,
    providerStats: ProviderStatistics,
    linkType: string
  ): ReactNode => {
    return (
      <li
        key={providerId}
        className="list-group-item"
        role="button"
        onClick={() => navigate(`/dashboard`)}
      >
        <div className="d-flex align-items-center">
          <FontAwesomeIcon
            icon={faArrowRightToBracket}
            className={classNames(
              'me-2 flex-shrink-0',
              getInputPulseClass(providerStats)
            )}
          />
          <FontAwesomeIcon
            icon={faArrowRightFromBracket}
            className={classNames(
              'me-2 flex-shrink-0',
              getOutputPulseClass(providerStats)
            )}
          />
          <span className="flex-grow-1">
            {linkType === 'plugin'
              ? pluginNameLink(providerId)
              : providerIdLink(providerId)}
          </span>
          {(providerStats.writeRate || 0) > 0 && (
            <span className="text-nowrap">
              <strong>{providerStats.writeRate}</strong>{' '}
              <span className="text-muted small">msg/s</span>
            </span>
          )}
          {(providerStats.deltaRate || 0) > 0 &&
            (providerStats.writeRate || 0) > 0 && (
              <span className="text-muted small">,&nbsp;</span>
            )}
          {(providerStats.deltaRate || 0) > 0 && (
            <span className="text-nowrap">
              <strong>{providerStats.deltaRate}</strong>{' '}
              <span className="text-muted small">
                (
                {(
                  ((providerStats.deltaRate || 0) / deltaRateNum) *
                  100
                ).toFixed(0)}
                %)
              </span>{' '}
              <span className="text-muted small">deltas/s</span>
            </span>
          )}
        </div>
        <ProgressBar
          className="progress-xs mt-1"
          variant="warning"
          now={((providerStats.deltaRate || 0) / deltaRateNum) * 100}
        />
      </li>
    )
  }

  const renderStatus = (
    status: ProviderStatus,
    statusClass: string,
    lastError: string
  ): ReactNode => {
    return (
      <tr
        key={status.id}
        onClick={() => {
          navigate(
            status.statusType === 'plugin'
              ? '/apps/configuration/' + encodeURIComponent(status.id)
              : '/serverConfiguration/connections/' +
                  encodeURIComponent(status.id)
          )
        }}
      >
        <td>
          {status.statusType === 'plugin'
            ? pluginNameLink(status.id)
            : providerIdLink(status.id)}
        </td>
        <td className="text-danger text-break">{lastError}</td>
        <td className={`${statusClass} text-break`}>
          {(status.message || '').substring(0, 80)}
          {(status.message || '').length > 80 ? '...' : ''}
        </td>
      </tr>
    )
  }

  return (
    <div className="animated fadeIn">
      {websocketStatus === 'open' && (
        <div>
          <Card>
            <Card.Header>Stats</Card.Header>
            <Card.Body>
              <Row>
                <Col xs="12" md="6">
                  <div className="callout callout-primary">
                    <small className="text-muted">
                      Total server Signal K throughput (deltas/second)
                    </small>
                    <br />
                    <strong className="h4">{deltaRateNum.toFixed(1)}</strong>
                  </div>
                  <div className="callout callout-primary">
                    <small className="text-muted">
                      Number of Signal K Paths
                    </small>
                    <br />
                    <strong className="h4">{numberOfAvailablePaths}</strong>
                  </div>
                  <div className="callout callout-primary">
                    <small className="text-muted">
                      Number of WebSocket Clients
                    </small>
                    <br />
                    <strong className="h4">{wsClients}</strong>
                  </div>
                  <div className="callout callout-primary">
                    <small className="text-muted">Uptime</small>
                    <br />
                    <strong className="h5">
                      {uptimeD} days, {uptimeH} hours, {uptimeM} minutes
                    </strong>
                  </div>
                </Col>
                <Col xs="12" md="6">
                  <div className="text-muted" style={{ fontSize: '1rem' }}>
                    Connections activity
                  </div>
                  <ul className="list-group list-group-flush">
                    {Object.keys(providerStatistics || {})
                      .sort()
                      .map((providerId) => {
                        if (getLinkType(providerId) === 'provider') {
                          return renderActivity(
                            providerId,
                            providerStatistics[providerId],
                            'provider'
                          )
                        }
                        return null
                      })}
                  </ul>
                  <br></br>
                  <div className="text-muted" style={{ fontSize: '1rem' }}>
                    {Object.keys(providerStatistics || {}).some(
                      (providerId) => getLinkType(providerId) === 'plugin'
                    )
                      ? 'Plugins activity'
                      : null}
                  </div>
                  <ul className="list-group list-group-flush">
                    {Object.keys(providerStatistics || {})
                      .sort()
                      .map((providerId) => {
                        if (getLinkType(providerId) === 'plugin') {
                          return renderActivity(
                            providerId,
                            providerStatistics[providerId],
                            'plugin'
                          )
                        }
                        return null
                      })}
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              Connection & Plugin Status{' '}
              {errors && <p className="text-danger">{errors}</p>}
            </Card.Header>
            <Card.Body>
              <Row>
                <Col xs="12" md="12">
                  <Table
                    hover
                    responsive
                    bordered
                    striped
                    size="sm"
                    style={{ tableLayout: 'fixed' }}
                  >
                    <thead>
                      <tr>
                        <th style={{ width: '20%' }}>Id</th>
                        <th style={{ width: '40%' }}>Last Error</th>
                        <th style={{ width: '40%' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providerStatus.map((status) => {
                        const statusClasses: Record<string, string> = {
                          status: 'text-success',
                          warning: 'text-warning',
                          error: 'text-danger'
                        }
                        const statusClass =
                          statusClasses[status.type || ''] || ''
                        const lastError =
                          status.lastError &&
                          status.lastError !== status.message
                            ? status.lastErrorTimeStamp +
                              ': ' +
                              status.lastError
                            : ''
                        return renderStatus(status, statusClass, lastError)
                      })}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      )}

      {websocketStatus === 'closed' && (
        <Card className="border-warning">
          <Card.Header>Not connected to the server</Card.Header>
        </Card>
      )}
    </div>
  )
}

function pluginNameLink(id: string): ReactNode {
  return <a href={'#/apps/configuration/' + encodeURIComponent(id)}>{id}</a>
}

function providerIdLink(id: string): ReactNode {
  if (id === 'defaults') {
    return <a href={'#/serverConfiguration/settings'}>{id}</a>
  } else if (id.startsWith('ws.')) {
    return <a href={'#/security/devices'}>{id}</a>
  } else {
    return (
      <a href={'#/serverConfiguration/connections/' + encodeURIComponent(id)}>
        {id}
      </a>
    )
  }
}
