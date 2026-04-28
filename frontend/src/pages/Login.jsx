import { useState, useEffect } from 'react'
import { Sparkles, BarChart3, Brain, Zap, Moon, Sun } from 'lucide-react'

export function Login({ isDark, toggleTheme, onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    { icon: Brain, title: 'Natural Language Queries', desc: 'Ask questions about your data in plain English—no SQL required' },
    { icon: BarChart3, title: 'Intelligent Visualizations', desc: 'Automatic chart selection that adapts to your data shape' },
    { icon: Zap, title: 'Conversational Memory', desc: 'Ask follow-up questions and get answers from your actual data' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleGoogleAuth = () => {
    setIsLoading(true)
    window.location.href = 'http://localhost:8000/auth/google'
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: isDark 
        ? 'linear-gradient(135deg, #0C0E14 0%, #1A1D2B 50%, #0F1119 100%)'
        : 'linear-gradient(135deg, #F7F8FA 0%, #EEF2FF 50%, #F0F4FF 100%)',
      transition: 'background 0.3s ease-out',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '400px',
        height: '400px',
        background: isDark 
          ? 'radial-gradient(circle, rgba(79,110,247,0.1) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(79,110,247,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        filter: 'blur(40px)',
        animation: 'float 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '350px',
        height: '350px',
        background: isDark
          ? 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        filter: 'blur(40px)',
        animation: 'float 25s ease-in-out infinite reverse',
      }} />

      {/* Left Panel - Feature Showcase */}
      <div style={{
        display: window.innerWidth > 1024 ? 'flex' : 'none',
        width: '50%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        background: isDark
          ? 'linear-gradient(135deg, #13151F 0%, #1A1D2B 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F1F3F7 100%)',
        borderRight: `1px solid ${isDark ? '#252940' : '#E4E7EE'}`,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', animation: 'slideInDown 0.6s ease-out' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F6EF7, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(79,110,247,0.3)',
          }}>
            <BarChart3 size={20} color="#fff" />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #4F6EF7, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            Talking BI
          </h1>
        </div>

        {/* Tagline */}
        <div style={{ flex: 1, marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '42px',
            fontWeight: 700,
            color: isDark ? '#F0F2F8' : '#0D1117',
            marginBottom: '16px',
            lineHeight: '1.2',
            animation: 'slideInUp 0.8s ease-out 0.1s both',
          }}>
            Business Intelligence
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #4F6EF7, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Simplified
            </span>
          </h2>
          <p style={{
            fontSize: '16px',
            color: isDark ? '#9BA3BC' : '#4B5568',
            lineHeight: '1.6',
            animation: 'slideInUp 0.8s ease-out 0.2s both',
          }}>
            Ask questions, get answers. No SQL required.
          </p>
        </div>

        {/* Feature Carousel */}
        <div style={{ marginBottom: '32px', animation: 'slideInUp 0.8s ease-out 0.3s both' }}>
          <p style={{
            fontSize: '12px',
            fontWeight: 700,
            color: isDark ? '#5E6580' : '#8B95A8',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '16px',
          }}>
            Features
          </p>
          {features.map((feature, idx) => {
            const Icon = feature.icon
            const isActive = idx === activeFeature
            return (
              <div
                key={idx}
                onClick={() => setActiveFeature(idx)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  border: `1px solid ${isActive ? '#4F6EF7' : isDark ? '#252940' : '#E4E7EE'}`,
                  background: isActive
                    ? isDark
                      ? 'rgba(79,110,247,0.1)'
                      : 'rgba(79,110,247,0.08)'
                    : isDark
                      ? 'transparent'
                      : 'transparent',
                  transition: 'all 0.3s ease-out',
                  transform: isActive ? 'translateX(4px)' : 'translateX(0)',
                  opacity: isActive ? 1 : 0.7,
                  animation: `slideInUp 0.8s ease-out ${0.4 + idx * 0.1}s both`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: isActive
                      ? 'linear-gradient(135deg, #4F6EF7, #7C3AED)'
                      : isDark
                        ? '#252940'
                        : '#E4E7EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={18} color={isActive ? '#fff' : isDark ? '#9BA3BC' : '#4B5568'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isDark ? '#F0F2F8' : '#0D1117',
                      marginBottom: '4px',
                    }}>
                      {feature.title}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: isDark ? '#9BA3BC' : '#4B5568',
                      lineHeight: '1.5',
                    }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          animation: 'slideInUp 0.8s ease-out 0.2s both',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              display: window.innerWidth <= 1024 ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4F6EF7, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <BarChart3 size={20} color="#fff" />
              </div>
              <h1 style={{
                fontSize: '22px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #4F6EF7, #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Talking BI
              </h1>
            </div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: isDark ? '#F0F2F8' : '#0D1117',
              marginBottom: '8px',
            }}>
              Welcome Back
            </h2>
            <p style={{
              fontSize: '14px',
              color: isDark ? '#9BA3BC' : '#4B5568',
            }}>
              Sign in to explore your data
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: isDark ? '#2D1515' : '#FEF3F2',
              border: `1px solid ${isDark ? '#F87171' : '#FECACA'}`,
              marginBottom: '24px',
              animation: 'shake 0.4s ease-in-out',
            }}>
              <p style={{ fontSize: '13px', color: isDark ? '#FCA5A5' : '#F04438' }}>{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '10px',
              border: 'none',
              background: isLoading
                ? 'rgba(79,110,247,0.5)'
                : 'linear-gradient(135deg, #4F6EF7, #7C3AED)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: isLoading ? 'none' : '0 8px 24px rgba(79,110,247,0.3)',
              transition: 'all 0.3s ease-out',
              marginBottom: '16px',
              animation: 'slideInUp 0.8s ease-out 0.3s both',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(79,110,247,0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,110,247,0.3)'
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Signing in...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            animation: 'slideInUp 0.8s ease-out 0.35s both',
          }}>
            <div style={{ flex: 1, height: '1px', background: isDark ? '#252940' : '#E4E7EE' }} />
            <span style={{ fontSize: '12px', color: isDark ? '#5E6580' : '#8B95A8' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: isDark ? '#252940' : '#E4E7EE' }} />
          </div>

          {/* Demo Button */}
          <button
            onClick={() => onLoginSuccess()}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '10px',
              border: `2px solid ${isDark ? '#252940' : '#E4E7EE'}`,
              background: 'transparent',
              color: isDark ? '#9BA3BC' : '#4B5568',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease-out',
              marginBottom: '24px',
              animation: 'slideInUp 0.8s ease-out 0.4s both',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(79,110,247,0.1)' : 'rgba(79,110,247,0.05)'
              e.currentTarget.style.borderColor = '#4F6EF7'
              e.currentTarget.style.color = '#4F6EF7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = isDark ? '#252940' : '#E4E7EE'
              e.currentTarget.style.color = isDark ? '#9BA3BC' : '#4B5568'
            }}
          >
            Try Demo
          </button>

          {/* Feature List */}
          <div style={{
            paddingTop: '16px',
            borderTop: `1px solid ${isDark ? '#252940' : '#E4E7EE'}`,
            animation: 'slideInUp 0.8s ease-out 0.5s both',
          }}>
            <p style={{
              fontSize: '12px',
              fontWeight: 600,
              color: isDark ? '#9BA3BC' : '#4B5568',
              marginBottom: '12px',
            }}>
              What you get:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Natural language queries',
                'Real-time dashboards',
                'Multi-language support',
                'Advanced analytics',
              ].map((item, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: isDark ? '#9BA3BC' : '#4B5568',
                  marginBottom: '8px',
                }}>
                  <Sparkles size={14} style={{ color: '#4F6EF7', flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Theme Toggle - Mobile */}
        <button
          onClick={toggleTheme}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            display: window.innerWidth <= 1024 ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: `1px solid ${isDark ? '#252940' : '#E4E7EE'}`,
            background: isDark ? '#13151F' : '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.3s ease-out',
            color: isDark ? '#FCD34D' : '#F79009',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? '#1A1D2B' : '#F7F8FA'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? '#13151F' : '#FFFFFF'
          }}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}
