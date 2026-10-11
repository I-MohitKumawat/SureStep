/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0E7A67',
          light: '#b1f3da',
          dark: '#0A5D50',
          text: '#FFFFFF',
        },
        patient: {
          primary: '#4A90E2',
          soft: '#EDE9FE',
          accent: '#F59E0B',
          text: '#111827',
          bg: '#FDFAF6',
        },
        caregiver: {
          primary: '#0E7A67',
          alert: '#DC2626',
          warning: '#F59E0B',
          safe: '#065F46',
        },
        family: {
          primary: '#7C3AED',
          soft: '#EDE9FE',
          text: '#111827',
        },
      },
    },
  },
  plugins: [],
};

