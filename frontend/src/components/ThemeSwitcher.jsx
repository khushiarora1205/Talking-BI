const THEMES = [
  { id: 'minimal',   label: 'Minimal',   color: '#378ADD' },
  { id: 'executive', label: 'Executive', color: '#534AB7' },
  { id: 'dark',      label: 'Dark',      color: '#5DCAA5' },
  { id: 'colorful',  label: 'Colorful',  color: '#D85A30' },
]

export default function ThemeSwitcher({ active, onChange }) {
  return (
    <div className="flex gap-2">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
            active === t.id
              ? 'border-gray-400 bg-white shadow-sm font-medium text-gray-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
          {t.label}
        </button>
      ))}
    </div>
  )
}