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
          tint: '#E6F4F1',
          text: '#FFFFFF',
        },
        surestep: {
          lightBg: '#FAF8F5',
          lightSurface: '#FFFFFF',
          lightBorder: '#E5E0D8',
          lightText: '#161E1C',
          lightSecondary: '#52605D',
          darkBg: '#121816',
          darkSurface: '#1C2422',
          darkBorder: '#2C3835',
          darkText: '#F5F7F6',
          darkSecondary: '#9EABA7',
          teal: '#0E7A67',
          sosBg: '#FEE2E2',
          sosText: '#DC2626',
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

