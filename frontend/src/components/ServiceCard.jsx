import { Trash2, ExternalLink } from 'lucide-react'

function ServiceCard({ service, onDelete, onClick, isSelected }) {
  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirm(`Delete service "${service.name}"?`)) {
      onDelete(service.id)
    }
  }

  const uptime = service.uptime_percentage || 0
  const isOnline = service.status === 'UP'

  return (
    <div
      onClick={onClick}
      className={`relative px-6 py-4 flex items-center justify-between cursor-pointer group transition-colors ${
        isSelected ? 'bg-[#3498db]/10' : 'hover:bg-dark-bg'
      }`}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3498db]"></div>
      )}

      <div className="flex flex-col gap-1 min-w-0 flex-1 pr-4">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
            isOnline ? 'bg-[#50b83c]' : 'bg-[#e74c3c]'
          }`}></span>
          <h3 className={`text-base font-semibold truncate ${
            isSelected ? 'text-[#3498db]' : 'text-dark-text group-hover:text-[#3498db]'
          } transition-colors`}>
            {service.name}
          </h3>
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-dark-muted hover:text-[#3498db] transition-colors opacity-0 group-hover:opacity-100"
            title="Open URL"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="hidden sm:block text-right">
          <div className="text-xs text-dark-muted uppercase tracking-wide">Uptime</div>
          <div className="text-sm font-semibold text-dark-text">{uptime.toFixed(2)}%</div>
        </div>

        <div className="w-24 text-center">
            {isOnline ? (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-[#50b83c] bg-[#50b83c]/10 border border-[#50b83c]/20">
                Up
              </span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-[#e74c3c] bg-[#e74c3c]/10 border border-[#e74c3c]/20">
                Down
              </span>
            )}
        </div>

        <button
          onClick={handleDelete}
          className="p-2 text-dark-muted hover:text-[#e74c3c] hover:bg-[#e74c3c]/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
          title="Delete service"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default ServiceCard
