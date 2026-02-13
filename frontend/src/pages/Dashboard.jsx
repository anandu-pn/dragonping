import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import ResponseChart from '../components/ResponseChart'
import { getServices, getStatusSummary, getServiceStatus, getServiceChecks, deleteService } from '../api/services'

function Dashboard() {
  const [services, setServices] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [selectedChecks, setSelectedChecks] = useState([])

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get basic services
      const servicesData = await getServices(0, 100, false)
      
      // Fetch status for each service
      let servicesWithStatus = []
      if (servicesData && servicesData.length > 0) {
        servicesWithStatus = await Promise.all(
          servicesData.map(async (service) => {
            try {
              const status = await getServiceStatus(service.id)
              return { ...service, ...status }
            } catch (err) {
              console.error(`Failed to fetch status for service ${service.id}:`, err)
              return service
            }
          })
        )
      }

      // Get summary
      const summaryData = await getStatusSummary()

      setServices(servicesWithStatus || [])
      setSummary(summaryData)

      // Auto-select first service for chart
      if (servicesWithStatus && servicesWithStatus.length > 0 && !selectedServiceId) {
        setSelectedServiceId(servicesWithStatus[0].id)
        // Fetch checks for first service
        const checksData = await getServiceChecks(servicesWithStatus[0].id, 50)
        setSelectedChecks(checksData || [])
      }
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  // Handle service selection for chart
  const handleServiceSelect = async (serviceId) => {
    setSelectedServiceId(serviceId)
    try {
      const checksData = await getServiceChecks(serviceId, 50)
      setSelectedChecks(checksData || [])
    } catch (err) {
      console.error('Failed to fetch checks:', err)
    }
  }

  // Handle service deletion
  const handleDeleteService = async (serviceId) => {
    try {
      await deleteService(serviceId)
      setServices(services.filter((s) => s.id !== serviceId))
      if (selectedServiceId === serviceId) {
        setSelectedServiceId(null)
        setSelectedChecks([])
      }
    } catch (err) {
      console.error('Failed to delete service:', err)
    }
  }

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <RefreshCw className="w-12 h-12 text-status-up" />
          </div>
          <p className="text-dark-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-950 to-darker pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 animate-fade-in">
          <div>
            <h1 className="section-title">Dashboard</h1>
            <p className="section-subtitle">Monitor your website uptime in real-time</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-3 text-dark-400 hover:text-status-up hover:bg-dark-700/50 rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-110"
            title="Refresh"
          >
            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="stat-card group cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-xs font-semibold uppercase tracking-wide mb-3">Total Services</p>
                  <p className="text-4xl font-bold text-dark-50">{summary.total_services}</p>
                  <p className="text-dark-500 text-xs mt-3">Services being monitored</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-3 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all">
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="stat-card group cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-xs font-semibold uppercase tracking-wide mb-3">Online</p>
                  <p className="text-4xl font-bold text-status-up">{summary.up_services}</p>
                  <p className="text-dark-500 text-xs mt-3">Operational</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-3 rounded-xl group-hover:from-green-500/30 group-hover:to-green-600/20 transition-all">
                  <span className="text-2xl">✓</span>
                </div>
              </div>
            </div>

            <div className="stat-card group cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-xs font-semibold uppercase tracking-wide mb-3">Offline</p>
                  <p className="text-4xl font-bold text-status-down">{summary.down_services}</p>
                  <p className="text-dark-500 text-xs mt-3">Need attention</p>
                </div>
                <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 p-3 rounded-xl group-hover:from-red-500/30 group-hover:to-red-600/20 transition-all">
                  <span className="text-2xl">✕</span>
                </div>
              </div>
            </div>

            <div className="stat-card group cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-xs font-semibold uppercase tracking-wide mb-3">Uptime</p>
                  <p className="text-4xl font-bold text-gradient">
                    {summary.total_services > 0
                      ? ((summary.up_services / summary.total_services) * 100).toFixed(1)
                      : 0}
                    <span className="text-xl">%</span>
                  </p>
                  <p className="text-dark-500 text-xs mt-3">This period</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-3 rounded-xl group-hover:from-amber-500/30 group-hover:to-amber-600/20 transition-all">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Error Message */}
      {error && (
        <div className="card bg-gradient-to-r from-red-950/50 to-red-900/30 border border-red-900/50 p-5 flex items-center gap-4 shadow-lg shadow-red-500/10">
          <AlertCircle className="w-6 h-6 text-status-down flex-shrink-0" />
          <p className="text-red-100 font-medium">{error}</p>
        </div>
      )}

      {/* Services Grid */}
      {services.length > 0 ? (
        <div className="animate-fade-in">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-dark-50">Services</h2>
            <p className="text-dark-500 text-sm mt-2">{services.length} service{services.length !== 1 ? 's' : ''} monitored</p>
          </div>
          <div className="grid-responsive">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onDelete={handleDeleteService}
                onClick={() => handleServiceSelect(service.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center border-2 border-dashed border-dark-600/50 bg-dark-900/50">
          <AlertCircle className="w-16 h-16 text-dark-600 mx-auto mb-6 opacity-50" />
          <p className="text-dark-300 mb-2 text-lg font-medium">No services configured yet</p>
          <p className="text-dark-400 mb-8">Get started by adding your first website to monitor</p>
          <a
            href="/add"
            className="btn-primary inline-block"
          >
            + Add Your First Service
          </a>
        </div>
      )}

      {/* Response Time Chart */}
      {selectedServiceId && selectedChecks.length > 0 && (
        <div className="animate-fade-in mt-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-dark-50">Response Time Trend</h2>
            <p className="text-dark-500 text-sm mt-2">Performance over the last 50 checks</p>
          </div>
          <div className="card p-8">
            <ResponseChart checks={selectedChecks} title="Response Time (Last 50 Checks)" />
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Dashboard
