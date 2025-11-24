/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#2563eb',
        primary: {
          DEFAULT: '#2563eb',
          50: '#EEF4FF',
          100: '#E0EAFF',
          200: '#C7D8FE',
          300: '#A4BCFD',
          400: '#8198FA',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3a8a',
        },
        stroke: '#E2E8F0',
        strokedark: '#2E3A59',
        hover: '#F8FAFC',
        bodydark: '#8E9AAF',
        bodydark1: '#ADB5BD',
        bodydark2: '#AEB7C0',
        boxdark: '#24303F',
        'boxdark-2': '#1A222C',
        'gray-2': '#F7F9FC',
        'gray-3': '#FAFAFA',
        'gray-4': '#F3F4F6',
        'gray-6': '#E5E7EB',
        'gray-7': '#F9FAFB',
        'gray-9': '#1F2937',
        body: '#64748B',
        bodydark: '#AEB7C0',
        bg: '#F8FAFC',
        bgdark: '#1A222C',
        meta: {
          1: '#ACACAC',
          2: '#EFF2F7',
          3: '#F5F7FD',
          4: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Anuphan', 'sans-serif'],
        satoshi: ['Satoshi', 'sans-serif'],
      },
      fontSize: {
        'title-md': '1.5rem',
        'title-sm': '1.125rem',
      },
      spacing: {
        '72.5': '18.125rem',
        '125': '31.25rem',
      },
      boxShadow: {
        '1': '0px 1px 3px 0px rgba(0, 0, 0, 0.12), 0px 1px 2px 0px rgba(0, 0, 0, 0.24)',
        '2': '0px 2px 6px -1px rgba(0, 0, 0, 0.16), 0px 1px 4px 0px rgba(0, 0, 0, 0.04)',
        '3': '0px 4px 8px -2px rgba(0, 0, 0, 0.16), 0px 2px 4px -1px rgba(0, 0, 0, 0.08)',
        '4': '0px 8px 16px -4px rgba(0, 0, 0, 0.24), 0px 2px 4px -1px rgba(0, 0, 0, 0.08)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}

