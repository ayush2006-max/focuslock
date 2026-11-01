/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        accent: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        mint: {
          400: '#34d399',
          500: '#10b981',
        },
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          850: '#191921',
          900: '#12121a',
          950: '#0b0b12',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.15', transform: 'scale(1.04)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-up-slow': 'fade-up 0.8s ease-out both',
        'pulse-ring': 'pulse-ring 2.6s ease-in-out infinite',
        pop: 'pop 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
