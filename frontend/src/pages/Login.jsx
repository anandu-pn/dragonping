import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import dragonLogo from '../../resources/dragonping-logo-removebg-preview.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      navigate('/')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-card border border-dark-border rounded-lg shadow-sm p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src={dragonLogo}
              alt="DragonPing"
              className="h-16 w-16 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-dark-text">DragonPing</h1>
            <p className="text-dark-muted mt-2">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-[#e74c3c]/10 border border-[#e74c3c] rounded text-[#e74c3c] text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-text mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:border-[#3498db] focus:ring-1 focus:ring-[#3498db]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-text mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:border-[#3498db] focus:ring-1 focus:ring-[#3498db]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[#50b83c] hover:bg-[#439c33] disabled:opacity-50 text-white font-medium rounded-lg transition-colors duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-dark-muted text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#3498db] hover:text-[#2980b9] font-medium">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-dark-border">
            <p className="text-dark-muted text-xs text-center">
              Demo credentials: admin@example.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
