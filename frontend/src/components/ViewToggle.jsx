import { BarChart3, TrendingUp, Grid3x3 } from 'lucide-react'

export function ViewToggle({ view, setView, isDark }) {
  const views = [
    { id: 'kpi', label: 'KPIs', icon: TrendingUp },
    { id: 'dashboard', label: 'Dashboards', icon: BarChart3 },
    { id: 'both', label: 'Both', icon: Grid3x3 },
  ]

  return (
    <div className={`inline-flex rounded-xl p-1 ${
      isDark ? 'bg-gray-800' : 'bg-gray-100'
    }`}>
      {views.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setView(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            view === id
              ? isDark
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-indigo-600 shadow-md'
              : isDark
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
