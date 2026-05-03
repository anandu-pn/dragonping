import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// Shared API base — reads VITE_API_URL baked in at build time, falls back to /api
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if token exists on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      setToken(savedToken)
      // Validate token by fetching current user (optional)
      // For now, just set it as valid if it exists
    }
    setLoading(false)
  }, [])

  const register = async (email, password) => {
    try {
      setError(null)
      const response = await apiClient.post('/auth/register', { email, password })
      const data = response.data
      setToken(data.access_token)
      setUser({ email })
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user_email', email)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await apiClient.post('/auth/login', { email, password })
      const data = response.data
      setToken(data.access_token)
      setUser({ email })
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user_email', email)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Login failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_email')
  }

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
