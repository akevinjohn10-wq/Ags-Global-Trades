/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#02040B',
        deep: '#010208',
        surface: '#060C1E',
        line: '#10203F',
        ink: '#E8EEF8',
        muted: '#8DA0C0',
        accent: '#2F7BFF',
        ice: '#9CC9FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Unbounded', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.02em',
        display: '-0.03em',
        eyebrow: '0.16em',
      },
      maxWidth: {
        content: '1280px',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-rev': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%, -6%, 0) scale(1.15)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scrollcue: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        fadein: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        marquee: 'marquee 45s linear infinite',
        'marquee-rev': 'marquee-rev 55s linear infinite',
        glow: 'glow 5s ease-in-out infinite',
        drift: 'drift 16s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        scrollcue: 'scrollcue 2.2s ease-in-out infinite',
        fadein: 'fadein 1.6s ease-out both',
      },
    },
  },
  plugins: [],
};
