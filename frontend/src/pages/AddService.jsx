import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { addService } from '../api/services'

function AddService() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    interval: 30,
    active: true,
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : name === 'interval' ? parseInt(value) : value,
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Service name is required')
      return false
    }
    if (!formData.url.trim()) {
      setError('Service URL is required')
      return false
    }
    try {
      new URL(formData.url)
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)')
      return false
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
      await addService(formData)
      setSuccess(true)
      setFormData({
        name: '',
        url: '',
        description: '',
        interval: 30,
        active: true,
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
      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-12">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <h1 className="section-title">Add Service</h1>
          <p className="section-subtitle">Monitor a new website for uptime</p>
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
                placeholder="e.g., Google Search"
                className="input-field"
                disabled={loading}
              />
              <p className="text-xs text-dark-500">A friendly name to identify this service</p>
            </div>

            {/* Service URL */}
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
                placeholder="https://example.com"
                className="input-field"
                disabled={loading}
              />
              <p className="text-xs text-dark-500">Full URL including https:// or http://</p>
            </div>

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
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 bg-gradient-to-br from-blue-950/30 to-blue-900/20 border border-blue-900/30">
            <h3 className="font-bold text-dark-50 mb-3 flex items-center gap-2">
              <span className="text-xl">💡</span> Pro Tip
            </h3>
            <p className="text-sm text-dark-400 leading-relaxed">
              Use shorter check intervals for critical services (30-60s) and longer intervals for less important ones to balance accuracy and load.
            </p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-green-950/30 to-green-900/20 border border-green-900/30">
            <h3 className="font-bold text-dark-50 mb-3 flex items-center gap-2">
              <span className="text-xl">🚀</span> Best Practice
            </h3>
            <p className="text-sm text-dark-400 leading-relaxed">
              Always use descriptive service names so you can quickly identify services in your dashboard at a glance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddService
