/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'purple': {
          500: '#6C63FF',
          600: '#5B52E8',
        },
        'pink': {
          500: '#FF6584',
          600: '#E55A75',
        }
      }
    },
  },
  plugins: [],
}