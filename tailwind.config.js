// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#fff3e6', // your main primary color (e.g. orange-500)
        },
        secondary: {
          DEFAULT: '#ff6900'
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
      },
    },
  },
  plugins: [],
};
