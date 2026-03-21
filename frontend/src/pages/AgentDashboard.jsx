import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Wifi, WifiOff, Clock, Cpu, HardDrive, Activity } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// ─── Donut Ring (Canvas) ────────────────────────────────────────────────────
function DonutRing({ value, label, detail, size = 130 }) {
  const canvasRef = useRef(null)
  const color = value < 60 ? '#50b83c' : value < 80 ? '#f39c12' : '#e74c3c'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    const cx = size / 2, cy = size / 2, r = size / 2 - 12, lw = 10
    ctx.clearRect(0, 0, size, size)

    // Background ring
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = '#21262d'
    ctx.lineWidth = lw
    ctx.stroke()

    // Value ring
    const angle = (value / 100) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + angle)
    ctx.strokeStyle = color
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    ctx.stroke()

    // Center text
    ctx.fillStyle = '#c9d1d9'
    ctx.font = `bold ${size / 4.5}px 'IBM Plex Mono', monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round(value)}%`, cx, cy)
  }, [value, size, color])

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} />
      <span className="text-sm font-semibold text-dark-text mt-2">{label}</span>
      {detail && <span className="text-xs text-dark-muted font-mono mt-0.5">{detail}</span>}
    </div>
  )
}

// ─── Line Chart (Canvas) ────────────────────────────────────────────────────
function LineChart({ data, label, color = '#3498db', height = 160 }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || data.length === 0) return

    const width = container.offsetWidth
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(dpr, dpr)

    const pad = { top: 20, right: 10, bottom: 25, left: 40 }
    const w = width - pad.left - pad.right
    const h = height - pad.top - pad.bottom

    ctx.clearRect(0, 0, width, height)

    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1

    // Grid lines
    ctx.strokeStyle = '#21262d'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (h / 4) * i
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(pad.left + w, y)
      ctx.stroke()

      const val = max - (range / 4) * i
      ctx.fillStyle = '#484f58'
      ctx.font = '10px "IBM Plex Mono", monospace'
      ctx.textAlign = 'right'
      ctx.fillText(val.toFixed(0), pad.left - 5, y + 3)
    }

    // Line
    ctx.beginPath()
    data.forEach((val, i) => {
      const x = pad.left + (i / (data.length - 1 || 1)) * w
      const y = pad.top + h - ((val - min) / range) * h
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Fill area
    const lastX = pad.left + w
    ctx.lineTo(lastX, pad.top + h)
    ctx.lineTo(pad.left, pad.top + h)
    ctx.closePath()
    ctx.fillStyle = color + '33'
    ctx.fill()

    // Label
    ctx.fillStyle = '#8b949e'
    ctx.font = '11px "IBM Plex Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, width / 2, height - 4)
  }, [data, label, color, height])

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  )
}

// ─── Dual Line Chart (Network) ──────────────────────────────────────────────
function DualLineChart({ data1, data2, label1, label2, color1 = '#3498db', color2 = '#50b83c', height = 160 }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const width = container.offsetWidth
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(dpr, dpr)

    const pad = { top: 20, right: 10, bottom: 25, left: 50 }
    const w = width - pad.left - pad.right
    const h = height - pad.top - pad.bottom

    ctx.clearRect(0, 0, width, height)

    const allData = [...data1, ...data2]
    const max = Math.max(...allData, 1)
    const min = 0
    const range = max - min || 1

    // Grid
    ctx.strokeStyle = '#21262d'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (h / 4) * i
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(pad.left + w, y)
      ctx.stroke()
      const val = max - (range / 4) * i
      ctx.fillStyle = '#484f58'
      ctx.font = '10px "IBM Plex Mono", monospace'
      ctx.textAlign = 'right'
      ctx.fillText(formatBytes(val), pad.left - 5, y + 3)
    }

    // Draw both lines
    const drawLine = (data, clr) => {
      if (data.length === 0) return
      ctx.beginPath()
      data.forEach((val, i) => {
        const x = pad.left + (i / (data.length - 1 || 1)) * w
        const y = pad.top + h - ((val - min) / range) * h
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.strokeStyle = clr
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.lineTo(pad.left + w, pad.top + h)
      ctx.lineTo(pad.left, pad.top + h)
      ctx.closePath()
      ctx.fillStyle = clr + '33'
      ctx.fill()
    }
    drawLine(data1, color1)
    drawLine(data2, color2)

    // Legend
    ctx.font = '10px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = color1
    ctx.fillRect(pad.left, height - 12, 10, 3)
    ctx.fillText(label1, pad.left + 14, height - 8)
    ctx.fillStyle = color2
    ctx.fillRect(pad.left + 70, height - 12, 10, 3)
    ctx.fillText(label2, pad.left + 84, height - 8)
  }, [data1, data2, label1, label2, color1, color2, height])

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  )
}

// ─── Disk Bar ───────────────────────────────────────────────────────────────
function DiskBar({ usedGb, totalGb, percent }) {
  const color = percent < 60 ? '#50b83c' : percent < 80 ? '#f39c12' : '#e74c3c'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-dark-muted font-mono">Root /</span>
        <span className="text-dark-text font-mono">{usedGb} / {totalGb} GB ({percent}%)</span>
      </div>
      <div className="w-full h-3 bg-[#21262d] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(2) + ' GB'
}

// ─── Main Dashboard Component ───────────────────────────────────────────────
export default function AgentDashboard() {
  const { hostname } = useParams()
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/agent/${hostname}/metrics?limit=60`)
      setMetrics(response.data.reverse())
    } catch (err) {
      console.error('Failed to fetch agent metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [hostname])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 10000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null
  const cpuHistory = metrics.map(m => m.cpu_percent)
  const ramHistory = metrics.map(m => m.ram_percent)
  const rxHistory = metrics.map(m => m.net_rx_bytes)
  const txHistory = metrics.map(m => m.net_tx_bytes)

  const isOnline = latest && (Date.now() - new Date(latest.recorded_at).getTime()) < 120000

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Never'
    const diff = Date.now() - new Date(dateStr).getTime()
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return `${secs}s ago`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  }

  let processes = []
  if (latest?.processes) {
    try {
      processes = typeof latest.processes === 'string' ? JSON.parse(latest.processes) : latest.processes
    } catch (e) { processes = [] }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498db]"></div>
          <p className="mt-4 text-dark-muted">Loading metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/servers" className="text-dark-muted hover:text-[#3498db] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dark-text flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#3498db]" />
              {hostname}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#50b83c] bg-[#50b83c]/10 border border-[#50b83c]/20">
              <Wifi className="w-3 h-3" /> Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-gray-400 bg-gray-500/10 border border-gray-500/20">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
          {latest && (
            <span className="text-xs text-dark-muted flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last seen: {timeAgo(latest.recorded_at)}
            </span>
          )}
        </div>
      </div>

      {!latest ? (
        <div className="bg-dark-card border border-dark-border rounded-lg p-12 text-center">
          <Activity className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-semibold text-dark-text mb-2">No Metrics Yet</h3>
          <p className="text-dark-muted">Waiting for the agent to send its first heartbeat...</p>
        </div>
      ) : (
        <>
          {/* Row 1 — Donut Rings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center justify-center">
              <DonutRing
                value={latest.cpu_percent}
                label="CPU"
                detail={`${latest.cpu_percent.toFixed(1)}% used`}
              />
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center justify-center">
              <DonutRing
                value={latest.ram_percent}
                label="RAM"
                detail={`${(latest.ram_used_mb / 1024).toFixed(1)} / ${(latest.ram_total_mb / 1024).toFixed(1)} GB`}
              />
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center justify-center">
              <DonutRing
                value={latest.disk_percent}
                label="Disk"
                detail={`${latest.disk_used_gb} / ${latest.disk_total_gb} GB`}
              />
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center justify-center">
              <DonutRing
                value={Math.min(100, (txHistory.length > 1 ? Math.abs(txHistory[txHistory.length - 1] - txHistory[txHistory.length - 2]) / 1048576 : 0))}
                label="Network"
                detail={`↓ ${formatBytes(latest.net_rx_bytes)} ↑ ${formatBytes(latest.net_tx_bytes)}`}
              />
            </div>
          </div>

          {/* Row 2 — CPU & RAM History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#3498db]" /> CPU History
              </h3>
              <LineChart data={cpuHistory} label="CPU % (last 60 readings)" color="#3498db" height={180} />
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#9b59b6]" /> RAM History
              </h3>
              <LineChart data={ramHistory} label="RAM % (last 60 readings)" color="#9b59b6" height={180} />
            </div>
          </div>

          {/* Row 3 — Network I/O & Disk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-dark-text mb-3">Network I/O</h3>
              <DualLineChart
                data1={rxHistory}
                data2={txHistory}
                label1="RX (Download)"
                label2="TX (Upload)"
                color1="#3498db"
                color2="#50b83c"
                height={180}
              />
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#f39c12]" /> Disk Usage
              </h3>
              <div className="mt-4 space-y-4">
                <DiskBar usedGb={latest.disk_used_gb} totalGb={latest.disk_total_gb} percent={latest.disk_percent} />
              </div>
            </div>
          </div>

          {/* Bottom — Top Processes */}
          <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-dark-border bg-dark-bg">
              <h3 className="text-sm font-semibold text-dark-text">Top Processes</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-dark-muted uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Process Name</th>
                  <th className="text-right px-5 py-3">CPU %</th>
                  <th className="text-right px-5 py-3">MEM %</th>
                </tr>
              </thead>
              <tbody>
                {processes.length > 0 ? processes.slice(0, 5).map((proc, i) => (
                  <tr key={i} className="border-t border-dark-border hover:bg-dark-bg/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-sm text-dark-text">{proc.name}</td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-[#f39c12]">{proc.cpu}%</td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-[#3498db]">{proc.mem}%</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-dark-muted text-sm">
                      No process data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
