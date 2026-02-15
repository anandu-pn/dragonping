import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader, Globe, Cpu, Wifi } from 'lucide-react'
import { addService } from '../api/services'

function AddService() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [serviceType, setServiceType] = useState('website') // 'website' or 'device'
  const [protocol, setProtocol] = useState('https') // 'http', 'https', 'icmp', 'tcp'
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    ip_address: '',
    port: '',
    description: '',
    interval: 30,
    active: true,
    is_public: false,
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : name === 'interval' || name === 'port' ? (value ? parseInt(value) : '') : value,
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Service name is required')
      return false
    }

    if (serviceType === 'website') {
      if (!formData.url.trim()) {
        setError('Website URL is required')
        return false
      }
      try {
        new URL(formData.url)
      } catch {
        setError('Please enter a valid URL (e.g., https://example.com)')
        return false
      }
    } else if (serviceType === 'device') {
      if (!formData.ip_address.trim()) {
        setError('Device IP address is required')
        return false
      }
      // Basic IP validation
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
      if (!ipPattern.test(formData.ip_address)) {
        setError('Please enter a valid IP address (e.g., 192.168.1.1)')
        return false
      }
      if (protocol === 'tcp' && !formData.port) {
        setError('Port is required for TCP monitoring')
        return false
      }
      if (formData.port && (formData.port < 1 || formData.port > 65535)) {
        setError('Port must be between 1 and 65535')
        return false
      }
    }

    if (formData.interval < 10 || formData.interval > 3600) {
      setError('Check interval must be between 10 and 3600 seconds')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      const payload = {
        name: formData.name,
        description: formData.description,
        type: serviceType,
        protocol: protocol,
        interval: formData.interval,
        active: formData.active,
        is_public: formData.is_public,
      }

      if (serviceType === 'website') {
        payload.url = formData.url
      } else if (serviceType === 'device') {
        payload.ip_address = formData.ip_address
        if (protocol === 'tcp') {
          payload.port = formData.port
        }
      }

      await addService(payload)
      setSuccess(true)
      setFormData({
        name: '',
        url: '',
        ip_address: '',
        port: '',
        description: '',
        interval: 30,
        active: true,
        is_public: false,
      })
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to add service'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-950 to-darker pb-12">
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-12">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <h1 className="section-title">Add Service</h1>
          <p className="section-subtitle">Monitor a website or network device for uptime</p>
        </div>

        <div className="card p-8 md:p-10">
          {success && (
            <div className="mb-8 p-5 bg-gradient-to-r from-green-950/50 to-green-900/30 border border-green-900/50 rounded-xl flex items-center gap-4 shadow-lg shadow-green-500/10 animate-fade-in">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-status-up" />
              </div>
              <div>
                <p className="text-green-100 font-semibold">Service added successfully!</p>
                <p className="text-green-200 text-sm mt-1">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-8 p-5 bg-gradient-to-r from-red-950/50 to-red-900/30 border border-red-900/50 rounded-xl flex items-center gap-4 shadow-lg shadow-red-500/10 animate-fade-in">
              <AlertCircle className="w-6 h-6 text-status-down flex-shrink-0" />
              <p className="text-red-100 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-dark-50 uppercase tracking-wide">
                Service Type <span className="text-status-down">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Website Option */}
                <button
                  type="button"
                  onClick={() => {
                    setServiceType('website')
                    setProtocol('https')
                  }}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    serviceType === 'website'
                      ? 'bg-emerald-900/30 border-status-up shadow-lg shadow-emerald-500/20'
                      : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <Globe className="w-6 h-6 mx-auto mb-2 text-status-up" />
                  <div className="font-semibold text-dark-50">Website</div>
                  <div className="text-xs text-dark-400 mt-1">HTTP/HTTPS endpoints</div>
                </button>

                {/* Device Option */}
                <button
                  type="button"
                  onClick={() => {
                    setServiceType('device')
                    setProtocol('icmp')
                  }}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    serviceType === 'device'
                      ? 'bg-blue-900/30 border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <Cpu className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                  <div className="font-semibold text-dark-50">Device</div>
                  <div className="text-xs text-dark-400 mt-1">Local network devices</div>
                </button>
              </div>
            </div>

            {/* Service Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-dark-50 uppercase tracking-wide">
                Service Name <span className="text-status-down">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={serviceType === 'website' ? 'e.g., Google Search' : 'e.g., Office Printer'}
                className="input-field"
                disabled={loading}
              />
              <p className="text-xs text-dark-500">A friendly name to identify this service</p>
            </div>

            {/* Website-specific fields */}
            {serviceType === 'website' && (
              <>
                {/* Protocol */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-dark-50 uppercase tracking-wide">
                    Protocol <span className="text-status-down">*</span>
                  </label>
                  <div className="flex gap-2">
                    {['http', 'https'].map((proto) => (
                      <button
                        key={proto}
                        type="button"
                        onClick={() => setProtocol(proto)}
                        disabled={loading}
                        className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          protocol === proto
                            ? 'bg-status-up text-dark-900'
                            : 'bg-dark-700/50 text-dark-300 hover:bg-dark-700'
                        }`}
                      >
                        {proto.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Website URL */}
                <div className="space-y-2">
                  <label htmlFor="url" className="block text-sm font-semibold text-dark-50 uppercase tracking-wide">
                    Website URL <span className="text-status-down">*</span>
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder={`${protocol}://example.com`}
                    className="input-field"
                    disabled={loading}
                  />
                  <p className="text-xs text-dark-500">Full URL including protocol</p>
                </div>
              </>
            )}

            {/* Device-specific fields */}
            {serviceType === 'device' && (
              <>
                {/* Protocol */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-dark-50 uppercase tracking-wide">
                    Monitoring Method <span className="text-status-down">*</span>
                  </label>
                  <div className="flex gap-2">
                    {['icmp', 'tcp'].map((proto) => (
                      <button
                        key={proto}
                        type="button"
                        onClick={() => setProtocol(proto)}
                        disabled={loading}
                        className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          protocol === proto
                            ? 'bg-blue-500 text-dark-900'
                            : 'bg-dark-700/50 text-dark-300 hover:bg-dark-700'
                        }`}
                      >
                        {proto === 'icmp' ? 'Ping (ICMP)' : 'TCP Port'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-dark-500">
                    {protocol === 'icmp' ? 'Sends ICMP ping packets' : 'Checks TCP port connectivity'}
                  </p>
                </div>

                {/* IP Address */}
                <div className="space-y-2">
                  <label htmlFor="ip_address" className="block text-sm font-semibold text-dark-50 uppercase tracking-wide">
                    Device IP Address <span className="text-status-down">*</span>
                  </label>
                  <input
                    type="text"
                    id="ip_address"
                    name="ip_address"
                    value={formData.ip_address}
                    onChange={handleInputChange}
                    placeholder="192.168.1.100"
                    className="input-field"
                    disabled={loading}
                  />
                  <p className="text-xs text-dark-500">Local or remote device IP address</p>
                </div>

                {/* TCP Port (only for TCP monitoring) */}
                {protocol === 'tcp' && (
                  <div className="space-y-2">
                    <label htmlFor="port" className="block text-sm font-semibold text-dark-50 uppercase tracking-wide">
                      Port <span className="text-status-down">*</span>
                    </label>
                    <input
                      type="number"
                      id="port"
                      name="port"
                      value={formData.port}
                      onChange={handleInputChange}
                      placeholder="80, 443, 3306, etc."
                      min="1"
                      max="65535"
                      className="input-field"
                      disabled={loading}
                    />
                    <p className="text-xs text-dark-500">Port number to check (1-65535)</p>
                  </div>
                )}
              </>
            )}

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-semibold text-dark-50 uppercase tracking-wide">
                Description <span className="text-dark-500 font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add notes about this service..."
                rows="3"
                className="input-field resize-none"
                disabled={loading}
              />
              <p className="text-xs text-dark-500">Any additional notes for your reference</p>
            </div>

            {/* Check Interval */}
            <div className="space-y-2">
              <label htmlFor="interval" className="block text-sm font-semibold text-dark-50 uppercase tracking-wide">
                Check Interval <span className="text-status-down">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="range"
                    id="interval-range"
                    min="10"
                    max="3600"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
                    className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-status-up"
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-2 bg-dark-700/50 px-4 py-2 rounded-lg border border-dark-600/50 min-w-fit">
                  <input
                    type="number"
                    id="interval"
                    name="interval"
                    value={formData.interval}
                    onChange={handleInputChange}
                    min="10"
                    max="3600"
                    className="w-16 bg-dark-700/50 text-dark-50 font-semibold text-center focus:outline-none"
                    disabled={loading}
                  />
                  <span className="text-dark-400 font-medium">sec</span>
                </div>
              </div>
              <p className="text-xs text-dark-500">How often to check uptime (10 seconds to 1 hour)</p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-4 p-4 bg-dark-900/50 rounded-lg border border-dark-700/30">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="w-5 h-5 rounded cursor-pointer accent-status-up"
                disabled={loading}
              />
              <label htmlFor="active" className="text-sm font-semibold text-dark-50 cursor-pointer flex-1">
                Enable Monitoring
                <p className="text-xs text-dark-500 font-normal mt-1">Start monitoring this service immediately</p>
              </label>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center gap-4 p-4 bg-dark-900/50 rounded-lg border border-dark-700/30">
              <input
                type="checkbox"
                id="is_public"
                name="is_public"
                checked={formData.is_public}
                onChange={handleInputChange}
                className="w-5 h-5 rounded cursor-pointer accent-blue-500"
                disabled={loading}
              />
              <label htmlFor="is_public" className="text-sm font-semibold text-dark-50 cursor-pointer flex-1">
                Show on Public Status Page
                <p className="text-xs text-dark-500 font-normal mt-1">Make this service visible without login</p>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-8 border-t border-dark-700/30">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Adding Service...
                  </>
                ) : (
                  '✓ Add Service'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={loading}
                className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Tips Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 bg-gradient-to-br from-blue-950/30 to-blue-900/20 border border-blue-900/30">
            <h3 className="font-bold text-dark-50 mb-3 flex items-center gap-2">
              <span className="text-xl">🌐</span> Websites
            </h3>
            <p className="text-sm text-dark-400 leading-relaxed">Monitor HTTP/HTTPS endpoints for uptime and response times.</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-green-950/30 to-green-900/20 border border-green-900/30">
            <h3 className="font-bold text-dark-50 mb-3 flex items-center gap-2">
              <span className="text-xl">📡</span> ICMP Ping
            </h3>
            <p className="text-sm text-dark-400 leading-relaxed">Check if devices are reachable using ping (ICMP protocol).</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-purple-950/30 to-purple-900/20 border border-purple-900/30">
            <h3 className="font-bold text-dark-50 mb-3 flex items-center gap-2">
              <span className="text-xl">🔌</span> TCP Port
            </h3>
            <p className="text-sm text-dark-400 leading-relaxed">Monitor specific ports on devices (SSH, RDP, databases).</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddService
