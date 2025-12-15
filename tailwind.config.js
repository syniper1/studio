/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Safelist dynamic classes for theme accents
  safelist: [
    'text-orange-500', 'border-orange-500', 'bg-orange-500',
    'text-yellow-400', 'border-yellow-400', 'bg-yellow-400',
    'text-amber-400', 'border-amber-400', 'bg-amber-400',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
