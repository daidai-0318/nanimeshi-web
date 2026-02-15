/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        accent: '#FF6B35',
        'accent-dark': '#E55A2B',
        'dark-bg': '#1a1a2e',
        'dark-card': '#16213e',
        'dark-surface': '#0f3460',
      },
      fontFamily: {
        sans: ['"Rounded Mplus 1c"', '"Hiragino Maru Gothic ProN"', '"BIZ UDGothic"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
