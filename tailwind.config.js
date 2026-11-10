const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'page-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up-sm': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'page-in': 'page-in 400ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up-sm': 'fade-up-sm 250ms ease-out both',
        'fade-up': 'fade-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      fontFamily: {
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
