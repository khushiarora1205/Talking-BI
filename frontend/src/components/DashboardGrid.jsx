import ChartCard from './ChartCard'

const THEMES = {
  minimal:   { colors: ['#378ADD', '#1D9E75', '#EF9F27', '#D85A30'], label: 'Minimal' },
  executive: { colors: ['#26215C', '#534AB7', '#7F77DD', '#AFA9EC'], label: 'Executive' },
  dark:      { colors: ['#5DCAA5', '#85B7EB', '#FAC775', '#F0997B'], label: 'Dark' },
  colorful:  { colors: ['#D85A30', '#1D9E75', '#534AB7', '#BA7517'], label: 'Colorful' },
}

const CHART_TYPES = ['bar', 'line', 'area', 'pie']

export default function DashboardGrid({ specs, insights, activeTheme, onVoicePlay }) {
  if (!specs) return null
  const baseSpec = specs[activeTheme] || specs[Object.keys(specs)[0]]
  if (!baseSpec) return null
  const theme = THEMES[activeTheme]

  return (
    <div className="grid grid-cols-2 gap-4">
      {CHART_TYPES.map((type, i) => (
        <ChartCard
          key={type}
          spec={{ ...baseSpec, chart_type: type }}
          insights={insights}
          onVoicePlay={i === 0 ? onVoicePlay : null}
          themeOverride={theme}
        />
      ))}
    </div>
  )
}