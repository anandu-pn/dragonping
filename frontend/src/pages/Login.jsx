import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity, Mail, Lock } from 'lucide-react'
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
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src={dragonLogo} alt="DragonPing" className="h-10 w-10" />
              <Activity className="w-5 h-5 text-[#50b83c]" />
            </div>
            <h1 className="text-2xl font-bold text-[#e6edf3]">DragonPing</h1>
            <p className="text-[#8b949e] text-sm mt-1">Sign in to your monitoring dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-[#e74c3c]/10 border border-[#e74c3c]/30 rounded-lg text-[#e74c3c] text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#3498db] focus:ring-1 focus:ring-[#3498db]/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#3498db] focus:ring-1 focus:ring-[#3498db]/30 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-[#50b83c] hover:bg-[#439c33] active:bg-[#3a8a2c] disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-[#8b949e] text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#3498db] hover:text-[#5dade2] font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#484f58] text-xs mt-6">
          Uptime monitoring for your infrastructure
        </p>
      </div>
    </div>
  )
}
