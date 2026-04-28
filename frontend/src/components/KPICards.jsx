import React from 'react'

// Helper function to extract raw value from various number formats
const extractNumericValue = (val) => {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const num = parseFloat(val.toString().replace(/,/g, ''))
    return isNaN(num) ? 0 : num
  }
  return 0
}

// Helper function to format display value
const formatValue = (num) => {
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  } else if (num < 100 && num > 0.01 && num !== Math.floor(num)) {
    return num.toFixed(2)
  } else if (num < 1) {
    return num.toFixed(3)
  } else {
    return Math.round(num).toString()
  }
}

// Helper function to format category name
const formatLabel = (text) => {
  return String(text)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Individual KPI Card Component
function KPICard({ kpi, metricName, isDark, isTopPerformer, isLowestPerformer }) {
  const formattedValue = formatValue(kpi.value)
  const categoryLabel = formatLabel(kpi.category)
  const backgroundColor = isDark ? '#1f2937' : '#ffffff'
  const textColor = isDark ? '#f3f4f6' : '#111827'
  const borderColor = isDark ? '#374151' : '#e5e7eb'
  const mutedColor = isDark ? '#9ca3af' : '#6b7280'
  const badgeBgTop = isDark ? '#064e3b' : '#dcfce7'
  const badgeColorTop = isDark ? '#86efac' : '#166534'
  const badgeBgLow = isDark ? '#78350f' : '#fef3c7'
  const badgeColorLow = isDark ? '#fcd34d' : '#92400e'

  return (
    <div
      style={{
        backgroundColor: backgroundColor,
        borderRadius: '16px',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)'
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top gradient bar */}
      <div style={{
        height: '4px',
        background: 'linear-gradient(90deg, #3b82f6, #a855f7, #ec4899)',
        width: '100%'
      }}></div>

      {/* Card body */}
      <div style={{
        padding: '24px'
      }}>
        {/* Badges */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          minHeight: '28px'
        }}>
          {isTopPerformer && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              paddingLeft: '12px',
              paddingRight: '12px',
              paddingTop: '6px',
              paddingBottom: '6px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: badgeBgTop,
              color: badgeColorTop
            }}>
              ⭐ Top Category
            </span>
          )}
          {isLowestPerformer && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              paddingLeft: '12px',
              paddingRight: '12px',
              paddingTop: '6px',
              paddingBottom: '6px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: badgeBgLow,
              color: badgeColorLow
            }}>
              📊 Lowest Performer
            </span>
          )}
        </div>

        {/* Category label */}
        <div style={{
          marginBottom: '12px'
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: mutedColor,
            margin: '0'
          }}>
            {categoryLabel}
          </p>
        </div>

        {/* Main value */}
        <div style={{
          marginBottom: '8px'
        }}>
          <p style={{
            fontSize: '36px',
            fontWeight: '700',
            color: textColor,
            margin: '0',
            fontFamily: 'monospace',
            lineHeight: '1'
          }}>
            {formattedValue}
          </p>
        </div>

        {/* Metric name */}
        <div style={{
          marginBottom: '16px'
        }}>
          <p style={{
            fontSize: '13px',
            color: mutedColor,
            margin: '0'
          }}>
            {metricName}
          </p>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: borderColor,
          margin: '16px 0'
        }}></div>

        {/* Contribution section */}
        <div style={{
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <p style={{
              fontSize: '12px',
              fontWeight: '500',
              color: mutedColor,
              margin: '0'
            }}>
              Contribution
            </p>
            <p style={{
              fontSize: '18px',
              fontWeight: '700',
              color: textColor,
              margin: '0'
            }}>
              {kpi.percentage}%
            </p>
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: isDark ? '#374151' : '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
                width: `${Math.min(parseFloat(kpi.percentage), 100)}%`,
                transition: 'width 0.6s ease-out',
                borderRadius: '3px'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function KPICards({ data, isDark, isLoading }) {
  const generateKPIs = () => {
    if (!data) return null

    let chartData = null
    let metricName = 'Metric'

    // Strategy 1: Try nested specs structure (for CSV/themed charts)
    if (data.specs && typeof data.specs === 'object') {
      for (const [themeName, chartArray] of Object.entries(data.specs)) {
        if (Array.isArray(chartArray)) {
          for (const chart of chartArray) {
            if (chart && Array.isArray(chart.data) && chart.data.length > 0) {
              chartData = chart.data
              metricName = chart.title || 'Metric'
              break
            }
          }
        } else if (
          chartArray &&
          typeof chartArray === 'object' &&
          Array.isArray(chartArray.data) &&
          chartArray.data.length > 0
        ) {
          chartData = chartArray.data
          metricName = chartArray.title || 'Metric'
          break
        }
        if (chartData) break
      }
    }

    // Strategy 2: Try direct data array
    if (!chartData && Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === 'object') {
        chartData = data
        metricName = 'Value'
      }
    }

    // Strategy 3: Look for 'data' property directly
    if (!chartData && data.data && Array.isArray(data.data) && data.data.length > 0) {
      chartData = data.data
      metricName = data.title || 'Metric'
    }

    // Strategy 4: Look for 'rows' property
    if (!chartData && data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
      chartData = data.rows
      metricName = data.title || 'Metric'
    }

    // Strategy 5: Look for 'records' property
    if (!chartData && data.records && Array.isArray(data.records) && data.records.length > 0) {
      chartData = data.records
      metricName = data.title || 'Metric'
    }

    // Strategy 6: Look for 'results' property
    if (!chartData && data.results && Array.isArray(data.results) && data.results.length > 0) {
      chartData = data.results
      metricName = data.title || 'Metric'
    }

    // Strategy 7: Search through all properties for first array of objects
    if (!chartData) {
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          chartData = value
          metricName = data.title || key || 'Metric'
          break
        }
      }
    }

    if (!chartData || chartData.length === 0) return null

    // Extract category names and numeric values
    const items = []
    let totalValue = 0

    for (const row of chartData) {
      if (!row || typeof row !== 'object') continue

      const entries = Object.entries(row).filter(
        ([key, val]) => val !== null && val !== undefined && val !== ''
      )

      if (entries.length < 2) continue

      let categoryName = null
      let numericValue = null
      let otherValues = []

      // Separate values by type
      for (const [key, val] of entries) {
        if (typeof val === 'string' && val.trim().length > 0 && !categoryName) {
          categoryName = val
        } else if (
          (typeof val === 'number' && val !== 0) ||
          (typeof val === 'string' && !isNaN(parseFloat(val)) && parseFloat(val) !== 0)
        ) {
          const numVal = extractNumericValue(val)
          if (numericValue === null || numVal > numericValue) {
            if (numericValue !== null) otherValues.push(numericValue)
            numericValue = numVal
          } else {
            otherValues.push(numVal)
          }
        }
      }

      // If we didn't find a string, try using the first value as category
      if (!categoryName && entries.length > 0) {
        const firstVal = entries[0][1]
        if (typeof firstVal === 'string') {
          categoryName = firstVal
        } else if (entries.length > 1) {
          // Use second value if first is numeric
          const secondVal = entries[1][1]
          if (typeof secondVal === 'string') {
            categoryName = secondVal
          } else {
            categoryName = `Item ${items.length + 1}`
          }
        }
      }

      // If still no category, generate one
      if (!categoryName) {
        categoryName = `Item ${items.length + 1}`
      }

      // If no numeric value found, use first numeric value from entries
      if (numericValue === null) {
        for (const [key, val] of entries) {
          const numVal = extractNumericValue(val)
          if (numVal > 0) {
            numericValue = numVal
            break
          }
        }
      }

      if (categoryName && numericValue && numericValue > 0) {
        items.push({ category: categoryName, value: numericValue })
        totalValue += numericValue
      }
    }

    if (items.length === 0) return null

    // Calculate percentages and sort by value
    const kpis = items
      .map((item, idx) => ({
        ...item,
        percentage: totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0,
        rank: idx
      }))
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({
        ...item,
        rank: idx
      }))

    console.log('[KPICards] ✓ Generated', kpis.length, 'KPIs from', items.length, 'items')
    return { kpis, metricName }
  }

  const result = generateKPIs()

  if (!result) {
    return (
      <div style={{
        padding: '32px 24px',
        textAlign: 'center',
        color: '#999',
        fontSize: '14px'
      }}>
        Run a query to see key metrics
      </div>
    )
  }

  const { kpis, metricName } = result

  return (
    <div style={{
      width: '100%',
      marginBottom: '32px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        gridAutoRows: 'auto'
      }}>
        {kpis.map((kpi, idx) => {
          const isTopPerformer = kpi.rank === 0
          const isLowestPerformer = kpi.rank === kpis.length - 1

          return (
            <KPICard
              key={`kpi-${idx}`}
              kpi={kpi}
              metricName={metricName}
              isDark={isDark}
              isTopPerformer={isTopPerformer}
              isLowestPerformer={isLowestPerformer}
            />
          )
        })}
      </div>
    </div>
  )
}
