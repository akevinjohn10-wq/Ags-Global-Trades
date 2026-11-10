/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark (cinematic) sections
        canvas: '#050B1A',
        deep: '#030712',
        surface: '#0B1530',
        line: '#1A2A4B',
        ink: '#E8EEF8',
        muted: '#93A4C0',
        accent: '#3D8BFF',
        // Light hero
        paper: '#F4F4F2',
        graphite: '#0E1116',
        slate: '#5B6270',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.02em',
        display: '-0.045em',
        eyebrow: '0.14em',
      },
      maxWidth: {
        content: '1200px',
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(var(--sway-from, -2deg))' },
          '50%': { transform: 'rotate(var(--sway-to, 2deg))' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        sway: 'sway 7s ease-in-out infinite',
        marquee: 'marquee 38s linear infinite',
        glow: 'glow 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
