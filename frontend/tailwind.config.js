/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070d19',
          900: '#0a192f',
          850: '#0d203f',
          800: '#0f172a',
          750: '#162238',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
          400: '#64748b',
          100: '#e2e8f0',
          50: '#f8fafc',
        },
        teal: {
          950: '#042f2e',
          900: '#134e4a',
          800: '#115e59',
          700: '#0f766e',
          600: '#0d9488',
          500: '#14b8a6',
          400: '#2dd4bf',
          300: '#5eead4',
          100: '#ccfbf1',
          50: '#f0fdfa',
        },
        emergency: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-teal': '0 0 20px -5px rgba(20, 184, 166, 0.3)',
        'glow-rose': '0 0 20px -5px rgba(239, 68, 68, 0.3)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}
