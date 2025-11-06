/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FFD700",
          black: "#0D0D0D",
        },
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '1.75rem',
      },
    },
  },
  plugins: [],
}
