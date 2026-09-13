/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F7F3EE',
        forest: {
          deep: '#1B4332',
          DEFAULT: '#2D6A4F',
          sage: '#52B788'
        },
        pulse: {
          critical: '#C1440E',
          'critical-bg': '#FFF5F0',
          atrisk: '#D4A017',
          'atrisk-bg': '#FFFBEB',
          safe: '#2D6A4F',
          'safe-bg': '#F0FFF4',
          slate: '#4A5568'
        }
      },
      boxShadow: {
        'warm': '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        'warm-hover': '0 4px 12px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
