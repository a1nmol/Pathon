/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    // No defaults carried over — define everything explicitly under extend
    extend: {
      colors: {},
      fontFamily: {},
      fontSize: {},
      spacing: {},
      borderRadius: {},
      boxShadow: {},
      animation: {},
      keyframes: {},
    },
  },
  plugins: [],
};
