/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Add Zaikest font (Pacifico)
        zaikest: ["Pacifico", "cursive"],
      },
      colors: {
        // Optional: brand colors
        zaikestRed: "#E53935",
      },
      animation: {
        // optional fade-in animation for mobile menu
        "fade-in": "fadeIn 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
