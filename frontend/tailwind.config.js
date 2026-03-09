/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b9fd',
          400: '#8093fb',
          500: '#6168f6',
          600: '#4f46e5',
          700: '#4138ca',
          800: '#352ea3',
          900: '#2f2b81',
          950: '#1e1b4b',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.slate[700]'),
            '--tw-prose-headings': theme('colors.slate[900]'),
            '--tw-prose-code': theme('colors.brand[700]'),
            '--tw-prose-pre-bg': theme('colors.slate[900]'),
            maxWidth: 'none',
            h1: { fontWeight: '800', letterSpacing: '-0.025em' },
            h2: { fontWeight: '700', letterSpacing: '-0.02em', marginTop: '2em' },
            h3: { fontWeight: '600' },
            'code::before': { content: '""' },
            'code::after':  { content: '""' },
            code: {
              backgroundColor: theme('colors.slate[100]'),
              borderRadius: theme('borderRadius.sm'),
              padding: '0.2em 0.4em',
              fontWeight: '500',
            },
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.slate[300]'),
            '--tw-prose-headings': theme('colors.white'),
            '--tw-prose-code': theme('colors.brand[300]'),
            code: {
              backgroundColor: theme('colors.slate[800]'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
