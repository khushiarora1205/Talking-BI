// src/App.jsx
import { useState, useRef, useEffect } from 'react'
import {
  BarChart3, Send, Mic, MicOff, Volume2, VolumeX,
  Database, CheckCircle2, ChevronDown, ChevronUp,
  Download, Sparkles, TrendingUp, AlertCircle, Lightbulb,
  BarChart2, RefreshCw, History, MessageSquare, Bot,
  Clock, ChevronRight, Eye, EyeOff, LogOut, User,
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

const THEMES = {
  minimal:   { label: 'Minimal',   accent: '#3B82F6', colors: ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'] },
  executive: { label: 'Executive', accent: '#6366F1', colors: ['#312E81','#4338CA','#6366F1','#818CF8','#A5B4FC','#C7D2FE'] },
  earthy:    { label: 'Earthy',    accent: '#D97706', colors: ['#92400E','#D97706','#FBBF24','#6B7280','#374151','#9CA3AF'] },
  vivid:     { label: 'Vivid',     accent: '#EC4899', colors: ['#EC4899','#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444'] },
}
const CHART_VARIANTS = ['bar', 'line', 'area', 'pie']
const SAMPLE_QUESTIONS = [
  'Total profit by category',
  'Monthly sales revenue for 2004',
  'Top product lines by revenue',
  'Payment mode distribution',
  'Top 5 sub-categories by profit',
  'Orders by country',
]
const INSIGHT_STYLES = [
  { icon: TrendingUp,  bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: '#3B82F6' },
  { icon: BarChart2,   bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', dot: '#10B981' },
  { icon: AlertCircle, bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
  { icon: Lightbulb,   bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', dot: '#8B5CF6' },
]

// ── NUMBER FORMATTER ──────────────────────────────────────────────
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
function DatapointPopup({ data, onClose }) {
  if (!data) return null
  return (
    <div style={{
      position: 'fixed', top: data.y + 12, left: data.x,
      background: '#1F2937', color: '#fff', borderRadius: 10,
      padding: '10px 14px', fontSize: 12, zIndex: 1000,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)', minWidth: 140,
      border: '1px solid rgba(255,255,255,0.1)',
      pointerEvents: 'none',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#93C5FD' }}>
        {data.label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>
        {formatTooltipNumber(data.value)}
      </div>
      {data.name && data.name !== data.label && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
          {data.name}
        </div>
      )}
    </div>
  )
}

// ── CHART CARD ────────────────────────────────────────────────────
function ChartCard({ spec, insights, onVoicePlay, chartType, colors, insightOverlayEnabled }) {
  const [hovered, setHovered] = useState(false)
  const [popup, setPopup] = useState(null)
  const c = colors || spec?.colors || THEMES.minimal.colors

  if (!spec?.data?.length) return (
    <div style={{
      background: '#F9FAFB', border: '1px dashed #E5E7EB', borderRadius: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: 220, color: '#D1D5DB', fontSize: 13,
    }}>
      No data
    </div>
  )

  const xKey = spec.x_key
  const yKey = spec.y_key

  const tooltipStyle = {
    borderRadius: 10, border: 'none',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    fontSize: 12, padding: '8px 12px',
  }
  const axisStyle = { fontSize: 10, fill: '#9CA3AF' }
  const xTickFormatter = (v) => {
    const s = String(v)
    return s.length > 10 ? s.slice(0, 9) + '…' : s
  }

  const handleClick = (data, e) => {
    if (!data) return
    const val = data.value ?? data.payload?.[yKey]
    const lbl = data.name ?? data.payload?.[xKey] ?? ''
    const rect = e?.currentTarget?.closest('svg')?.getBoundingClientRect()
    setPopup({
      value: val,
      label: lbl,
      name: data.payload?.[xKey] ?? '',
      x: e?.clientX ?? 200,
      y: e?.clientY ?? 200,
    })
    setTimeout(() => setPopup(null), 3000)
  }

  const handlePieClick = (entry, _, e) => {
    setPopup({
      value: entry[yKey] ?? entry.value,
      label: entry[xKey] ?? entry.name ?? '',
      name: '',
      x: e?.clientX ?? 300,
      y: e?.clientY ?? 300,
    })
    setTimeout(() => setPopup(null), 3000)
  }

  const commonTooltipFormatter = (val, name) => [formatTooltipNumber(val), name]

  const chart = (() => {
    const margin = { top: 5, right: 10, left: 10, bottom: 40 }
    switch (chartType) {
      case 'line': return (
        <LineChart data={spec.data} margin={margin} onClick={(d, e) => d?.activePayload && handleClick(d.activePayload[0], e)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false}
            tickFormatter={xTickFormatter} angle={-35} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false}
            tickFormatter={formatAxisNumber} width={55} />
          <Tooltip contentStyle={tooltipStyle} formatter={commonTooltipFormatter} />
          <Line type="monotone" dataKey={yKey} stroke={c[0]} strokeWidth={2.5}
            dot={spec.data.length <= 20 ? { r: 3, fill: c[0], cursor: 'pointer' } : false}
            activeDot={{ r: 5, fill: c[0], cursor: 'pointer' }} />
        </LineChart>
      )
      case 'area': return (
        <AreaChart data={spec.data} margin={margin} onClick={(d, e) => d?.activePayload && handleClick(d.activePayload[0], e)}>
          <defs>
            <linearGradient id={`ag-${c[0].replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={c[0]} stopOpacity={0.18} />
              <stop offset="95%" stopColor={c[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false}
            tickFormatter={xTickFormatter} angle={-35} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false}
            tickFormatter={formatAxisNumber} width={55} />
          <Tooltip contentStyle={tooltipStyle} formatter={commonTooltipFormatter} />
          <Area type="monotone" dataKey={yKey} stroke={c[0]} strokeWidth={2.5}
            fill={`url(#ag-${c[0].replace('#', '')})`} />
        </AreaChart>
      )
      case 'pie': return (
        <PieChart>
          <Pie
            data={spec.data} dataKey={yKey} nameKey={xKey}
            cx="50%" cy="48%" outerRadius="70%" paddingAngle={2}
            onClick={handlePieClick}
            style={{ cursor: 'pointer' }}
            label={({ name, percent, value }) => {
              if (percent < 0.04) return null
              const short = String(name).length > 8 ? String(name).slice(0, 7) + '…' : String(name)
              return `${short}: ${(percent * 100).toFixed(0)}%`
            }}
            labelLine={{ stroke: '#9CA3AF', strokeWidth: 0.8 }}
          >
            {spec.data.map((_, i) => (
              <Cell key={i} fill={c[i % c.length]} stroke="#fff" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(val, name) => [formatTooltipNumber(val), String(name).slice(0, 25)]}
          />
          {spec.data.length <= 8 && (
            <Legend
              formatter={v => <span style={{ fontSize: 10, color: '#6B7280' }}>{String(v).slice(0, 18)}</span>}
              wrapperStyle={{ paddingTop: 4, fontSize: 10 }}
            />
          )}
        </PieChart>
      )
      default: return (  // bar
        <BarChart data={spec.data}
          barSize={Math.max(6, Math.min(28, 180 / Math.max(spec.data.length, 1)))}
          margin={margin}
          onClick={(d, e) => d?.activePayload && handleClick(d.activePayload[0], e)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false}
            tickFormatter={xTickFormatter} angle={-35} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false}
            tickFormatter={formatAxisNumber} width={55} />
          <Tooltip contentStyle={tooltipStyle} formatter={commonTooltipFormatter} />
          <Bar dataKey={yKey} radius={[4, 4, 0, 0]} cursor="pointer">
            {spec.data.map((_, i) => <Cell key={i} fill={c[i % c.length]} />)}
          </Bar>
        </BarChart>
      )
    }
  })()

  const showOverlay = insightOverlayEnabled && hovered && insights?.length > 0

  return (
    <>
      {popup && <DatapointPopup data={popup} onClose={() => setPopup(null)} />}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative', background: '#fff',
          border: '1px solid #F3F4F6', borderRadius: 16,
          padding: '12px 12px 8px', overflow: 'hidden',
          boxShadow: hovered ? '0 8px 30px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          {chartType}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
        </div>

        {showOverlay && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.94)',
            borderRadius: 16, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '20px 18px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              AI Insight
            </div>
            <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.6, marginBottom: 12 }}>
              {insights[0]}
            </p>
            {onVoicePlay && (
              <button onClick={() => onVoicePlay(insights[0])}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', width: 'fit-content' }}>
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
  const theme = THEMES[activeTheme]
  const spec = entry?.specs?.[activeTheme] || entry?.specs?.[Object.keys(entry?.specs || {})[0]]

  if (!entry) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF' }}>
      <div style={{ width: 64, height: 64, background: '#F9FAFB', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <BarChart3 size={28} color="#D1D5DB" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>No dashboard yet</div>
      <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', maxWidth: 260 }}>
        Ask a question in Agent mode to generate charts and insights
      </div>
    </div>
  )

  return (
    <div ref={dashRef} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, background: '#F8FAFC' }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: '#111827' }}>
          {entry.title || entry.question}
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
          {entry.rowCount} rows · {entry.time}
        </div>
      </div>

      {/* 2×2 Chart grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '280px 280px', gap: 14 }}>
        {CHART_VARIANTS.map((type, i) => (
          <ChartCard key={type} spec={spec} insights={entry.insights}
            onVoicePlay={i === 0 ? onVoicePlay : null}
            chartType={type} colors={theme.colors}
            insightOverlayEnabled={insightOverlayEnabled}
          />
        ))}
      </div>

      {/* Insights — always visible */}
      {entry.insights?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            AI Insights
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {entry.insights.map((insight, i) => {
              const s = INSIGHT_STYLES[i % INSIGHT_STYLES.length]
              const Icon = s.icon
              return (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: s.bg, border: `1px solid ${s.border}` }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon size={10} color="#fff" />
                  </div>
                  <p style={{ fontSize: 12, color: s.text, lineHeight: 1.6, flex: 1, margin: 0 }}>{insight}</p>
                  <button onClick={() => onVoicePlay(insight)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.dot, opacity: 0.5, flexShrink: 0, padding: 0 }}>
                    <Volume2 size={11} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SQL */}
      {entry.sql && (
        <div style={{ borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden', background: '#fff' }}>
          <button onClick={() => setSqlOpen(o => !o)}
            style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#6B7280' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              Generated SQL
            </span>
            {sqlOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {sqlOpen && (
            <pre style={{ margin: 0, padding: '12px 16px', fontSize: 11, fontFamily: 'monospace', color: '#374151', background: '#F9FAFB', borderTop: '1px solid #F3F4F6', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
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

  const handleGoogleLogin = () => {
    setLoading(true)
    window.location.href = GOOGLE_AUTH_URL
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)' }}>
      <div style={{ position: 'absolute', top: '20%', left: '20%', width: 400, height: 400, background: 'rgba(99,102,241,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: 300, height: 300, background: 'rgba(139,92,246,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420, margin: '0 16px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 36px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={24} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>Talking BI</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>AI-powered business intelligence</div>
          </div>
        </div>

        <div style={{ marginBottom: 8, fontSize: 22, fontWeight: 700, color: '#fff' }}>Welcome back</div>
        <div style={{ marginBottom: 32, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          Sign in to access your dashboards and connect your database.
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: '14px 20px', background: '#fff', border: 'none',
            borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#374151',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {/* Google G logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Redirecting to Google...' : 'Continue with Google'}
        </button>

        <div style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.6 }}>
          By signing in, you agree to use this tool responsibly.<br />
          Your data stays in your own database.
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── CONNECT MODAL ─────────────────────────────────────────────────
function ConnectModal({ onConnect, user, onLogout }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async () => {
    if (!url.trim()) return
    setLoading(true); setError('')
    try {
      const r = await connectDB(url.trim())
      if (r.success) onConnect(r.tables)
      else setError(r.error || 'Connection failed')
    } catch { setError('Cannot reach backend on port 8000') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)' }}>
      <div style={{ position: 'absolute', top: '20%', left: '20%', width: 400, height: 400, background: 'rgba(99,102,241,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: 300, height: 300, background: 'rgba(139,92,246,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 440, margin: '0 16px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '36px' }}>
        {/* User info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {user?.picture
                ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <BarChart3 size={22} color="#fff" />}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Talking BI</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{user?.email || 'Signed in'}</div>
            </div>
          </div>
          <button onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer' }}>
            <LogOut size={11} /> Logout
          </button>
        </div>

        <div style={{ marginBottom: 6, fontSize: 20, fontWeight: 600, color: '#fff' }}>Connect your database</div>
        <div style={{ marginBottom: 24, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Paste your Supabase PostgreSQL connection string</div>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Database size={13} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} />
          <input value={url} onChange={e => { setUrl(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handle()}
            placeholder="postgresql://user:password@host:6543/postgres?sslmode=require"
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px 12px 38px', color: '#fff', fontSize: 11, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
            <AlertCircle size={13} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: '#FCA5A5', fontSize: 12 }}>{error}</span>
          </div>
        )}

        <button onClick={handle} disabled={!url.trim() || loading}
          style={{ width: '100%', background: !url.trim() || loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #3B82F6, #6366F1)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: !url.trim() || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Connecting...</> : <><Database size={14} /> Connect database</>}
        </button>

        <div style={{ marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
          Supabase → Settings → Database → Connection string → URI
        </div>
      </div>
    </div>
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

  const [authChecked, setAuthChecked] = useState(false)
  const [history, setHistory] = useState([])
  const [activeEntry, setActiveEntry] = useState(null)
  const [sideTab, setSideTab] = useState('chat')
  const [chatMode, setChatMode] = useState('agent')
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [insightOverlayEnabled, setInsightOverlayEnabled] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const bottomRef = useRef(null)
  const dashRef = useRef(null)

  // ── AUTH INIT ── check token on mount + handle OAuth callback ──
  useEffect(() => {
    const init = async () => {
      // Handle OAuth callback: /auth?token=xxx
      if (window.location.pathname === '/auth') {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        if (token) {
          localStorage.setItem('tbi_token', token)
          window.history.replaceState({}, '', '/')
        }
      }

      // Check for error
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('auth_error')) {
        window.history.replaceState({}, '', '/')
      }

      // Try to restore session from stored token
      const stored = localStorage.getItem('tbi_token')
      if (stored) {
        try {
          const me = await getMe()
          setUser(me)
        } catch {
          localStorage.removeItem('tbi_token')
        }
      }
      setAuthChecked(true)
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSpeak = async (text) => {
    try {
      const blob = await speakText(text)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.play()
      audio.onended = () => URL.revokeObjectURL(url)
    } catch (e) { console.error('TTS:', e) }
  }

  const handleSend = async (text) => {
    const question = (text || input).trim()
    if (!question || isLoading) return
    setInput('')
    addMessage({ role: 'user', content: question })
    setLoading(true)
    try {
      const historyMsgs = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const result = await queryBI(question, historyMsgs)
      if (result.error) {
        addMessage({ role: 'assistant', content: result.error, isError: true })
      } else {
        addMessage({ role: 'assistant', content: result.answer, sql: result.sql, rowCount: result.row_count })
        if (chatMode === 'agent' && result.chart_specs && Object.keys(result.chart_specs).length > 0) {
          const entry = {
            id: Date.now(), question,
            title: result.title || question,
            specs: result.chart_specs,
            insights: result.insights || [],
            sql: result.sql,
            rowCount: result.row_count,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          setHistory(h => [entry, ...h])
          setActiveEntry(entry)
        }
        if (voiceEnabled && result.answer) handleSpeak(result.answer)
      }
    } catch (e) {
      addMessage({ role: 'assistant', content: `Error: ${e.message}`, isError: true })
    } finally { setLoading(false) }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
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
      if (format === 'png') {
        const dataUrl = await domtoimage.toPng(dashRef.current, { scale: 2, bgcolor: '#F8FAFC' })
        const a = document.createElement('a')
        a.href = dataUrl; a.download = 'dashboard.png'
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
      } else {
        const { default: jsPDF } = await import('jspdf')
        const dataUrl = await domtoimage.toPng(dashRef.current, { scale: 2, bgcolor: '#F8FAFC' })
        const img = new Image(); img.src = dataUrl
        await new Promise(r => { img.onload = r })
        const w = img.width / 2, h = img.height / 2
        const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w, h] })
        pdf.addImage(dataUrl, 'PNG', 0, 0, w, h)
        pdf.save('dashboard.pdf')
      }
    } catch (e) { alert('Download failed: ' + e.message) }
  }

  const theme = THEMES[activeTheme]

  // ── RENDER GATES ──────────────────────────────────────────────
  if (!authChecked) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0F172A' }}>
      <RefreshCw size={24} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!user) return <LoginPage />

  if (!isConnected) return (
    <ConnectModal onConnect={setConnected} user={user} onLogout={logout} />
  )

  // ── MAIN DASHBOARD ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>

      {/* LEFT SIDEBAR */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #F1F5F9' }}>

        {/* Header */}
        <div style={{ padding: '14px 14px 0', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#3B82F6,#6366F1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={15} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Talking BI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 500 }}>{dbTables.length} tables</span>
              </div>
            </div>
            {/* User avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: '2px solid #E2E8F0' }}>
                {user?.picture
                  ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={13} color="#fff" /></div>}
              </div>
              <button onClick={logout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 2 }}
                title="Logout">
                <LogOut size={13} />
              </button>
            </div>
          </div>

          {/* Chat / History tabs */}
          <div style={{ display: 'flex', gap: 2, background: '#F8FAFC', borderRadius: 10, padding: 3, marginBottom: 12 }}>
            {[['chat', MessageSquare, 'Chat'], ['history', History, 'History']].map(([id, Icon, label]) => (
              <button key={id} onClick={() => setSideTab(id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: sideTab === id ? 600 : 400, background: sideTab === id ? '#fff' : 'transparent', color: sideTab === id ? '#0F172A' : '#9CA3AF', boxShadow: sideTab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* CHAT TAB */}
        {sideTab === 'chat' && (
          <>
            <div style={{ padding: '10px 12px 0' }}>
              <div style={{ display: 'flex', gap: 2, background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 10, padding: 3 }}>
                {[['agent', Bot, 'Agent'], ['ask', MessageSquare, 'Ask']].map(([id, Icon, label]) => (
                  <button key={id} onClick={() => setChatMode(id)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: chatMode === id ? 600 : 400, background: chatMode === id ? (id === 'agent' ? 'linear-gradient(135deg,#3B82F6,#6366F1)' : '#fff') : 'transparent', color: chatMode === id ? (id === 'agent' ? '#fff' : '#0F172A') : '#6B7280', boxShadow: chatMode === id && id === 'ask' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                    <Icon size={11} />{label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 5, marginBottom: 2 }}>
                {chatMode === 'agent' ? '⚡ Generates charts + insights' : '💬 Text answers only'}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {messages.length === 0 && (
                <div style={{ paddingTop: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 4px', marginBottom: 7 }}>Suggested</div>
                  {SAMPLE_QUESTIONS.map(q => (
                    <button key={q} onClick={() => handleSend(q)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', fontSize: 12, padding: '8px 11px', borderRadius: 10, border: '1px solid #F1F5F9', background: '#FAFAFA', color: '#374151', cursor: 'pointer', marginBottom: 4, transition: 'all 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.color = '#1D4ED8' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#F1F5F9'; e.currentTarget.style.color = '#374151' }}>
                      <Sparkles size={10} color="#93C5FD" style={{ flexShrink: 0 }} />{q}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '88%', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '8px 12px', fontSize: 12, lineHeight: 1.6, background: m.role === 'user' ? 'linear-gradient(135deg,#3B82F6,#6366F1)' : m.isError ? '#FEF2F2' : '#F8FAFC', color: m.role === 'user' ? '#fff' : m.isError ? '#B91C1C' : '#374151', border: m.role !== 'user' ? `1px solid ${m.isError ? '#FECACA' : '#F1F5F9'}` : 'none' }}>
                    {m.content}
                    {m.rowCount !== undefined && m.role === 'assistant' && !m.isError && (
                      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 3 }}>{m.rowCount} rows</div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#CBD5E1', display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '8px 10px 12px', borderTop: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 11, padding: '7px 10px' }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={chatMode === 'agent' ? 'Ask to generate charts...' : 'Ask a question...'}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#374151' }} />
                <button onClick={isRecording ? stopRecording : startRecording}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isRecording ? '#EF4444' : '#CBD5E1', padding: 2 }}>
                  {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
                <button onClick={() => handleSend()} disabled={!input.trim() || isLoading}
                  style={{ background: input.trim() && !isLoading ? 'linear-gradient(135deg,#3B82F6,#6366F1)' : '#E2E8F0', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed', color: input.trim() && !isLoading ? '#fff' : '#9CA3AF' }}>
                  <Send size={11} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* HISTORY TAB */}
        {sideTab === 'history' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {history.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, color: '#9CA3AF' }}>
                <History size={28} color="#E2E8F0" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>No history yet</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>Agent mode queries appear here</div>
              </div>
            ) : history.map(entry => (
              <button key={entry.id} onClick={() => setActiveEntry(entry)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 9, width: '100%', textAlign: 'left', padding: '10px 11px', borderRadius: 11, border: `1px solid ${activeEntry?.id === entry.id ? '#BFDBFE' : '#F1F5F9'}`, background: activeEntry?.id === entry.id ? '#EFF6FF' : '#FAFAFA', cursor: 'pointer', marginBottom: 5, transition: 'all 0.12s' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: activeEntry?.id === entry.id ? '#DBEAFE' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BarChart2 size={12} color={activeEntry?.id === entry.id ? '#3B82F6' : '#9CA3AF'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: activeEntry?.id === entry.id ? '#1D4ED8' : '#374151', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.title || entry.question}
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#9CA3AF' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} />{entry.time}</span>
                    <span>{entry.rowCount} rows</span>
                  </div>
                </div>
                <ChevronRight size={12} color={activeEntry?.id === entry.id ? '#3B82F6' : '#D1D5DB'} style={{ flexShrink: 0, marginTop: 6 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '9px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {Object.entries(THEMES).map(([id, t]) => (
              <button key={id} onClick={() => setTheme(id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 11px', borderRadius: 20, border: `1px solid ${activeTheme === id ? '#E2E8F0' : '#F1F5F9'}`, background: activeTheme === id ? '#fff' : 'transparent', color: activeTheme === id ? '#0F172A' : '#9CA3AF', fontWeight: activeTheme === id ? 600 : 400, cursor: 'pointer', boxShadow: activeTheme === id ? '0 1px 4px rgba(0,0,0,0.07)' : 'none', transition: 'all 0.12s' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.accent }} />
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Insight overlay toggle */}
            <button
              onClick={() => setInsightOverlayEnabled(v => !v)}
              title={insightOverlayEnabled ? 'Disable hover insights' : 'Enable hover insights'}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 11px', borderRadius: 20, border: `1px solid ${insightOverlayEnabled ? '#BFDBFE' : '#F1F5F9'}`, background: insightOverlayEnabled ? '#EFF6FF' : 'transparent', color: insightOverlayEnabled ? '#1D4ED8' : '#9CA3AF', fontWeight: insightOverlayEnabled ? 600 : 400, cursor: 'pointer', transition: 'all 0.12s' }}>
              {insightOverlayEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
              Hover insights
            </button>

            {/* Voice toggle */}
            <button onClick={toggleVoice}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 11px', borderRadius: 20, border: `1px solid ${voiceEnabled ? '#BFDBFE' : '#F1F5F9'}`, background: voiceEnabled ? '#EFF6FF' : 'transparent', color: voiceEnabled ? '#1D4ED8' : '#9CA3AF', cursor: 'pointer', transition: 'all 0.12s' }}>
              {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              Voice
            </button>

            {activeEntry && (
              <>
                <button onClick={() => handleDownload('png')}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                  <Download size={11} /> PNG
                </button>
                <button onClick={() => handleDownload('pdf')}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 12px', borderRadius: 8, border: 'none', background: '#0F172A', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
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

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-4px);opacity:1} }
        @keyframes spin { to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
        input::placeholder { color: #9CA3AF; }
      `}</style>
    </div>
  )
}