/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6', // A nice shade of blue for primary accents
          hover: '#2563eb', // Darker blue for hover states
        },
        gray: {
          '50': '#f9fafb',
          '100': '#f3f4f6',
          '200': '#e5e7eb',
          '300': '#d1d5db',
          '400': '#9ca3af',
          '500': '#6b7280',
          '600': '#4b5563',
          '700': '#374151',
          '800': '#1f2937',
          '900': '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Using Inter for a clean, modern look
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
