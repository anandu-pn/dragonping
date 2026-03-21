import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Server, Wifi, WifiOff, Clock } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function Servers() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await axios.get(`${API_URL}/agent/list`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setAgents(response.data)
      } catch (err) {
        console.error('Failed to fetch agents:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
    const interval = setInterval(fetchAgents, 15000)
    return () => clearInterval(interval)
  }, [])

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Never'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const isOnline = (lastSeen) => {
    if (!lastSeen) return false
    return (Date.now() - new Date(lastSeen).getTime()) < 120000 // 2 min
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498db]"></div>
          <p className="mt-4 text-dark-muted">Loading servers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-text flex items-center gap-3">
          <Server className="w-7 h-7 text-[#3498db]" />
          Registered Servers
        </h1>
        <p className="text-dark-muted mt-1">Monitor your connected lab devices and servers</p>
      </div>

      {agents.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-lg p-12 text-center">
          <Server className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-semibold text-dark-text mb-2">No Servers Registered</h3>
          <p className="text-dark-muted mb-6 max-w-md mx-auto">
            Install the DragonPing agent on your devices to start monitoring them.
          </p>
          <div className="bg-dark-bg border border-dark-border rounded-md p-4 max-w-lg mx-auto text-left">
            <p className="text-xs text-dark-muted mb-2 font-semibold uppercase tracking-wider">Quick Install</p>
            <code className="text-sm text-[#50b83c] font-mono break-all">
              curl -O http://YOUR_SERVER:8000/static/dragonping-agent.sh && chmod +x dragonping-agent.sh && ./dragonping-agent.sh
            </code>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const online = isOnline(agent.last_seen)
            return (
              <Link
                key={agent.id}
                to={`/agent/${agent.hostname}`}
                className="bg-dark-card border border-dark-border rounded-lg p-5 hover:border-[#3498db]/50 transition-all group cursor-pointer"
              >
                {/* Top row: Status + hostname */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${online ? 'bg-[#50b83c] shadow-lg shadow-[#50b83c]/30' : 'bg-gray-500'}`}></div>
                    <span className="font-semibold text-dark-text group-hover:text-[#3498db] transition-colors">
                      {agent.hostname}
                    </span>
                  </div>
                  {online ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-[#50b83c] bg-[#50b83c]/10 border border-[#50b83c]/20">
                      <Wifi className="w-3 h-3" /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-gray-400 bg-gray-500/10 border border-gray-500/20">
                      <WifiOff className="w-3 h-3" /> Offline
                    </span>
                  )}
                </div>

                {/* Label */}
                <p className="text-dark-muted text-sm mb-3 truncate">{agent.device_label || agent.hostname}</p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-dark-muted pt-3 border-t border-dark-border">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last seen: {timeAgo(agent.last_seen)}
                  </span>
                  <span className="text-[#3498db] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
