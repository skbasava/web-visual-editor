/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soc-bg': '#1a1a2e',
        'soc-panel': '#16213e',
        'soc-accent': '#0f3460',
        'soc-primary': '#e94560',
        'soc-secondary': '#00adb5',
      },
    },
  },
  plugins: [],
}
