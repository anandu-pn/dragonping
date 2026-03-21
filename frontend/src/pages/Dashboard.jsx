import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, TrendingUp, Activity } from 'lucide-react'
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
    <div className="min-h-screen bg-dark-bg pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark-text">Dashboard</h1>
            <p className="text-sm text-dark-muted mt-1">Monitor your services</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-dark-muted hover:text-[#3498db] hover:bg-dark-card rounded-md transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-dark-card border border-dark-border rounded-md p-5 shadow-sm">
              <p className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">Total Services</p>
              <p className="text-3xl font-bold text-dark-text">{summary.total_services}</p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-md p-5 shadow-sm">
              <p className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">Online</p>
              <p className="text-3xl font-bold text-[#50b83c]">{summary.up_services}</p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-md p-5 shadow-sm">
              <p className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">Offline</p>
              <p className="text-3xl font-bold text-[#e74c3c]">{summary.down_services}</p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-md p-5 shadow-sm">
              <p className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">Overall Uptime</p>
              <p className="text-3xl font-bold text-[#3498db]">
                {summary.total_services > 0
                  ? ((summary.up_services / summary.total_services) * 100).toFixed(1)
                  : 0}
                <span className="text-xl">%</span>
              </p>
            </div>
          </div>
        )}

      {/* Error Message */}
      {error && (
        <div className="bg-[#e74c3c]/10 border-l-4 border-[#e74c3c] p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#e74c3c] flex-shrink-0" />
          <p className="text-[#e74c3c] font-medium text-sm">{error}</p>
        </div>
      )}

      {/* Services Grid */}
      {services.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-6">
          
          <div className="flex-1">
            <div className="bg-dark-card border border-dark-border rounded-md shadow-sm overflow-hidden mb-8">
              <div className="bg-dark-bg border-b border-dark-border px-6 py-3 flex justify-between items-center">
                 <span className="font-semibold text-dark-text text-sm">Service List</span>
              </div>
              <div className="divide-y divide-dark-border">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onDelete={handleDeleteService}
                    onClick={() => handleServiceSelect(service.id)}
                    isSelected={selectedServiceId === service.id}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="md:w-2/5">
            {selectedServiceId && selectedChecks.length > 0 ? (
              <div className="bg-dark-card border border-dark-border rounded-md shadow-sm p-5 sticky top-24">
                <h3 className="font-semibold text-dark-text mb-4 text-sm">Response Time Trend</h3>
                <ResponseChart checks={selectedChecks} title="Last 50 Checks" />
              </div>
            ) : (
                <div className="bg-dark-card border border-dark-border rounded-md shadow-sm p-8 text-center text-dark-muted sticky top-24">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-dark-border" />
                  <p className="text-sm">Select a service to view response time details.</p>
                </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-md shadow-sm p-12 text-center">
          <AlertCircle className="w-12 h-12 text-dark-border mx-auto mb-4" />
          <p className="text-dark-text mb-2 font-semibold">No services configured yet</p>
          <p className="text-dark-muted mb-6 text-sm">Get started by adding your first website to monitor</p>
          <a
            href="/add"
            className="btn-primary"
          >
            + Add New Service
          </a>
        </div>
      )}


      </div>
    </div>
  )
}

export default Dashboard
