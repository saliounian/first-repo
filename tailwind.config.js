/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bone:    'rgb(var(--c-bg) / <alpha-value>)',
        sand:    'rgb(var(--c-sand) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        ink:     'rgb(var(--c-ink) / <alpha-value>)',
        muted:   'rgb(var(--c-muted) / <alpha-value>)',
        line:    'rgb(var(--c-line) / <alpha-value>)',
        // green primary (kept name `brick` so existing classes keep working)
        brick: {
          50:  'rgb(var(--c-brick-50) / <alpha-value>)',
          100: 'rgb(var(--c-brick-100) / <alpha-value>)',
          200: '#B7D9C4',
          300: '#7FBC97',
          400: '#3F9461',
          500: 'rgb(var(--c-brick-500) / <alpha-value>)',
          600: 'rgb(var(--c-brick-600) / <alpha-value>)',
          700: '#08391C',
          800: '#062A14',
          900: '#03190B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 0 rgba(0,0,0,0.02), 0 1px 3px rgba(0,0,0,0.04)',
        pop: '0 12px 40px rgba(0,0,0,0.18)'
      },
      borderRadius: {
        xl: '14px'
      }
    }
  },
  plugins: []
};
