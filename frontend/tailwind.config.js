
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: '#D97706',   // Dark orange
        secondary: '#C2410C', // Slightly darker orange
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
