import { Volume2, TrendingUp, AlertCircle, BarChart2, Lightbulb } from 'lucide-react'

const ICONS = [TrendingUp, BarChart2, AlertCircle, Lightbulb]
const COLORS = ['bg-blue-50 border-blue-200 text-blue-800',
                'bg-green-50 border-green-200 text-green-800',
                'bg-amber-50 border-amber-200 text-amber-800',
                'bg-purple-50 border-purple-200 text-purple-800']

export default function InsightPanel({ insights = [], onVoicePlay }) {
  if (!insights.length) return null
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        AI Insights
      </h3>
      {insights.map((insight, i) => {
        const Icon = ICONS[i % ICONS.length]
        return (
          <div key={i} className={`flex gap-3 items-start rounded-lg border p-3 text-xs ${COLORS[i % COLORS.length]}`}>
            <Icon size={14} className="mt-0.5 shrink-0" />
            <span className="leading-relaxed flex-1">{insight}</span>
            {onVoicePlay && (
              <button onClick={() => onVoicePlay(insight)} className="shrink-0 opacity-60 hover:opacity-100">
                <Volume2 size={12} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}