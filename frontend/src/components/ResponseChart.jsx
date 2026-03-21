import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function ResponseChart({ checks = [], title = '' }) {
  if (!checks || checks.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[#484f58] text-sm">No data available yet</p>
      </div>
    )
  }

  // Sort checks by date and limit to last 50
  const sortedChecks = [...checks]
    .sort((a, b) => new Date(a.checked_at) - new Date(b.checked_at))
    .slice(-50)

  // Prepare chart data
  const labels = sortedChecks.map((check) => {
    const date = new Date(check.checked_at)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  })

  const responseData = sortedChecks.map((check) => check.response_time || 0)
  const maxResponse = Math.max(...responseData)

  // Color-code: green if all fast, yellow if some slow, red if very slow  
  const avgRT = responseData.reduce((a, b) => a + b, 0) / responseData.length
  const lineColor = avgRT < 500 ? '#50b83c' : avgRT < 2000 ? '#f39c12' : '#e74c3c'
  const fillColor = avgRT < 500
    ? 'rgba(80, 184, 60, 0.08)'
    : avgRT < 2000
      ? 'rgba(243, 156, 18, 0.08)'
      : 'rgba(231, 76, 60, 0.08)'

  const data = {
    labels,
    datasets: [
      {
        label: 'Response Time',
        data: responseData,
        borderColor: lineColor,
        backgroundColor: fillColor,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: lineColor,
        pointBorderColor: '#161b22',
        pointBorderWidth: 1.5,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: '#e6edf3',
        pointHoverBorderWidth: 2,
        tension: 0.35,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#161b22',
        titleColor: '#e6edf3',
        titleFont: { size: 11, weight: '600' },
        bodyColor: '#8b949e',
        bodyFont: { size: 12, family: "'IBM Plex Mono', monospace" },
        borderColor: '#30363d',
        borderWidth: 1,
        padding: { x: 12, y: 8 },
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: (items) => items[0]?.label || '',
          label: (context) => {
            const val = context.parsed.y
            return val < 1000 ? `${Math.round(val)} ms` : `${(val / 1000).toFixed(2)} s`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: maxResponse * 1.15 || 1000,
        border: { display: false },
        grid: {
          color: 'rgba(48, 54, 61, 0.5)',
          drawBorder: false,
          lineWidth: 1,
        },
        ticks: {
          color: '#484f58',
          font: { size: 10, family: "'IBM Plex Mono', monospace" },
          padding: 8,
          maxTicksLimit: 5,
          callback: (value) => {
            return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`
          },
        },
      },
      x: {
        border: { display: false },
        grid: {
          display: false,
        },
        ticks: {
          color: '#484f58',
          font: { size: 10, family: "'IBM Plex Mono', monospace" },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          padding: 4,
        },
      },
    },
    layout: {
      padding: { top: 4, right: 4, bottom: 0, left: 0 },
    },
  }

  return (
    <div>
      {/* Avg response time summary */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-lg font-bold font-mono" style={{ color: lineColor }}>
          {avgRT < 1000 ? `${Math.round(avgRT)}ms` : `${(avgRT / 1000).toFixed(2)}s`}
        </span>
        <span className="text-[11px] text-[#484f58]">avg response · {sortedChecks.length} checks</span>
      </div>
      <div style={{ height: '200px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  )
}

export default ResponseChart
