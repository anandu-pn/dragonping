import { Trash2, ExternalLink, BarChart3 } from 'lucide-react'
import StatusBadge from './StatusBadge'

function ServiceCard({ service, onDelete, onClick }) {
  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirm(`Delete service "${service.name}"?`)) {
      onDelete(service.id)
    }
  }

  const isSlowResponse = service.last_check_response_time > 2000
  const uptime = service.uptime_percentage || 0
  const isOnline = service.status === 'UP'

  return (
    <div
      onClick={onClick}
      className="card relative overflow-hidden cursor-pointer group/card p-6 hover:shadow-2xl hover:shadow-dark-500/20"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-status-up/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 ${
        isOnline 
          ? 'bg-gradient-to-r from-status-up to-green-500 shadow-lg shadow-green-500/50' 
          : 'bg-gradient-to-r from-status-down to-red-500 shadow-lg shadow-red-500/50'
      }`} />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-dark-50 truncate group-hover/card:text-status-up transition-colors">
                {service.name}
              </h3>
              <a
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-dark-400 hover:text-status-up hover:bg-dark-700/50 rounded-lg transition-all opacity-0 group-hover/card:opacity-100"
                title="Open URL"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-dark-500 truncate font-mono">
              {service.url}
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="ml-3 p-2.5 text-dark-400 hover:text-status-down hover:bg-dark-700/50 rounded-lg transition-all hover:scale-110 flex-shrink-0"
            title="Delete service"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <StatusBadge
            status={service.status}
            responseTime={service.last_check_response_time}
            isSlowResponse={isSlowResponse}
          />
          <div className="flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <BarChart3 className="w-4 h-4 text-dark-500" />
            <span className="text-xs text-dark-500">View history</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Response Time */}
          <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/30">
            <p className="text-xs text-dark-500 font-semibold uppercase tracking-wide mb-2">Response Time</p>
            <p className="text-base font-bold text-gradient">
              {service.last_check_response_time
                ? service.last_check_response_time < 1000
                  ? `${Math.round(service.last_check_response_time)}ms`
                  : `${(service.last_check_response_time / 1000).toFixed(2)}s`
                : 'N/A'}
            </p>
          </div>
          
          {/* Uptime */}
          <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/30">
            <p className="text-xs text-dark-500 font-semibold uppercase tracking-wide mb-2">Uptime</p>
            <p className="text-base font-bold text-gradient">
              {uptime.toFixed(1)}%
            </p>
          </div>
          
          {/* Average Response */}
          <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/30">
            <p className="text-xs text-dark-500 font-semibold uppercase tracking-wide mb-2">Average</p>
            <p className="text-base font-bold text-dark-50">
              {service.avg_response_time
                ? service.avg_response_time < 1000
                  ? `${Math.round(service.avg_response_time)}ms`
                  : `${(service.avg_response_time / 1000).toFixed(2)}s`
                : 'N/A'}
            </p>
          </div>
          
          {/* Total Checks */}
          <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/30">
            <p className="text-xs text-dark-500 font-semibold uppercase tracking-wide mb-2">Checks</p>
            <p className="text-base font-bold text-dark-50">
              {service.total_checks || 0}
            </p>
          </div>
        </div>

        {/* Last Check Info */}
        <div className="pt-3 border-t border-dark-700/30 flex items-center justify-between">
          <p className="text-xs text-dark-500">
            Last check: <span className="text-dark-400 font-medium">{service.last_check ? new Date(service.last_check).toLocaleString() : 'Never'}</span>
          </p>
          {service.failed_checks > 0 && (
            <span className="text-xs bg-red-950/50 text-red-300 px-2 py-1 rounded border border-red-900/50">
              {service.failed_checks} failed
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceCard
