/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#edf6ff',
          100: '#dcecff',
          300: '#87baf8',
          400: '#5c9cf0',
          500: '#2f7ee5',
          600: '#1f61c7',
          700: '#1b4c9b',
        },
        accent: {
          500: '#f88a2b',
          600: '#dd6f11',
        },
        sand: {
          100: '#fff7ed',
        },
      },
    },
  },
  plugins: [],
}
