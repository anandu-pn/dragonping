import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Plus, History, Activity, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/add', label: 'Add Service', icon: Plus },
    { path: '/logs', label: 'Logs', icon: History },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-gradient-to-r from-dark-800/80 to-dark-900/80 border-b border-dark-700/30 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-dark-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 group">
            <div className="relative">
              <Activity className="w-8 h-8 text-status-up group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-status-up/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gradient hidden sm:inline">DragonPing</span>
              <span className="text-xs text-dark-500 hidden sm:inline">Uptime Monitor</span>
              <span className="text-lg font-bold text-gradient sm:hidden">DP</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 group ${
                  isActive(path)
                    ? 'bg-gradient-to-r from-status-up to-green-500 text-dark-900 shadow-lg shadow-green-500/30'
                    : 'text-dark-300 hover:text-dark-50 hover:bg-dark-700/50 border border-transparent hover:border-dark-600/30'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive(path) ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-sm text-dark-300">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-700/50 border border-green-900/30 backdrop-blur-sm">
                <div className="w-2.5 h-2.5 bg-status-up rounded-full animate-pulse shadow-lg shadow-status-up/50"></div>
                <span className="hidden sm:inline font-medium">Live</span>
              </div>
            </div>

            {/* User Email */}
            {user && (
              <span className="text-sm font-medium text-dark-300 hidden sm:inline">
                {user.email}
              </span>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 text-dark-300 hover:text-red-400 hover:bg-dark-700/50 border border-transparent hover:border-red-900/30"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
