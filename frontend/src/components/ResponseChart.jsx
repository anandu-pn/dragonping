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

function ResponseChart({ checks = [], title = 'Response Time Trend' }) {
  if (!checks || checks.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-dark-400">No data available yet</p>
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

  const data = {
    labels,
    datasets: [
      {
        label: 'Response Time (ms)',
        data: responseData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#d1d5db',
          font: { size: 12 },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return `${context.parsed.y.toFixed(2)}ms`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...responseData) * 1.1 || 1000,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          callback: function (value) {
            return `${value}ms`
          },
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-dark-50 mb-4">{title}</h3>
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  )
}

export default ResponseChart
