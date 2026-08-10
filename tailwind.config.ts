import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './i18n/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FFF9E5',
          100: '#FFF2C2',
          200: '#FFE58B',
          300: '#FFD74B',
          400: '#FFD700',
          500: '#D4A017',
          600: '#B8860B',
          700: '#8B6508',
          800: '#5A4306',
          900: '#2E2203'
        },
        goldBlack: '#231F20',
        graphite: '#58595B',
        piege: '#E2E1D4',
        kashmer: '#CCC7C2',
        blueGray: '#C8D6D9'
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          '"Avenir Next"',
          '"Century Gothic"',
          '"Segoe UI"',
          'system-ui',
          'sans-serif'
        ],
        serif: [
          'var(--font-serif)',
          'Baskerville',
          '"Baskerville Old Face"',
          'Georgia',
          'serif'
        ],
        arabic: ['var(--font-arabic)', 'Tajawal', 'Tahoma', 'Arial', 'sans-serif']
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(255, 215, 0, 0.22), 0 14px 40px rgba(0, 0, 0, 0.28)'
      },
      backgroundImage: {
        'spotlight-black':
          'radial-gradient(circle at 12% 18%, rgba(255, 215, 0, 0.2), transparent 24%), radial-gradient(circle at 84% 18%, rgba(255, 255, 255, 0.05), transparent 18%), linear-gradient(180deg, #2a2627 0%, #231f20 46%, #181516 100%)',
        'middle-black':
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0)), linear-gradient(135deg, #2b2627, #231f20 46%, #1b1819)',
        noise:
          'linear-gradient(rgba(255,255,255,0.015), rgba(255,255,255,0.015))'
      },
      letterSpacing: {
        hero: '0.28em',
        title: '0.36em'
      }
    }
  },
  plugins: []
} satisfies Config;
