import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Plus, History, Activity, LogOut, Server } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/add', label: 'Add Service', icon: Plus },
    { path: '/logs', label: 'Logs', icon: History },
    { path: '/servers', label: 'Servers', icon: Server },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <Activity className="w-6 h-6 text-[#50b83c]" />
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-[#e6edf3] hidden sm:inline">DragonPing</span>
              <span className="text-[9px] text-[#484f58] hidden sm:inline tracking-[0.15em] font-semibold mt-0.5">UPTIME MONITOR</span>
              <span className="text-base font-bold text-[#e6edf3] sm:hidden">DP</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-0.5">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-[13px] transition-colors ${
                  isActive(path)
                    ? 'bg-[#21262d] text-[#e6edf3]'
                    : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#50b83c]/8 border border-[#50b83c]/15">
              <div className="w-1.5 h-1.5 bg-[#50b83c] rounded-full animate-pulse-glow"></div>
              <span className="hidden sm:inline text-[10px] font-semibold text-[#50b83c] tracking-wider uppercase">Live</span>
            </div>

            {/* User Email */}
            {user && (
              <span className="text-xs text-[#8b949e] hidden md:inline truncate max-w-[150px]">
                {user.email}
              </span>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-[#8b949e] hover:text-[#e74c3c] hover:bg-[#e74c3c]/8 transition-colors border border-transparent"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
