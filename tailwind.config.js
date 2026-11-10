/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Palette taken from bluesqx.com: white, cool mist, near-black ink and the deep electric blue accent.
      colors: {
        paper: '#FFFFFF',
        mist: '#ECF0F8',
        haze: '#E1E7F4',
        line: '#DCE1EB',
        ink: '#1B1E24',
        ink2: '#2E333D',
        muted: '#62677A',
        soft: '#9FA6B4',
        accent: '#0229D5',
        accent2: '#2546E0',
        sky: '#AEBDF3',
        signal: '#F73636',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Tomorrow', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.02em',
        display: '-0.015em',
        eyebrow: '0.14em',
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
