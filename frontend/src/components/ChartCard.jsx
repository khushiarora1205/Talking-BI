import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null
}

export default function ChartCard({ spec, insights = [], onVoicePlay, themeOverride }) {
  const [hovered, setHovered] = useState(false)
  if (!spec || !spec.data || spec.data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-center h-64 text-gray-400 text-sm">
        No data available
      </div>
    )
  }

  const colors = themeOverride?.colors || spec.colors || ['#378ADD', '#1D9E75', '#EF9F27', '#D85A30']
  const xKey = spec.x_key
  const yKey = spec.y_key
  const chartType = spec.chart_type || 'bar'

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={spec.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke={colors[0]} strokeWidth={2} dot={false} />
          </LineChart>
        )
      case 'area':
        return (
          <AreaChart data={spec.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey={yKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.2} />
          </AreaChart>
        )
      case 'pie':
        return (
          <PieChart>
            <Pie data={spec.data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%"
              outerRadius={90} labelLine={false} label={renderCustomLabel}>
              {spec.data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
          </PieChart>
        )
      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10 }} name={xKey} />
            <YAxis dataKey={yKey} tick={{ fontSize: 10 }} name={yKey} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={spec.data} fill={colors[0]} />
          </ScatterChart>
        )
      default:
        return (
          <BarChart data={spec.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
              {spec.data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        )
    }
  }

  return (
    <div
      className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h3 className="mb-3 text-sm font-medium text-gray-700 truncate">{spec.title || 'Chart'}</h3>
      <ResponsiveContainer width="100%" height={200}>
        {renderChart()}
      </ResponsiveContainer>

      {/* Insight overlay on hover */}
      {hovered && insights.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gray-900/92 p-3 z-10">
          <p className="text-xs text-white leading-relaxed mb-2">{insights[0]}</p>
          {onVoicePlay && (
            <button
              onClick={() => onVoicePlay(insights.join('. '))}
              className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
            >
              <Volume2 size={12} /> Read aloud
            </button>
          )}
        </div>
      )}
    </div>
  )
}