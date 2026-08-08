/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: { ink: '#080d1a', panel: '#111a2e', brand: '#7c5cff' },
      fontFamily: { display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: { glow: '0 0 45px rgba(124,92,255,.25)' },
    },
  },
  plugins: [],
}
