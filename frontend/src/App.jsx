// src/App.jsx — Talking BI  ·  Redesigned UI with Light/Dark mode
// All business logic preserved exactly. Only styles + theme system changed.
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  BarChart3, Send, Mic, MicOff, Volume2, VolumeX,
  Database, ChevronDown, ChevronUp, Download,
  Sparkles, TrendingUp, AlertCircle, Lightbulb, BarChart2,
  RefreshCw, History, MessageSquare, Bot, Clock,
  ChevronRight, Eye, EyeOff, LogOut, User, Sun, Moon,
  Square, Zap,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useDashboardStore } from './store/dashboardStore'
import { connectDB, queryBI, speakText, transcribeAudio, getMe } from './lib/api'

// ── CONSTANTS ─────────────────────────────────────────────────────
const GOOGLE_AUTH_URL = 'http://localhost:8000/auth/google'

const CHART_THEMES = {
  minimal:   { label: 'Minimal',   accent: '#3B82F6', colors: ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'] },
  executive: { label: 'Executive', accent: '#6366F1', colors: ['#312E81','#4338CA','#6366F1','#818CF8','#A5B4FC','#C7D2FE'] },
  earthy:    { label: 'Earthy',    accent: '#D97706', colors: ['#92400E','#D97706','#FBBF24','#6B7280','#374151','#9CA3AF'] },
  vivid:     { label: 'Vivid',     accent: '#EC4899', colors: ['#EC4899','#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444'] },
}

const SAMPLE_QUESTIONS = [
  'Total profit by category',
  'Monthly sales revenue for 2004',
  'Top product lines by revenue',
  'Payment mode distribution',
  'Top 5 sub-categories by profit',
  'Orders by country',
]

// ── THEME SYSTEM ──────────────────────────────────────────────────
const LIGHT = {
  '--bg-base':        '#F7F8FA',
  '--bg-surface':     '#FFFFFF',
  '--bg-raised':      '#F1F3F7',
  '--bg-subtle':      '#E9ECF2',
  '--bg-overlay':     'rgba(0,0,0,0.04)',
  '--border':         '#E4E7EE',
  '--border-strong':  '#CDD1DB',
  '--text-primary':   '#0D1117',
  '--text-secondary': '#4B5568',
  '--text-muted':     '#8B95A8',
  '--text-faint':     '#B8C0CC',
  '--accent':         '#4F6EF7',
  '--accent-soft':    '#EEF2FF',
  '--accent-text':    '#2D4EDB',
  '--green':          '#12B76A',
  '--green-soft':     '#ECFDF5',
  '--red':            '#F04438',
  '--red-soft':       '#FEF3F2',
  '--amber':          '#F79009',
  '--purple':         '#7C3AED',
  '--purple-soft':    '#F5F3FF',
  '--user-bubble':    'linear-gradient(135deg,#4F6EF7,#7C3AED)',
  '--sidebar-bg':     '#FFFFFF',
  '--topbar-bg':      'rgba(255,255,255,0.85)',
  '--scrollbar':      '#E4E7EE',
  '--shadow-sm':      '0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)',
  '--shadow-md':      '0 4px 12px rgba(0,0,0,0.08),0 2px 4px rgba(0,0,0,0.04)',
  '--shadow-lg':      '0 12px 32px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.06)',
}

const DARK = {
  '--bg-base':        '#0C0E14',
  '--bg-surface':     '#13151F',
  '--bg-raised':      '#1A1D2B',
  '--bg-subtle':      '#22263A',
  '--bg-overlay':     'rgba(255,255,255,0.04)',
  '--border':         '#252940',
  '--border-strong':  '#353855',
  '--text-primary':   '#F0F2F8',
  '--text-secondary': '#9BA3BC',
  '--text-muted':     '#5E6580',
  '--text-faint':     '#3D4260',
  '--accent':         '#6B8AFF',
  '--accent-soft':    '#1A2050',
  '--accent-text':    '#A0B4FF',
  '--green':          '#34D399',
  '--green-soft':     '#022C22',
  '--red':            '#F87171',
  '--red-soft':       '#2D1515',
  '--amber':          '#FCD34D',
  '--purple':         '#A78BFA',
  '--purple-soft':    '#1E1040',
  '--user-bubble':    'linear-gradient(135deg,#3A5AE8,#6D28D9)',
  '--sidebar-bg':     '#13151F',
  '--topbar-bg':      'rgba(19,21,31,0.85)',
  '--scrollbar':      '#252940',
  '--shadow-sm':      '0 1px 3px rgba(0,0,0,0.3),0 1px 2px rgba(0,0,0,0.2)',
  '--shadow-md':      '0 4px 12px rgba(0,0,0,0.4),0 2px 4px rgba(0,0,0,0.2)',
  '--shadow-lg':      '0 12px 32px rgba(0,0,0,0.5),0 4px 8px rgba(0,0,0,0.3)',
}

function applyTheme(isDark) {
  const vars = isDark ? DARK : LIGHT
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

// ── CSS HELPERS ───────────────────────────────────────────────────
const v = (name) => `var(${name})`

// ── NUMBER FORMATTERS (unchanged) ─────────────────────────────────
function formatAxisNumber(value) {
  if (value === null || value === undefined || value === '') return value
  const num = Number(value)
  if (isNaN(num)) return value
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 1e9)  return `${sign}${(abs / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`
  if (abs >= 1e7)  return `${sign}${(abs / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`
  if (abs >= 1e6)  return `${sign}${(abs / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`
  if (abs >= 1e5)  return `${sign}${(abs / 1e5).toFixed(0)}L`
  if (abs >= 1e3)  return `${sign}${(abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}K`
  return num % 1 === 0 ? num.toLocaleString() : num.toFixed(2)
}

function formatTooltipNumber(value) {
  if (value === null || value === undefined) return value
  const num = Number(value)
  if (isNaN(num)) return value
  return num % 1 === 0
    ? num.toLocaleString()
    : num.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

// ── DATAPOINT POPUP ───────────────────────────────────────────────
function DatapointPopup({ data }) {
  if (!data) return null
  return (
    <div style={{
      position: 'fixed', top: data.y + 14, left: data.x,
      background: v('--bg-raised'), color: v('--text-primary'),
      borderRadius: 10, padding: '10px 14px', fontSize: 12, zIndex: 2000,
      boxShadow: v('--shadow-lg'), minWidth: 148,
      border: `1px solid ${v('--border-strong')}`,
      backdropFilter: 'blur(12px)', pointerEvents: 'none',
      animation: 'popIn 0.15s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 3, color: v('--accent'), fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {data.label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: v('--text-primary'), letterSpacing: '-0.02em' }}>
        {formatTooltipNumber(data.value)}
      </div>
      {data.name && data.name !== data.label && (
        <div style={{ fontSize: 10, color: v('--text-muted'), marginTop: 3 }}>{data.name}</div>
      )}
    </div>
  )
}

// ── CHART CARD ────────────────────────────────────────────────────
function ChartCard({ spec, insights, onVoicePlay, chartType, colors, insightOverlayEnabled }) {
  const [hovered, setHovered] = useState(false)
  const [popup, setPopup] = useState(null)
  const c = colors || spec?.colors || CHART_THEMES.minimal.colors

  if (!spec?.data?.length) return (
    <div style={{
      background: v('--bg-raised'), border: `1px dashed ${v('--border')}`,
      borderRadius: 16, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: 220, color: v('--text-faint'), gap: 8,
    }}>
      <BarChart2 size={22} />
      <span style={{ fontSize: 12 }}>No data</span>
    </div>
  )

  const xKey = spec.x_key
  const yKey = spec.y_key

  const tooltipStyle = {
    borderRadius: 10, border: `1px solid ${v('--border-strong')}`,
    boxShadow: v('--shadow-md'), fontSize: 11.5, padding: '8px 12px',
    background: v('--bg-raised'), color: v('--text-primary'),
  }
  const axisStyle = { fontSize: 9.5, fill: 'var(--text-muted)' }
  const gridColor = 'var(--border)'
  const xTickFmt = v => { const s = String(v); return s.length > 10 ? s.slice(0,9)+'…' : s }
  const xAxisLabel = { value: spec.x_label || xKey || '', position: 'insideBottom', offset: -38,
    style: { fontSize: 10, fill: 'var(--text-muted)', fontWeight: 500 } }
  const yAxisLabel = { value: spec.y_label || yKey || '', angle: -90, position: 'insideLeft', offset: 12,
    style: { fontSize: 10, fill: 'var(--text-muted)', fontWeight: 500 } }

  const handleClick = (data, e) => {
    if (!data) return
    const val = data.value ?? data.payload?.[yKey]
    const lbl = data.name ?? data.payload?.[xKey] ?? ''
    setPopup({ value: val, label: lbl, name: data.payload?.[xKey] ?? '', x: e?.clientX ?? 200, y: e?.clientY ?? 200 })
    setTimeout(() => setPopup(null), 3000)
  }

  const margin = { top: 8, right: 12, left: 10, bottom: 52 }

  const chart = (() => {
    const tipFmt = (val, name) => [formatTooltipNumber(val), name]
    switch (chartType) {
      case 'line': return (
        <LineChart data={spec.data} margin={margin} onClick={(d,e)=>d?.activePayload&&handleClick(d.activePayload[0],e)}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={xTickFmt} angle={-35} textAnchor="end" interval="preserveStartEnd" label={xAxisLabel} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={formatAxisNumber} width={58} label={yAxisLabel} />
          <Tooltip contentStyle={tooltipStyle} formatter={tipFmt} />
          <Line type="monotone" dataKey={yKey} stroke={c[0]} strokeWidth={2.5} dot={spec.data.length<=20?{r:3,fill:c[0],cursor:'pointer'}:false} activeDot={{r:5,fill:c[0],cursor:'pointer'}} />
        </LineChart>
      )
      case 'area': return (
        <AreaChart data={spec.data} margin={margin} onClick={(d,e)=>d?.activePayload&&handleClick(d.activePayload[0],e)}>
          <defs>
            <linearGradient id={`ag-${c[0].replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={c[0]} stopOpacity={0.22}/>
              <stop offset="95%" stopColor={c[0]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={xTickFmt} angle={-35} textAnchor="end" interval="preserveStartEnd" label={xAxisLabel} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={formatAxisNumber} width={58} label={yAxisLabel} />
          <Tooltip contentStyle={tooltipStyle} formatter={tipFmt} />
          <Area type="monotone" dataKey={yKey} stroke={c[0]} strokeWidth={2.5} fill={`url(#ag-${c[0].replace('#','')})`} />
        </AreaChart>
      )
      case 'pie': return (
        <PieChart>
          <Pie data={spec.data} dataKey={yKey} nameKey={xKey} cx="50%" cy="46%" outerRadius="68%" paddingAngle={2} onClick={handleClick} style={{cursor:'pointer'}}
            label={({name,percent})=>percent>0.04?`${String(name).slice(0,9)}…`.replace('……','…')+` ${(percent*100).toFixed(0)}%`:null}
            labelLine={{stroke:'var(--text-muted)',strokeWidth:0.8}}>
            {spec.data.map((_,i)=><Cell key={i} fill={c[i%c.length]} stroke="transparent" />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v,n)=>[formatTooltipNumber(v),String(n).slice(0,25)]} />
          {spec.data.length<=8&&<Legend formatter={v=><span style={{fontSize:10,color:'var(--text-secondary)'}}>{String(v).slice(0,18)}</span>} wrapperStyle={{paddingTop:6}} />}
        </PieChart>
      )
      case 'horizontal_bar': return (
        <BarChart data={spec.data} layout="vertical" barSize={Math.max(7,Math.min(20,150/Math.max(spec.data.length,1)))} margin={{top:8,right:20,left:10,bottom:10}} onClick={(d,e)=>d?.activePayload&&handleClick(d.activePayload[0],e)}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={formatAxisNumber} />
          <YAxis type="category" dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} width={96} tickFormatter={v=>String(v).length>14?String(v).slice(0,13)+'…':String(v)} />
          <Tooltip contentStyle={tooltipStyle} formatter={tipFmt} />
          <Bar dataKey={yKey} radius={[0,5,5,0]} cursor="pointer">
            {spec.data.map((_,i)=><Cell key={i} fill={c[i%c.length]} />)}
          </Bar>
        </BarChart>
      )
      default: return (
        <BarChart data={spec.data} barSize={Math.max(7,Math.min(26,180/Math.max(spec.data.length,1)))} margin={margin} onClick={(d,e)=>d?.activePayload&&handleClick(d.activePayload[0],e)}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={xTickFmt} angle={-35} textAnchor="end" interval="preserveStartEnd" label={xAxisLabel} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={formatAxisNumber} width={58} label={yAxisLabel} />
          <Tooltip contentStyle={tooltipStyle} formatter={tipFmt} />
          <Bar dataKey={yKey} radius={[5,5,0,0]} cursor="pointer">
            {spec.data.map((_,i)=><Cell key={i} fill={c[i%c.length]} />)}
          </Bar>
        </BarChart>
      )
    }
  })()

  const showOverlay = insightOverlayEnabled && hovered && insights?.length > 0

  return (
    <>
      {popup && <DatapointPopup data={popup} />}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative', background: v('--bg-surface'),
          border: `1px solid ${v('--border')}`, borderRadius: 16,
          padding: '14px 14px 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: hovered ? v('--shadow-md') : v('--shadow-sm'),
          transition: 'box-shadow 0.2s, transform 0.2s',
          transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        }}
      >
        <div style={{ fontSize: 9.5, fontWeight: 700, color: v('--text-muted'), letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: c[0], flexShrink: 0 }} />
          {chartType}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
        </div>

        {showOverlay && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(10,12,20,0.94)',
            backdropFilter: 'blur(8px)',
            borderRadius: 16, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '22px 20px',
            animation: 'fadeIn 0.15s ease',
          }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>AI Insight</div>
            <p style={{ fontSize: 13.5, color: '#fff', lineHeight: 1.65, marginBottom: 14 }}>{insights[0]}</p>
            {onVoicePlay && (
              <button onClick={() => onVoicePlay(insights[0])}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 13px', borderRadius: 20, fontSize: 11, cursor: 'pointer', width: 'fit-content', transition: 'background 0.15s' }}>
                <Volume2 size={11} /> Read aloud
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── DASHBOARD PANEL ───────────────────────────────────────────────
function DashboardPanel({ entry, activeTheme, onVoicePlay, dashRef, insightOverlayEnabled }) {
  const [sqlOpen, setSqlOpen] = useState(false)
  const theme = CHART_THEMES[activeTheme]
  const spec  = entry?.specs?.[activeTheme] || entry?.specs?.[Object.keys(entry?.specs||{})[0]]

  const INSIGHT_CONFIG = [
    { icon: TrendingUp,  bg: v('--accent-soft'),  border: v('--accent'),  text: v('--accent-text'),  dot: v('--accent') },
    { icon: BarChart2,   bg: v('--green-soft'),   border: v('--green'),   text: v('--green'),         dot: v('--green') },
    { icon: AlertCircle, bg: 'var(--amber-soft)',  border: v('--amber'),   text: v('--amber'),         dot: v('--amber') },
    { icon: Lightbulb,   bg: v('--purple-soft'),  border: v('--purple'),  text: v('--purple'),        dot: v('--purple') },
  ]

  if (!entry) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, padding: 40 }}>
      <div style={{ width: 72, height: 72, background: v('--bg-raised'), borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${v('--border')}` }}>
        <BarChart3 size={30} color={v('--text-faint')} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: v('--text-secondary') }}>No dashboard yet</div>
      <div style={{ fontSize: 13, color: v('--text-muted'), textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
        Ask a question in Agent mode to generate charts and insights
      </div>
    </div>
  )

  const specList = Array.isArray(spec) ? spec
    : spec ? [spec, spec, spec, spec] : []

  return (
    <div ref={dashRef} style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 22, background: v('--bg-base'), minHeight: '100%' }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: v('--text-primary'), letterSpacing: '-0.02em', marginBottom: 4, lineHeight: 1.3 }}>
            {entry.title || entry.question}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: v('--text-muted') }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: v('--green') }} />
              {entry.rowCount} rows returned
            </span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} /> {entry.time}
            </span>
          </div>
        </div>
      </div>

      {/* Chart grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '296px 296px', gap: 14 }}>
        {specList.map((chartSpec, i) => (
          <ChartCard key={`${chartSpec?.chart_type}-${i}`}
            spec={chartSpec} insights={entry.insights}
            onVoicePlay={i === 0 ? onVoicePlay : null}
            chartType={chartSpec?.chart_type} colors={theme.colors}
            insightOverlayEnabled={insightOverlayEnabled} />
        ))}
      </div>

      {/* Insights */}
      {entry.insights?.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: v('--text-muted'), letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            AI Insights
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {entry.insights.map((insight, i) => {
              const s = INSIGHT_CONFIG[i % INSIGHT_CONFIG.length]
              const Icon = s.icon
              return (
                <div key={i} style={{ display: 'flex', gap: 11, padding: '13px 15px', borderRadius: 13, background: s.bg, border: `1px solid ${s.border}20`, transition: 'transform 0.15s', cursor: 'default' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon size={11} color="#fff" />
                  </div>
                  <p style={{ fontSize: 12, color: s.text, lineHeight: 1.65, flex: 1, margin: 0 }}>{insight}</p>
                  <button onClick={() => onVoicePlay(insight)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.dot, opacity: 0.55, flexShrink: 0, padding: 0, transition: 'opacity 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                    onMouseLeave={e=>e.currentTarget.style.opacity='0.55'}>
                    <Volume2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SQL accordion */}
      {entry.sql && (
        <div style={{ borderRadius: 13, border: `1px solid ${v('--border')}`, overflow: 'hidden', background: v('--bg-surface') }}>
          <button onClick={() => setSqlOpen(o => !o)}
            style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: v('--text-secondary') }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: v('--green') }} />
              Generated SQL
            </span>
            {sqlOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {sqlOpen && (
            <pre style={{ margin: 0, padding: '13px 16px', fontSize: 11, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: v('--text-secondary'), background: v('--bg-raised'), borderTop: `1px solid ${v('--border')}`, overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {entry.sql}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

// ── LOGIN PAGE ────────────────────────────────────────────────────
function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handle = () => { setLoading(true); window.location.href = GOOGLE_AUTH_URL }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #060810 0%, #0D1025 40%, #130B2B 100%)',
      overflow: 'hidden',
    }}>
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(79,110,247,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '55%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Grid texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 440, margin: '0 20px', animation: 'fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: '40px 38px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 38 }}>
            <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#4F6EF7,#7C3AED)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(79,110,247,0.35)' }}>
              <BarChart3 size={22} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em' }}>Talking BI</div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 1 }}>AI-powered business intelligence</div>
            </div>
          </div>

          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', marginBottom: 32, lineHeight: 1.6 }}>
            Sign in to access your dashboards and connect your database.
          </div>

          <button onClick={handle} disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '15px 20px', background: '#fff', border: 'none', borderRadius: 13, fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1, boxShadow: '0 2px 20px rgba(0,0,0,0.25)', transition: 'all 0.2s' }}
            onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,0.3)' }}}
            onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 20px rgba(0,0,0,0.25)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div style={{ marginTop: 22, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.7 }}>
            By signing in you agree to use this tool responsibly.<br/>
            Your data stays in your own database.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CONNECT MODAL ─────────────────────────────────────────────────
function ConnectModal({ onConnect, user, onLogout }) {
  const [tab, setTab]           = useState('url')
  const [url, setUrl]           = useState('')
  const [files, setFiles]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleConnect = async () => {
    if (!url.trim()) return
    setLoading(true); setError('')
    try {
      const r = await connectDB(url.trim())
      if (r.success) onConnect(r.tables)
      else setError(r.error || 'Connection failed')
    } catch { setError('Cannot reach backend on port 8000') }
    finally { setLoading(false) }
  }

  const handleCSVUpload = async () => {
    if (!files.length) return
    setLoading(true); setError('')
    try {
      const { uploadCSV } = await import('./lib/api')
      const r = await uploadCSV(files)
      if (r.success) onConnect(r.tables)
      else setError(r.error || 'CSV upload failed')
    } catch (e) { setError(`Upload error: ${e.message}`) }
    finally { setLoading(false) }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'))
    setFiles(prev => [...prev, ...dropped])
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #060810 0%, #0D1025 40%, #130B2B 100%)',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(79,110,247,0.10) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 460, margin: '0 20px', animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: '34px 36px' }}>

          {/* User row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                {user?.picture ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#4F6EF7,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="#fff" /></div>}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{user?.name || 'Talking BI'}</div>
                <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10.5 }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 11px', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}>
              <LogOut size={11} /> Sign out
            </button>
          </div>

          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 18 }}>Connect your data</div>

          {/* Tab switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 11, padding: 3, marginBottom: 22 }}>
            {[['url', Database, 'Connection String'], ['csv', null, 'Upload CSV']].map(([id, Icon, label]) => (
              <button key={id} onClick={() => { setTab(id); setError('') }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab===id ? 600 : 400, background: tab===id ? 'rgba(255,255,255,0.12)' : 'transparent', color: tab===id ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}>
                {Icon ? <Icon size={12} /> : <span style={{ fontSize: 13 }}>↑</span>}
                {label}
              </button>
            ))}
          </div>

          {/* URL tab */}
          {tab === 'url' && (
            <>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginBottom: 14, lineHeight: 1.5 }}>
                Supports PostgreSQL, Supabase, MySQL, SQLite
              </div>
              <div style={{ position: 'relative', marginBottom: 11 }}>
                <Database size={12} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} />
                <input value={url} onChange={e => { setUrl(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
                  placeholder="postgresql:// or mysql:// or sqlite:///"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${url ? 'rgba(79,110,247,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '12px 13px 12px 37px', color: '#fff', fontSize: 11, fontFamily: "'JetBrains Mono','Fira Code',monospace", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }} />
              </div>
              {error && (
                <div style={{ display: 'flex', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '9px 12px', marginBottom: 12 }}>
                  <AlertCircle size={13} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: '#FCA5A5', fontSize: 11.5, lineHeight: 1.5 }}>{error}</span>
                </div>
              )}
              <button onClick={handleConnect} disabled={!url.trim() || loading}
                style={{ width: '100%', background: !url.trim()||loading ? 'rgba(79,110,247,0.35)' : 'linear-gradient(135deg,#4F6EF7,#7C3AED)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: !url.trim()||loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', boxShadow: url.trim()&&!loading ? '0 4px 16px rgba(79,110,247,0.3)' : 'none' }}>
                {loading ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…</> : <><Database size={13} /> Connect database</>}
              </button>
              <div style={{ marginTop: 13, fontSize: 10.5, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                Supabase → Settings → Database → URI tab
              </div>
            </>
          )}

          {/* CSV tab */}
          {tab === 'csv' && (
            <>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Each CSV file becomes a queryable table</div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? '#4F6EF7' : 'rgba(255,255,255,0.14)'}`, borderRadius: 14, padding: '30px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 14, background: dragOver ? 'rgba(79,110,247,0.07)' : 'transparent', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>📂</div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, marginBottom: 4 }}>Drop CSV files here</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>or click to browse</div>
                <input ref={fileInputRef} type="file" accept=".csv" multiple style={{ display: 'none' }}
                  onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
              </div>
              {files.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.06)', borderRadius: 9, padding: '7px 12px', marginBottom: 5 }}>
                      <span style={{ fontSize: 11.5, color: '#fff' }}>📄 {f.name}</span>
                      <button onClick={() => setFiles(prev => prev.filter((_,j)=>j!==i))}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              {error && (
                <div style={{ display: 'flex', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '9px 12px', marginBottom: 12 }}>
                  <AlertCircle size={13} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: '#FCA5A5', fontSize: 11.5 }}>{error}</span>
                </div>
              )}
              <button onClick={handleCSVUpload} disabled={!files.length||loading}
                style={{ width: '100%', background: !files.length||loading ? 'rgba(16,185,106,0.3)' : 'linear-gradient(135deg,#10B981,#059669)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: !files.length||loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                {loading ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</> : <>↑ Load {files.length || ''} CSV {files.length === 1 ? 'file' : 'files'}</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── ICON BUTTON ───────────────────────────────────────────────────
function IconBtn({ active, onClick, title, children, activeColor }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 11px', borderRadius: 20,
        border: `1px solid ${active ? (activeColor||'var(--accent)')+'33' : v('--border')}`,
        background: active ? (activeColor||'var(--accent)')+'15' : hov ? v('--bg-raised') : 'transparent',
        color: active ? (activeColor||v('--accent-text')) : v('--text-muted'),
        fontWeight: active ? 600 : 400, cursor: 'pointer',
        fontSize: 11.5, transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}>
      {children}
    </button>
  )
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function App() {
  const {
    user, setUser, logout,
    messages, addMessage, setLoading, isLoading,
    voiceEnabled, toggleVoice, activeTheme, setTheme,
    isConnected, dbTables, setConnected,
  } = useDashboardStore()

  const [authChecked,          setAuthChecked]          = useState(false)
  const [history,              setHistory]              = useState([])
  const [activeEntry,          setActiveEntry]          = useState(null)
  const [sideTab,              setSideTab]              = useState('chat')
  const [chatMode,             setChatMode]             = useState('agent')
  const [input,                setInput]                = useState('')
  const [isRecording,          setIsRecording]          = useState(false)
  const [insightOverlayEnabled,setInsightOverlayEnabled]= useState(false)
  const [isPlaying,            setIsPlaying]            = useState(false)
  const [darkMode,             setDarkMode]             = useState(() => {
    const stored = localStorage.getItem('tbi_dark')
    return stored !== null ? stored === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const mediaRef  = useRef(null)
  const audioRef  = useRef(null)
  const chunksRef = useRef([])
  const bottomRef = useRef(null)
  const dashRef   = useRef(null)

  // Apply theme on mount and toggle
  useEffect(() => { applyTheme(darkMode) }, [darkMode])

  const toggleDark = () => {
    setDarkMode(d => {
      const next = !d
      localStorage.setItem('tbi_dark', String(next))
      return next
    })
  }

  // Auth init (unchanged logic)
  useEffect(() => {
    const init = async () => {
      if (window.location.pathname === '/auth') {
        const params = new URLSearchParams(window.location.search)
        const token  = params.get('token')
        if (token) { localStorage.setItem('tbi_token', token); window.history.replaceState({}, '', '/') }
      }
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('auth_error')) window.history.replaceState({}, '', '/')
      const stored = localStorage.getItem('tbi_token')
      if (stored) { try { const me = await getMe(); setUser(me) } catch { localStorage.removeItem('tbi_token') } }
      setAuthChecked(true)
    }
    init()
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Voice (unchanged logic)
  const handleSpeak = async (text) => {
    if (audioRef.current && !audioRef.current.ended) {
      if (audioRef.current.paused) { audioRef.current.play(); setIsPlaying(true) }
      else { audioRef.current.pause(); setIsPlaying(false) }
      return
    }
    try {
      const blob = await speakText(text); if (!blob) return
      const url  = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio; setIsPlaying(true); audio.play()
      audio.onended = () => { URL.revokeObjectURL(url); setIsPlaying(false); audioRef.current = null }
      audio.onerror = () => { setIsPlaying(false); audioRef.current = null }
    } catch (e) { console.error('TTS:', e) }
  }

  const handleStopSpeech = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; setIsPlaying(false) }
  }

  // Send (unchanged logic)
  const handleSend = async (text) => {
    const question = (text || input).trim()
    if (!question || isLoading) return
    setInput('')
    addMessage({ role: 'user', content: question })
    setLoading(true)
    try {
      const historyMsgs = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const result      = await queryBI(question, historyMsgs)
      if (result.error) {
        addMessage({ role: 'assistant', content: result.error, isError: true })
      } else {
        addMessage({ role: 'assistant', content: result.answer, sql: result.sql, rowCount: result.row_count })
        if (chatMode === 'agent' && result.chart_specs && Object.keys(result.chart_specs).length > 0) {
          const entry = { id: Date.now(), question, title: result.title || question, specs: result.chart_specs, insights: result.insights || [], sql: result.sql, rowCount: result.row_count, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          setHistory(h => [entry, ...h]); setActiveEntry(entry)
        }
        if (voiceEnabled && result.answer) handleSpeak(result.answer)
      }
    } catch (e) { addMessage({ role: 'assistant', content: `Error: ${e.message}`, isError: true }) }
    finally { setLoading(false) }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr     = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        try { const { text } = await transcribeAudio(blob); if (text) handleSend(text) } catch {}
      }
      mr.start(); mediaRef.current = mr; setIsRecording(true)
    } catch { alert('Microphone access denied') }
  }
  const stopRecording = () => { mediaRef.current?.stop(); setIsRecording(false) }

  const handleDownload = async (format) => {
    if (!dashRef.current) return
    try {
      const domtoimage = (await import('dom-to-image-more')).default
      const bg = darkMode ? '#0C0E14' : '#F7F8FA'
      if (format === 'png') {
        const dataUrl = await domtoimage.toPng(dashRef.current, { scale: 2, bgcolor: bg })
        const a = document.createElement('a'); a.href = dataUrl; a.download = 'dashboard.png'
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
      } else {
        const { default: jsPDF } = await import('jspdf')
        const dataUrl = await domtoimage.toPng(dashRef.current, { scale: 2, bgcolor: bg })
        const img = new Image(); img.src = dataUrl; await new Promise(r => { img.onload = r })
        const w = img.width / 2, h = img.height / 2
        const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w, h] })
        pdf.addImage(dataUrl, 'PNG', 0, 0, w, h); pdf.save('dashboard.pdf')
      }
    } catch (e) { alert('Download failed: ' + e.message) }
  }

  const theme = CHART_THEMES[activeTheme]

  // ── RENDER GATES ──────────────────────────────────────────────
  if (!authChecked) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#060810' }}>
      <RefreshCw size={22} color="#4F6EF7" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )
  if (!user)        return <LoginPage />
  if (!isConnected) return <ConnectModal onConnect={setConnected} user={user} onLogout={logout} />

  // ── MAIN LAYOUT ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: v('--bg-base'), overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif", transition: 'background 0.3s, color 0.3s' }}>

      {/* ── SIDEBAR ───────────────────────────────────────────── */}
      <div style={{ width: 298, flexShrink: 0, display: 'flex', flexDirection: 'column', background: v('--sidebar-bg'), borderRight: `1px solid ${v('--border')}`, transition: 'background 0.3s' }}>

        {/* Sidebar header */}
        <div style={{ padding: '14px 14px 0', borderBottom: `1px solid ${v('--border')}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
            <div style={{ width: 31, height: 31, background: 'linear-gradient(135deg,#4F6EF7,#7C3AED)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(79,110,247,0.3)' }}>
              <BarChart3 size={14} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: v('--text-primary'), letterSpacing: '-0.01em' }}>Talking BI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: v('--green'), flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: v('--green'), fontWeight: 600 }}>{dbTables.length} tables connected</span>
              </div>
            </div>
            {/* User avatar + controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <button onClick={toggleDark} title={darkMode ? 'Light mode' : 'Dark mode'}
                style={{ width: 26, height: 26, borderRadius: 8, background: v('--bg-raised'), border: `1px solid ${v('--border')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: v('--text-muted'), transition: 'all 0.15s', flexShrink: 0 }}>
                {darkMode ? <Sun size={12} /> : <Moon size={12} />}
              </button>
              <div style={{ width: 27, height: 27, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${v('--border-strong')}`, flexShrink: 0 }}>
                {user?.picture ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#4F6EF7,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={12} color="#fff" /></div>}
              </div>
              <button onClick={logout} title="Sign out"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: v('--text-faint'), padding: 2, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color=v('--red')}
                onMouseLeave={e => e.currentTarget.style.color=v('--text-faint')}>
                <LogOut size={13} />
              </button>
            </div>
          </div>

          {/* Chat / History tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, background: v('--bg-raised'), borderRadius: 10, padding: 3, marginBottom: 12 }}>
            {[['chat', MessageSquare, 'Chat'], ['history', History, 'History']].map(([id, Icon, label]) => (
              <button key={id} onClick={() => setSideTab(id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: sideTab===id ? 600 : 400, background: sideTab===id ? v('--bg-surface') : 'transparent', color: sideTab===id ? v('--text-primary') : v('--text-muted'), boxShadow: sideTab===id ? v('--shadow-sm') : 'none', transition: 'all 0.15s' }}>
                <Icon size={11} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CHAT TAB ─────────────────────────────────────────── */}
        {sideTab === 'chat' && (
          <>
            {/* Agent / Ask toggle */}
            <div style={{ padding: '10px 12px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, background: v('--bg-raised'), border: `1px solid ${v('--border')}`, borderRadius: 11, padding: 3 }}>
                {[['agent', Bot, 'Agent'], ['ask', MessageSquare, 'Ask']].map(([id, Icon, label]) => (
                  <button key={id} onClick={() => setChatMode(id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: chatMode===id ? 600 : 400,
                      background: chatMode===id ? (id==='agent' ? 'linear-gradient(135deg,#4F6EF7,#7C3AED)' : v('--bg-surface')) : 'transparent',
                      color: chatMode===id ? (id==='agent' ? '#fff' : v('--text-primary')) : v('--text-muted'),
                      boxShadow: chatMode===id&&id==='ask' ? v('--shadow-sm') : 'none', transition: 'all 0.15s' }}>
                    <Icon size={11} />{label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: v('--text-faint'), textAlign: 'center', marginTop: 6, marginBottom: 2 }}>
                {chatMode === 'agent' ? '⚡ Generates charts + insights' : '💬 Text answers only'}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {messages.length === 0 && (
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: v('--text-faint'), letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 4px', marginBottom: 8 }}>Suggested</div>
                  {SAMPLE_QUESTIONS.map(q => (
                    <button key={q} onClick={() => handleSend(q)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', fontSize: 12, padding: '9px 12px', borderRadius: 11, border: `1px solid ${v('--border')}`, background: v('--bg-surface'), color: v('--text-secondary'), cursor: 'pointer', marginBottom: 4, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background=v('--accent-soft'); e.currentTarget.style.borderColor=v('--accent')+'55'; e.currentTarget.style.color=v('--accent-text') }}
                      onMouseLeave={e => { e.currentTarget.style.background=v('--bg-surface'); e.currentTarget.style.borderColor=v('--border'); e.currentTarget.style.color=v('--text-secondary') }}>
                      <Sparkles size={10} style={{ color: v('--accent'), flexShrink: 0 }} />{q}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeSlideUp 0.2s ease' }}>
                  <div style={{ maxWidth: '88%', borderRadius: m.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '9px 13px', fontSize: 12.5, lineHeight: 1.65,
                    background: m.role==='user' ? v('--user-bubble') : m.isError ? v('--red-soft') : v('--bg-raised'),
                    color: m.role==='user' ? '#fff' : m.isError ? v('--red') : v('--text-primary'),
                    border: m.role!=='user' ? `1px solid ${m.isError ? v('--red')+'30' : v('--border')}` : 'none',
                    boxShadow: m.role==='user' ? '0 2px 8px rgba(79,110,247,0.25)' : 'none',
                  }}>
                    {m.content}
                    {m.rowCount !== undefined && m.role === 'assistant' && !m.isError && (
                      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>{m.rowCount} rows returned</div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', animation: 'fadeSlideUp 0.2s ease' }}>
                  <div style={{ background: v('--bg-raised'), border: `1px solid ${v('--border')}`, borderRadius: '16px 16px 16px 4px', padding: '11px 15px', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: v('--accent'), display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${i*0.15}s`, opacity: 0.7 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{ padding: '8px 10px 13px', borderTop: `1px solid ${v('--border')}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: v('--bg-raised'), border: `1px solid ${v('--border')}`, borderRadius: 13, padding: '8px 11px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onFocusCapture={e => { e.currentTarget.style.borderColor=v('--accent')+'55'; e.currentTarget.style.boxShadow=`0 0 0 3px ${v('--accent')}12` }}
                onBlurCapture={e => { e.currentTarget.style.borderColor=v('--border'); e.currentTarget.style.boxShadow='none' }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={chatMode === 'agent' ? 'Ask to generate charts…' : 'Ask a question…'}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: v('--text-primary') }} />
                <button onClick={isRecording ? stopRecording : startRecording}
                  style={{ background: isRecording ? v('--red-soft') : 'none', border: isRecording ? `1px solid ${v('--red')}30` : 'none', cursor: 'pointer', color: isRecording ? v('--red') : v('--text-faint'), padding: isRecording ? '3px 6px' : 2, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
                  {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
                <button onClick={() => handleSend()} disabled={!input.trim() || isLoading}
                  style={{ background: input.trim()&&!isLoading ? 'linear-gradient(135deg,#4F6EF7,#7C3AED)' : v('--bg-subtle'), border: 'none', borderRadius: 9, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim()&&!isLoading ? 'pointer' : 'not-allowed', color: input.trim()&&!isLoading ? '#fff' : v('--text-faint'), transition: 'all 0.2s', boxShadow: input.trim()&&!isLoading ? '0 2px 8px rgba(79,110,247,0.3)' : 'none' }}>
                  <Send size={12} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── HISTORY TAB ──────────────────────────────────────── */}
        {sideTab === 'history' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {history.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48, gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: v('--bg-raised'), border: `1px solid ${v('--border')}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <History size={20} color={v('--text-faint')} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: v('--text-secondary') }}>No history yet</div>
                <div style={{ fontSize: 11, color: v('--text-muted'), textAlign: 'center', lineHeight: 1.6 }}>Agent mode queries will appear here</div>
              </div>
            ) : history.map(entry => (
              <button key={entry.id} onClick={() => setActiveEntry(entry)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 9, width: '100%', textAlign: 'left', padding: '10px 11px', borderRadius: 12, border: `1px solid ${activeEntry?.id===entry.id ? v('--accent')+'44' : v('--border')}`, background: activeEntry?.id===entry.id ? v('--accent-soft') : v('--bg-surface'), cursor: 'pointer', marginBottom: 5, transition: 'all 0.15s' }}
                onMouseEnter={e => { if(activeEntry?.id!==entry.id) e.currentTarget.style.background=v('--bg-raised') }}
                onMouseLeave={e => { if(activeEntry?.id!==entry.id) e.currentTarget.style.background=v('--bg-surface') }}>
                <div style={{ width: 27, height: 27, borderRadius: 8, background: activeEntry?.id===entry.id ? v('--accent')+'22' : v('--bg-raised'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BarChart2 size={12} color={activeEntry?.id===entry.id ? v('--accent') : v('--text-muted')} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: activeEntry?.id===entry.id ? v('--accent-text') : v('--text-primary'), marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.title || entry.question}
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, color: v('--text-muted') }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} />{entry.time}</span>
                    <span>{entry.rowCount} rows</span>
                  </div>
                </div>
                <ChevronRight size={12} color={activeEntry?.id===entry.id ? v('--accent') : v('--text-faint')} style={{ flexShrink: 0, marginTop: 7 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ background: v('--topbar-bg'), backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${v('--border')}`, padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, transition: 'background 0.3s' }}>
          {/* Chart theme switcher */}
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(CHART_THEMES).map(([id, t]) => (
              <button key={id} onClick={() => setTheme(id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5.5, fontSize: 11.5, padding: '5px 12px', borderRadius: 20, border: `1px solid ${activeTheme===id ? v('--border-strong') : v('--border')}`, background: activeTheme===id ? v('--bg-surface') : 'transparent', color: activeTheme===id ? v('--text-primary') : v('--text-muted'), fontWeight: activeTheme===id ? 600 : 400, cursor: 'pointer', boxShadow: activeTheme===id ? v('--shadow-sm') : 'none', transition: 'all 0.15s' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent, flexShrink: 0 }} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconBtn active={insightOverlayEnabled} onClick={() => setInsightOverlayEnabled(v => !v)} title={insightOverlayEnabled ? 'Disable hover insights' : 'Enable hover insights'}>
              {insightOverlayEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>Insights</span>
            </IconBtn>

            <IconBtn active={voiceEnabled} onClick={toggleVoice}>
              {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              <span>Voice</span>
            </IconBtn>

            {isPlaying && (
              <IconBtn active={true} onClick={handleStopSpeech} activeColor="var(--red)">
                <Square size={10} />
                <span style={{ animation: 'pulse 1s infinite' }}>Stop</span>
              </IconBtn>
            )}

            {activeEntry && (
              <>
                <div style={{ width: 1, height: 18, background: v('--border'), margin: '0 2px' }} />
                <button onClick={() => handleDownload('png')}
                  style={{ display: 'flex', alignItems: 'center', gap: 5.5, fontSize: 11.5, padding: '5px 12px', borderRadius: 8, border: `1px solid ${v('--border-strong')}`, background: v('--bg-surface'), color: v('--text-secondary'), cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background=v('--bg-raised') }}
                  onMouseLeave={e => { e.currentTarget.style.background=v('--bg-surface') }}>
                  <Download size={11} /> PNG
                </button>
                <button onClick={() => handleDownload('pdf')}
                  style={{ display: 'flex', alignItems: 'center', gap: 5.5, fontSize: 11.5, padding: '5px 12px', borderRadius: 8, border: 'none', background: v('--text-primary'), color: v('--bg-base'), cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s', boxShadow: v('--shadow-sm') }}>
                  <Download size={11} /> PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dashboard */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <DashboardPanel
            entry={activeEntry}
            activeTheme={activeTheme}
            onVoicePlay={handleSpeak}
            dashRef={dashRef}
            insightOverlayEnabled={insightOverlayEnabled}
          />
        </div>
      </div>

      {/* ── GLOBAL STYLES ─────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { color-scheme: light dark; }
        html { font-family: 'DM Sans', 'Segoe UI', sans-serif; }
        body { overflow: hidden; background: var(--bg-base); color: var(--text-primary); transition: background 0.3s, color 0.3s; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

        /* Inputs */
        input::placeholder { color: var(--text-faint); }
        input { caret-color: var(--accent); }

        /* Recharts tooltip overrides */
        .recharts-tooltip-wrapper { outline: none; }

        /* Animations */
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes bounce       { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-4px);opacity:1} }
        @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:0.55} }
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
        @keyframes fadeSlideUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn        { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }

        /* Amber soft for dark mode (CSS var can't be set via JS easily) */
        :root { --amber-soft: #FFFBEB; }
        @media (prefers-color-scheme: dark) {
          :root { --amber-soft: #1C1400; }
        }
      `}</style>
    </div>
  )
}