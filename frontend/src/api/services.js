import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_email')
      // Optionally redirect to login (can be done in component)
    }
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// ============== Services ==============

/**
 * Get all services
 * @param {number} skip - Pagination offset
 * @param {number} limit - Pagination limit
 * @param {boolean} activeOnly - Filter active services only
 * @returns {Promise<Array>}
 */
export const getServices = async (skip = 0, limit = 100, activeOnly = false) => {
  try {
    const response = await apiClient.get('/services', {
      params: { skip, limit, active_only: activeOnly }
    })
    return response.data
  } catch (error) {
    console.error('Failed to fetch services:', error)
    throw error
  }
}

/**
 * Get single service by ID
 * @param {number} serviceId - Service ID
 * @returns {Promise<Object>}
 */
export const getService = async (serviceId) => {
  try {
    const response = await apiClient.get(`/services/${serviceId}`)
    return response.data
  } catch (error) {
    console.error(`Failed to fetch service ${serviceId}:`, error)
    throw error
  }
}

/**
 * Create new service
 * @param {Object} data - Service data
 * @param {string} data.name - Service name
 * @param {string} [data.url] - Service URL (for website type)
 * @param {string} [data.ip_address] - Device IP (for device type)
 * @param {string} [data.description] - Service description
 * @param {string} data.type - Service type ('website' or 'device')
 * @param {string} data.protocol - Protocol ('https', 'http', 'icmp', 'tcp')
 * @param {number} [data.port] - Port number (for TCP)
 * @param {number} [data.interval] - Check interval in seconds
 * @param {boolean} [data.active] - Enable monitoring
 * @param {boolean} [data.is_public] - Make service public
 * @returns {Promise<Object>}
 */
export const addService = async (data) => {
  try {
    const payload = {
      name: data.name,
      type: data.type,
      protocol: data.protocol,
      description: data.description || '',
      interval: data.interval || 30,
      active: data.active !== false,
      is_public: data.is_public || false,
    }

    // Add URL for website services
    if (data.url !== undefined) {
      payload.url = data.url
    }

    // Add device-specific fields for device services
    if (data.ip_address !== undefined) {
      payload.ip_address = data.ip_address
    }

    if (data.port !== undefined) {
      payload.port = data.port
    }

    const response = await apiClient.post('/services', payload)
    return response.data
  } catch (error) {
    console.error('Failed to add service:', error)
    throw error
  }
}

/**
 * Update service
 * @param {number} serviceId - Service ID
 * @param {Object} data - Updated service data
 * @returns {Promise<Object>}
 */
export const updateService = async (serviceId, data) => {
  try {
    const response = await apiClient.put(`/services/${serviceId}`, data)
    return response.data
  } catch (error) {
    console.error(`Failed to update service ${serviceId}:`, error)
    throw error
  }
}

/**
 * Delete service
 * @param {number} serviceId - Service ID
 * @returns {Promise<void>}
 */
export const deleteService = async (serviceId) => {
  try {
    await apiClient.delete(`/services/${serviceId}`)
  } catch (error) {
    console.error(`Failed to delete service ${serviceId}:`, error)
    throw error
  }
}

// ============== Status & Monitoring ==============

/**
 * Get service status and stats
 * @param {number} serviceId - Service ID
 * @returns {Promise<Object>}
 */
export const getServiceStatus = async (serviceId) => {
  try {
    const response = await apiClient.get(`/status/service/${serviceId}`)
    return response.data
  } catch (error) {
    console.error(`Failed to fetch status for service ${serviceId}:`, error)
    throw error
  }
}

/**
 * Get service check history
 * @param {number} serviceId - Service ID
 * @param {number} limit - Number of checks to retrieve
 * @returns {Promise<Array>}
 */
export const getServiceChecks = async (serviceId, limit = 50) => {
  try {
    const response = await apiClient.get(`/status/service/${serviceId}/checks`, {
      params: { limit }
    })
    return response.data
  } catch (error) {
    console.error(`Failed to fetch checks for service ${serviceId}:`, error)
    throw error
  }
}

/**
 * Get all services status summary
 * @returns {Promise<Object>}
 */
export const getStatusSummary = async () => {
  try {
    const response = await apiClient.get('/status/summary')
    return response.data
  } catch (error) {
    console.error('Failed to fetch status summary:', error)
    throw error
  }
}

// ============== Utility Functions ==============

/**
 * Get status badge info
 * @param {string} status - Status string ("UP" or "DOWN")
 * @param {number} responseTime - Response time in milliseconds
 * @returns {Object}
 */
export const getStatusInfo = (status, responseTime) => {
  if (status === 'UP') {
    const isSlowResponse = responseTime > 2000
    return {
      status: 'UP',
      color: isSlowResponse ? 'slow' : 'up',
      label: isSlowResponse ? 'SLOW' : 'UP',
      icon: isSlowResponse ? '⚠️' : '✓',
    }
  }
  return {
    status: 'DOWN',
    color: 'down',
    label: 'DOWN',
    icon: '✕',
  }
}

/**
 * Format response time
 * @param {number} ms - Milliseconds
 * @returns {string}
 */
export const formatResponseTime = (ms) => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Format date time
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Calculate uptime percentage display
 * @param {number} percentage - Uptime percentage (0-100)
 * @returns {string}
 */
export const formatUptimePercentage = (percentage) => {
  return `${percentage.toFixed(2)}%`
}

// ============== Predictions ==============

/**
 * Get prediction summary for all services (latest prediction per service)
 * @returns {Promise<Array>}
 */
export const getPredictionsSummary = async () => {
  try {
    const response = await apiClient.get('/predictions/summary')
    return response.data
  } catch (error) {
    console.error('Failed to fetch predictions summary:', error)
    return []
  }
}

/**
 * Get prediction history for a specific service
 * @param {number} serviceId - Service ID
 * @param {number} limit - Number of predictions to retrieve
 * @returns {Promise<Array>}
 */
export const getServicePredictions = async (serviceId, limit = 20) => {
  try {
    const response = await apiClient.get(`/predictions/${serviceId}`, {
      params: { limit }
    })
    return response.data
  } catch (error) {
    console.error(`Failed to fetch predictions for service ${serviceId}:`, error)
    return []
  }
}

export default {
  getServices,
  getService,
  addService,
  updateService,
  deleteService,
  getServiceStatus,
  getServiceChecks,
  getStatusSummary,
  getStatusInfo,
  formatResponseTime,
  formatDateTime,
  formatUptimePercentage,
  getPredictionsSummary,
  getServicePredictions,
}
