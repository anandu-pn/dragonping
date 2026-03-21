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
    <nav className="bg-dark-card border-b border-dark-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="w-7 h-7 text-[#50b83c]" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-dark-text hidden sm:inline leading-none">DragonPing</span>
              <span className="text-[10px] text-dark-muted hidden sm:inline tracking-wide font-medium">UPTIME MONITOR</span>
              <span className="text-lg font-bold text-dark-text sm:hidden">DP</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors text-sm ${
                  isActive(path)
                    ? 'bg-dark-border text-[#3498db]'
                    : 'text-dark-muted hover:text-dark-text hover:bg-dark-bg'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#50b83c]/10 border border-[#50b83c]/20">
                <div className="w-2 h-2 bg-[#50b83c] rounded-full"></div>
                <span className="hidden sm:inline font-medium text-[#50b83c] text-xs">Live</span>
              </div>
            </div>

            {/* User Email */}
            {user && (
              <span className="text-sm font-medium text-dark-muted hidden sm:inline">
                {user.email}
              </span>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors text-dark-muted hover:text-[#e74c3c] hover:bg-dark-bg text-sm border border-transparent"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
