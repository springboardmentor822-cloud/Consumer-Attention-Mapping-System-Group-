/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cams: {
          bg: '#060A14',
          bgSecondary: '#111827',
          card: '#172033',
          border: '#273449',
          hover: '#1F2937',
          accentSuccess: '#00E676',
          accentPrimary: '#3B82F6',
          accentCyan: '#00BCD4',
          accentPurple: '#A855F7',
          accentOrange: '#FB8C00',
          accentWarning: '#FFC107',
          accentDanger: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
