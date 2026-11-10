/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Monochrome palette: white, cool greys, graphite and near-black.
      colors: {
        paper: '#FFFFFF',
        space: '#07080A',
        navy: '#0A1640',
        mist: '#F1F2F4',
        haze: '#E6E8EC',
        line: '#E1E3E8',
        ink: '#111317',
        ink2: '#2A2E36',
        muted: '#5F6470',
        soft: '#9FA6B4',
        accent: '#111317',
        accent2: '#8A909B',
        sky: '#C7CCD6',
        signal: '#F73636',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.02em',
        display: '-0.035em',
        eyebrow: '0.14em',
      },
      borderRadius: {
        md: '4px',
        lg: '6px',
      },
      maxWidth: {
        content: '1440px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
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
        scrollcue: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
        progress: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        panelin: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        imgin: {
          '0%': { opacity: '0', transform: 'scale(1.06)', clipPath: 'inset(0 0 100% 0)' },
          '100%': { opacity: '1', transform: 'scale(1)', clipPath: 'inset(0 0 0 0)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        'marquee-fast': 'marquee 24s linear infinite',
        'marquee-rev': 'marquee-rev 48s linear infinite',
        scrollcue: 'scrollcue 2.2s ease-in-out infinite',
        blink: 'blink 1.6s ease-in-out infinite',
        panelin: 'panelin 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        imgin: 'imgin 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
