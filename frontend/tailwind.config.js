/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shake': 'shake 0.3s ease-in-out',
        'pulse-gentle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
      },
      colors: {
        'dark-primary': '#0C0E14',
        'dark-secondary': '#13151F',
        'dark-surface': '#1A1D2B',
        'light-primary': '#F7F8FA',
        'light-secondary': '#FFFFFF',
      },
      boxShadow: {
        'sm-dark': '0 1px 3px rgba(0,0,0,0.3)',
        'md-dark': '0 4px 12px rgba(0,0,0,0.4)',
        'lg-dark': '0 12px 32px rgba(0,0,0,0.5)',
      },
      spacing: {
        '22': '5.5rem',
        '26': '6.5rem',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
