import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Download, ChevronUp, ChevronDown } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { getServices, getServiceChecks } from '../api/services'

function Logs() {
  const [services, setServices] = useState([])
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'checked_at', direction: 'desc' })
  const [expandedChecks, setExpandedChecks] = useState(new Set())

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getServices(0, 100, false)
      setServices(data || [])
      if (data && data.length > 0 && !selectedServiceId) {
        setSelectedServiceId(data[0].id)
        await fetchChecks(data[0].id)
      }
    } catch (err) {
      setError('Failed to load services')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchChecks = async (serviceId) => {
    try {
      const data = await getServiceChecks(serviceId, 200)
      setChecks(data || [])
    } catch (err) {
      console.error('Failed to fetch checks:', err)
      setError('Failed to load check history')
    }
  }

  useEffect(() => {
    fetchServices()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (selectedServiceId) {
        fetchChecks(selectedServiceId)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleServiceChange = async (serviceId) => {
    setSelectedServiceId(serviceId)
    await fetchChecks(serviceId)
  }

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc',
    })
  }

  const getSortedChecks = () => {
    const sorted = [...checks].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      if (sortConfig.key === 'checked_at') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      }

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    return sorted
  }

  const toggleCheckExpanded = (checkId) => {
    const newExpanded = new Set(expandedChecks)
    if (newExpanded.has(checkId)) {
      newExpanded.delete(checkId)
    } else {
      newExpanded.add(checkId)
    }
    setExpandedChecks(newExpanded)
  }

  const handleExportCSV = () => {
    const headers = ['Time', 'Status', 'Response Time (ms)', 'Status Code', 'Error']
    const rows = getSortedChecks().map((check) => [
      new Date(check.checked_at).toLocaleString(),
      check.status,
      check.response_time,
      check.status_code || 'N/A',
      check.error_message || 'N/A',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${selectedServiceId}-${new Date().getTime()}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const sortedChecks = getSortedChecks()
  const selectedService = services.find((s) => s.id === selectedServiceId)
  const upCount = checks.filter((c) => c.status === 'UP').length
  const downCount = checks.filter((c) => c.status === 'DOWN').length
  const avgResponseTime =
    checks.length > 0 ? checks.reduce((sum, c) => sum + (c.response_time || 0), 0) / checks.length : 0

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-status-up animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Loading logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-dark-50">Check History</h1>
          <p className="text-dark-400 mt-2">View detailed logs of all service checks</p>
        </div>
        <button
          onClick={() => selectedServiceId && fetchChecks(selectedServiceId)}
          disabled={loading}
          className="p-2 text-dark-400 hover:text-status-up hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="card bg-red-950 border-red-900 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-status-down flex-shrink-0" />
          <p className="text-red-100">{error}</p>
        </div>
      )}

      {/* Service Selector */}
      <div className="card p-4">
        <label htmlFor="service-select" className="block text-sm font-medium text-dark-50 mb-2">
          Select Service
        </label>
        <select
          id="service-select"
          value={selectedServiceId || ''}
          onChange={(e) => handleServiceChange(parseInt(e.target.value))}
          className="input-field"
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.url})
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      {selectedService && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-6">
            <p className="text-dark-400 text-sm">Total Checks</p>
            <p className="text-3xl font-bold text-dark-50">{checks.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-dark-400 text-sm">Up</p>
            <p className="text-3xl font-bold text-status-up">{upCount}</p>
          </div>
          <div className="card p-6">
            <p className="text-dark-400 text-sm">Down</p>
            <p className="text-3xl font-bold text-status-down">{downCount}</p>
          </div>
          <div className="card p-6">
            <p className="text-dark-400 text-sm">Avg Response</p>
            <p className="text-3xl font-bold text-dark-50">
              {avgResponseTime < 1000 ? `${Math.round(avgResponseTime)}ms` : `${(avgResponseTime / 1000).toFixed(2)}s`}
            </p>
          </div>
        </div>
      )}

      {/* Export Button */}
      {checks.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export as CSV
          </button>
        </div>
      )}

      {/* Logs Table */}
      {checks.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700 bg-dark-900">
                  <th
                    onClick={() => handleSort('checked_at')}
                    className="px-6 py-3 text-left text-sm font-semibold text-dark-50 cursor-pointer hover:bg-dark-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Time
                      {sortConfig.key === 'checked_at' && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="px-6 py-3 text-left text-sm font-semibold text-dark-50 cursor-pointer hover:bg-dark-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortConfig.key === 'status' && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('response_time')}
                    className="px-6 py-3 text-left text-sm font-semibold text-dark-50 cursor-pointer hover:bg-dark-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Response Time
                      {sortConfig.key === 'response_time' && (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark-50">Status Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark-50">Error</th>
                </tr>
              </thead>
              <tbody>
                {sortedChecks.slice(0, 100).map((check) => (
                  <tr key={check.id} className="border-b border-dark-700 hover:bg-dark-800 transition-colors">
                    <td
                      className="px-6 py-4 text-sm text-dark-300 cursor-pointer"
                      onClick={() => toggleCheckExpanded(check.id)}
                    >
                      {new Date(check.checked_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={check.status} responseTime={check.response_time} />
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">
                      {check.response_time ? (
                        check.response_time < 1000 ? (
                          `${Math.round(check.response_time)}ms`
                        ) : (
                          `${(check.response_time / 1000).toFixed(2)}s`
                        )
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">{check.status_code || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-dark-300 max-w-xs truncate">
                      {check.error_message ? (
                        <span
                          title={check.error_message}
                          className="text-status-down"
                        >
                          {check.error_message}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedChecks.length > 100 && (
            <div className="px-6 py-3 bg-dark-900 text-sm text-dark-400 border-t border-dark-700">
              Showing 100 of {sortedChecks.length} checks
            </div>
          )}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <AlertCircle className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No check history available</p>
        </div>
      )}
    </div>
  )
}

export default Logs
