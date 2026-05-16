import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kp: {
          DEFAULT: '#7132f5',
          dark: '#5741d8',
          deep: '#5b1ecf',
          subtle: 'rgba(133,91,251,0.16)',
          faint: 'rgba(133,91,251,0.08)',
        },
        knear: '#101114',
        kgray: {
          DEFAULT: '#686b82',
          light: '#9497a9',
          border: '#dedee5',
          bg: '#f7f7f9',
        },
        kgreen: {
          DEFAULT: '#149e61',
          dark: '#026b3f',
          bg: 'rgba(20,158,97,0.16)',
        },
      },
      boxShadow: {
        kraken: 'rgba(0,0,0,0.03) 0px 4px 24px',
        'kraken-micro': 'rgba(16,24,40,0.04) 0px 1px 4px',
        'kraken-up': '0 -4px 24px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        display: ['IBM Plex Sans', 'Helvetica', 'Arial', 'sans-serif'],
        ui: ['IBM Plex Sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        tight2: '-1px',
        tight1: '-0.5px',
      },
    },
  },
  plugins: [],
}

export default config
