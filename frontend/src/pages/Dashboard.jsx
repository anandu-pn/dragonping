import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, TrendingUp, Activity, ArrowUp, ArrowDown, Percent, BarChart3, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import ServiceCard from '../components/ServiceCard'
import ResponseChart from '../components/ResponseChart'
import { getServices, getStatusSummary, getServiceStatus, getServiceChecks, deleteService, getPredictionsSummary, getServicePredictions } from '../api/services'

function Dashboard() {
  const [services, setServices] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [selectedChecks, setSelectedChecks] = useState([])
  const [predictions, setPredictions] = useState([])
  const [selectedPrediction, setSelectedPrediction] = useState(null)
  const [filterAtRisk, setFilterAtRisk] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const servicesData = await getServices(0, 100, false)
      
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

      const summaryData = await getStatusSummary()
      const predictionsData = await getPredictionsSummary()

      setServices(servicesWithStatus || [])
      setSummary(summaryData)
      setPredictions(predictionsData || [])

      if (servicesWithStatus && servicesWithStatus.length > 0 && !selectedServiceId) {
        setSelectedServiceId(servicesWithStatus[0].id)
        const checksData = await getServiceChecks(servicesWithStatus[0].id, 50)
        setSelectedChecks(checksData || [])
        // Fetch prediction for selected service
        const predData = await getServicePredictions(servicesWithStatus[0].id, 1)
        setSelectedPrediction(predData?.[0] || null)
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
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleServiceSelect = async (serviceId) => {
    setSelectedServiceId(serviceId)
    try {
      const checksData = await getServiceChecks(serviceId, 50)
      setSelectedChecks(checksData || [])
      const predData = await getServicePredictions(serviceId, 1)
      setSelectedPrediction(predData?.[0] || null)
    } catch (err) {
      console.error('Failed to fetch checks:', err)
    }
  }

  const handleDeleteService = async (serviceId) => {
    try {
      await deleteService(serviceId)
      setServices(services.filter((s) => s.id !== serviceId))
      if (selectedServiceId === serviceId) {
        setSelectedServiceId(null)
        setSelectedChecks([])
        setSelectedPrediction(null)
      }
    } catch (err) {
      console.error('Failed to delete service:', err)
    }
  }

  // Get prediction for a specific service from the summary
  const getPredictionForService = (serviceId) => {
    return predictions.find(p => p.service_id === serviceId)
  }

  // Count at-risk services
  const atRiskCount = predictions.filter(p => p.risk_level === 'high').length

  // Filter services if at-risk filter active
  const displayedServices = filterAtRisk
    ? services.filter(s => {
        const pred = getPredictionForService(s.id)
        return pred && pred.risk_level === 'high'
      })
    : services

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#3498db] mb-4"></div>
          <p className="text-dark-muted text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const uptimePercent = summary && summary.total_services > 0
    ? ((summary.up_services / summary.total_services) * 100).toFixed(1)
    : 0

  // Format time ago
  const timeAgo = (isoStr) => {
    if (!isoStr) return 'Never'
    const diff = (Date.now() - new Date(isoStr).getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Dashboard</h1>
          <p className="text-sm text-dark-muted mt-0.5">Real-time service monitoring overview</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 text-dark-muted hover:text-[#3498db] hover:bg-dark-card rounded-md transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Stats — 5 cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {/* Total */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#3498db]/10 border border-[#3498db]/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-[#3498db]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-dark-text font-mono leading-tight">{summary.total_services}</p>
            </div>
          </div>

          {/* Online */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#50b83c]/10 border border-[#50b83c]/20 flex items-center justify-center flex-shrink-0">
              <ArrowUp className="w-5 h-5 text-[#50b83c]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">Online</p>
              <p className="text-2xl font-bold text-[#50b83c] font-mono leading-tight">{summary.up_services}</p>
            </div>
          </div>

          {/* Offline */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#e74c3c]/10 border border-[#e74c3c]/20 flex items-center justify-center flex-shrink-0">
              <ArrowDown className="w-5 h-5 text-[#e74c3c]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">Offline</p>
              <p className="text-2xl font-bold text-[#e74c3c] font-mono leading-tight">{summary.down_services}</p>
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#9b59b6]/10 border border-[#9b59b6]/20 flex items-center justify-center flex-shrink-0">
              <Percent className="w-5 h-5 text-[#9b59b6]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">Uptime</p>
              <p className="text-2xl font-bold text-dark-text font-mono leading-tight">
                {uptimePercent}<span className="text-base text-dark-muted">%</span>
              </p>
            </div>
          </div>

          {/* At-Risk — Step 6c */}
          <button
            onClick={() => setFilterAtRisk(!filterAtRisk)}
            className={`bg-dark-card border rounded-lg p-4 flex items-center gap-4 transition-colors text-left ${
              filterAtRisk 
                ? 'border-[#f39c12]/50 bg-[#f39c12]/5' 
                : 'border-dark-border hover:border-[#f39c12]/30'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[#f39c12]/10 border border-[#f39c12]/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#f39c12]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">At-Risk</p>
              <p className="text-2xl font-bold text-[#f39c12] font-mono leading-tight">{atRiskCount}</p>
            </div>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-[#e74c3c]/10 border border-[#e74c3c]/30 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-[#e74c3c] flex-shrink-0" />
          <p className="text-[#e74c3c] text-sm">{error}</p>
        </div>
      )}

      {/* Filter badge */}
      {filterAtRisk && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-[#f39c12] bg-[#f39c12]/10 px-2.5 py-1 rounded-full border border-[#f39c12]/20 font-medium">
            Showing at-risk services only
          </span>
          <button
            onClick={() => setFilterAtRisk(false)}
            className="text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Services + Chart + Prediction */}
      {displayedServices.length > 0 ? (
        <div className="space-y-5">
          {/* Service List */}
          <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
            <div className="bg-[#0d1117] border-b border-dark-border px-5 py-3 flex justify-between items-center">
              <span className="font-semibold text-dark-text text-sm">Services</span>
              <span className="text-xs text-dark-muted">{displayedServices.length} monitors</span>
            </div>
            <div className="divide-y divide-dark-border">
              {displayedServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onDelete={handleDeleteService}
                  onClick={() => handleServiceSelect(service.id)}
                  isSelected={selectedServiceId === service.id}
                  prediction={getPredictionForService(service.id)}
                />
              ))}
            </div>
          </div>

          {/* Response Chart + Prediction Detail — Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Response Chart */}
            {selectedServiceId && selectedChecks.length > 0 ? (
              <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-dark-text text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#3498db]" />
                    Response Time
                    <span className="text-[11px] text-[#484f58] font-normal ml-1">
                      — {services.find(s => s.id === selectedServiceId)?.name || ''}
                    </span>
                  </h3>
                </div>
                <ResponseChart checks={selectedChecks} />
              </div>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-[#30363d]" />
                <p className="text-sm text-[#484f58]">Select a service to view its response chart</p>
              </div>
            )}

            {/* Prediction Detail Panel — Step 6b */}
            {selectedServiceId && selectedPrediction ? (
              <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                <h3 className="font-semibold text-dark-text text-sm flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-[#f39c12]" />
                  Prediction Analysis
                  <span className="text-[11px] text-[#484f58] font-normal ml-1">
                    — {services.find(s => s.id === selectedServiceId)?.name || ''}
                  </span>
                </h3>

                {/* Risk Level */}
                <div className="space-y-3">
                  {services.find(s => s.id === selectedServiceId)?.cert_expiry_days != null && (
                    <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
                      <span className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold">SSL cert expires</span>
                      <span className={`text-sm font-bold ${
                        services.find(s => s.id === selectedServiceId).cert_expiry_days > 30 ? 'text-[#50b83c]' : 
                        services.find(s => s.id === selectedServiceId).cert_expiry_days >= 15 ? 'text-[#f39c12]' : 'text-[#e74c3c]'
                      }`}>
                        {services.find(s => s.id === selectedServiceId).cert_expiry_days} days
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold">Risk Level</span>
                    <span className={`text-sm font-bold uppercase ${
                      selectedPrediction.risk_level === 'high' ? 'text-[#e74c3c]'
                        : selectedPrediction.risk_level === 'medium' ? 'text-[#f39c12]'
                        : 'text-[#50b83c]'
                    }`}>
                      {selectedPrediction.risk_level}
                    </span>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold">Confidence</span>
                    <span className="text-sm font-mono text-dark-text">
                      {Math.round((selectedPrediction.confidence || 0) * 100)}%
                    </span>
                  </div>

                  {/* Detection Methods */}
                  <div>
                    <span className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold block mb-2">Methods Fired</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {selectedPrediction.threshold_flag
                          ? <CheckCircle className="w-3.5 h-3.5 text-[#f39c12]" />
                          : <XCircle className="w-3.5 h-3.5 text-[#30363d]" />}
                        <span className={`text-xs ${selectedPrediction.threshold_flag ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                          Threshold
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {selectedPrediction.ewma_flag
                          ? <CheckCircle className="w-3.5 h-3.5 text-[#f39c12]" />
                          : <XCircle className="w-3.5 h-3.5 text-[#30363d]" />}
                        <span className={`text-xs ${selectedPrediction.ewma_flag ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                          EWMA
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {selectedPrediction.isolation_flag
                          ? <CheckCircle className="w-3.5 h-3.5 text-[#f39c12]" />
                          : <XCircle className="w-3.5 h-3.5 text-[#30363d]" />}
                        <span className={`text-xs ${selectedPrediction.isolation_flag ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                          Isolation Forest
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <span className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold block mb-1">Reason</span>
                    <p className="text-xs text-[#c9d1d9] bg-[#0d1117] rounded-md p-2 border border-[#21262d] leading-relaxed">
                      {selectedPrediction.reason || 'All systems nominal'}
                    </p>
                  </div>

                  {/* Last Analysed */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
                    <span className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold">Last Analysed</span>
                    <span className="text-xs font-mono text-[#484f58]">
                      {timeAgo(selectedPrediction.checked_at)}
                    </span>
                  </div>
                </div>
              </div>
            ) : selectedServiceId ? (
              <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[#30363d]" />
                <p className="text-sm text-[#484f58]">No predictions yet — analysis runs every 5 minutes</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-lg p-14 text-center">
          <Activity className="w-14 h-14 text-dark-border mx-auto mb-4" />
          <p className="text-dark-text mb-2 font-semibold text-lg">
            {filterAtRisk ? 'No at-risk services' : 'No services configured yet'}
          </p>
          <p className="text-dark-muted mb-8 text-sm max-w-md mx-auto">
            {filterAtRisk
              ? 'All services are currently showing low risk. Great!'
              : 'Get started by adding your first website or device to monitor its uptime'}
          </p>
          {filterAtRisk ? (
            <button onClick={() => setFilterAtRisk(false)} className="btn-secondary">
              Show all services
            </button>
          ) : (
            <a href="/add" className="btn-primary inline-flex items-center gap-2">
              + Add New Service
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard
