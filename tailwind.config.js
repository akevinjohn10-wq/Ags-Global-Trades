/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0A1630',
        deep: '#060F22',
        surface: '#0F1F3F',
        line: '#1C2F52',
        ink: '#E6ECF5',
        muted: '#93A4C0',
        accent: '#5AA9FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.02em',
        eyebrow: '0.12em',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};
