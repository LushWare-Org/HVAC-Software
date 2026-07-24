/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary text / heading colour — a deep navy-black, not flat #000.
        ink: {
          DEFAULT: '#030E22',
          soft: '#0F2B5B',
        },
        // Premium navy — the single brand accent used across the site.
        navy: {
          50: '#E8EDF5',
          100: '#C5D0E6',
          200: '#9EB2D4',
          300: '#7794C2',
          400: '#597DB5',
          500: '#3B66A8',
          600: '#2E5299',
          700: '#1E3D7A',
          800: '#0F2B5B',
          900: '#071A3D',
          950: '#030E22',
        },
      },
      fontFamily: {
        sans: ['Geist Sans', 'sans-serif'],
        display: ['Geist Sans', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      boxShadow: {
        // Soft, blurred navy-tinted shadows — premium elevation, no hard offset.
        block: '0 24px 48px -20px rgba(3,14,34,0.35)',
        'block-sm': '0 12px 28px -12px rgba(3,14,34,0.25)',
        'block-lg': '0 40px 80px -24px rgba(3,14,34,0.4)',
        glow: '0 0 0 1px rgba(59,102,168,0.15), 0 20px 40px -16px rgba(3,14,34,0.3)',
      },
      maxWidth: {
        content: '1300px',
      },
      keyframes: {
        'sweep': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'expand-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        ticker: 'ticker 30s linear infinite',
        'expand-in': 'expand-in 0.35s ease-out',
      },
    },
  },
  plugins: [],
}
