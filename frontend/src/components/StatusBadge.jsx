import { CheckCircle, AlertCircle, Clock } from 'lucide-react'

function StatusBadge({ status, responseTime, isSlowResponse = false }) {
  const getStatusStyle = () => {
    if (status === 'UP') {
      if (isSlowResponse) {
        return {
          bg: 'bg-yellow-950',
          text: 'text-status-slow',
          icon: Clock,
          label: 'SLOW',
        }
      }
      return {
        bg: 'bg-green-950',
        text: 'text-status-up',
        icon: CheckCircle,
        label: 'UP',
      }
    }
    return {
      bg: 'bg-red-950',
      text: 'text-status-down',
      icon: AlertCircle,
      label: 'DOWN',
    }
  }

  const style = getStatusStyle()
  const Icon = style.icon

  return (
    <div className={`badge ${style.bg}`}>
      <Icon className="w-4 h-4 mr-1" />
      <span className={style.text}>{style.label}</span>
      {responseTime !== undefined && (
        <span className="ml-2 text-xs opacity-75">
          {responseTime < 1000 ? `${Math.round(responseTime)}ms` : `${(responseTime / 1000).toFixed(2)}s`}
        </span>
      )}
    </div>
  )
}

export default StatusBadge
