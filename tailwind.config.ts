import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './404.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Instrument Serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(31, 38, 135, 0.10)',
      },
    },
  },
  plugins: [],
} satisfies Config;
