import { useState } from 'react'
import { Trash2, ExternalLink, Globe, Cpu, AlertTriangle } from 'lucide-react'

function ServiceCard({ service, onDelete, onClick, isSelected, prediction }) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirm(`Delete service "${service.name}"?`)) {
      onDelete(service.id)
    }
  }

  const uptime = service.uptime_percentage || 0
  const isOnline = service.status === 'UP'
  const responseTime = service.last_check_response_time || service.avg_response_time || 0

  const protocolLabel = (service.protocol || 'http').toUpperCase()
  const typeIcon = service.type === 'website'
    ? <Globe className="w-3.5 h-3.5" />
    : <Cpu className="w-3.5 h-3.5" />

  const formatRT = (ms) => {
    if (!ms) return '—'
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`
  }

  // Heartbeat bars
  const heartbeats = Array.from({ length: 30 }, (_, i) => {
    if (service.total_checks && service.total_checks > 0) {
      const failRate = (service.failed_checks || 0) / service.total_checks
      return Math.random() > failRate ? 'up' : 'down'
    }
    return isOnline ? 'up' : 'down'
  })

  // Prediction risk
  const riskLevel = prediction?.risk_level || 'low'
  const riskReason = prediction?.reason || ''

  return (
    <div
      onClick={onClick}
      className={`relative px-5 py-4 cursor-pointer group transition-all duration-150 ${
        isSelected ? 'bg-[#161b22]' : 'hover:bg-[#161b22]/50'
      }`}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#3498db] rounded-r"></div>
      )}

      <div className="flex items-center gap-4">
        {/* Status dot */}
        <div className="flex-shrink-0">
          <div className={`w-3 h-3 rounded-full ${
            isOnline
              ? 'bg-[#50b83c] shadow-[0_0_8px_rgba(80,184,60,0.4)]'
              : 'bg-[#e74c3c] shadow-[0_0_8px_rgba(231,76,60,0.4)]'
          }`}></div>
        </div>

        {/* Name + heartbeats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Risk indicator */}
            {riskLevel === 'high' && (
              <div
                className="relative flex-shrink-0"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#f39c12] animate-pulse" />
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-2 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl text-xs text-[#c9d1d9] whitespace-normal">
                    <div className="font-semibold text-[#f39c12] mb-1">⚠ High Risk Predicted</div>
                    <div className="text-[#8b949e]">{riskReason}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#30363d]"></div>
                  </div>
                )}
              </div>
            )}
            {riskLevel === 'medium' && (
              <div className="w-2 h-2 rounded-full bg-[#f39c12]/50 flex-shrink-0" title="Medium risk"></div>
            )}

            <h3 className={`text-sm font-semibold truncate ${
              isSelected ? 'text-[#3498db]' : 'text-dark-text group-hover:text-[#3498db]'
            } transition-colors`}>
              {service.name}
            </h3>
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-dark-muted hover:text-[#3498db] opacity-0 group-hover:opacity-100 transition-all"
              title="Open URL"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Heartbeat bars */}
          <div className="flex items-center gap-[2px] h-[18px]">
            {heartbeats.map((beat, i) => (
              <div
                key={i}
                className={`flex-1 rounded-[1px] transition-all duration-300 ${
                  beat === 'up'
                    ? 'bg-[#50b83c] hover:bg-[#5fd049]'
                    : 'bg-[#e74c3c] hover:bg-[#ef5350]'
                }`}
                style={{ height: '100%', minWidth: '3px', maxWidth: '8px' }}
              ></div>
            ))}
          </div>
        </div>

        {/* Right side stats */}
        <div className="flex items-center gap-5 flex-shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-dark-bg border border-dark-border text-dark-muted">
            {typeIcon}
            {protocolLabel}
          </span>

          <div className="hidden sm:block text-right min-w-[60px]">
            <div className="text-xs font-mono text-dark-muted">{formatRT(responseTime)}</div>
          </div>

          <div className="text-right min-w-[55px]">
            <div className={`text-sm font-bold font-mono ${
              uptime >= 99 ? 'text-[#50b83c]' : uptime >= 95 ? 'text-[#f39c12]' : 'text-[#e74c3c]'
            }`}>
              {uptime.toFixed(1)}%
            </div>
          </div>

          <div className="w-16 text-center">
            {isOnline ? (
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-[#50b83c] bg-[#50b83c]/10 border border-[#50b83c]/20">
                UP
              </span>
            ) : (
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold text-[#e74c3c] bg-[#e74c3c]/10 border border-[#e74c3c]/20">
                DOWN
              </span>
            )}
            
            {service.cert_expiry_days != null && (
              <div className={`mt-1.5 text-[10px] font-medium whitespace-nowrap ${
                service.cert_expiry_days > 30 ? 'text-[#50b83c]' : 
                service.cert_expiry_days >= 15 ? 'text-[#f39c12]' : 'text-[#e74c3c]'
              }`}>
                SSL: {service.cert_expiry_days}d
              </div>
            )}
          </div>

          <button
            onClick={handleDelete}
            className="p-1.5 text-dark-muted hover:text-[#e74c3c] hover:bg-[#e74c3c]/10 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Delete service"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServiceCard
