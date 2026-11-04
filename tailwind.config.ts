import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F5EFE1',
          light: '#FDFBF7',
          dark: '#EBE0DB',
        },
        crimson: {
          DEFAULT: '#871F1B',
          dark: '#670407',
          light: '#FFB4AB',
        },
        terracotta: {
          DEFAULT: '#B85D19',
          light: '#FFDBC8',
          dark: '#753400',
        },
        mustard: {
          DEFAULT: '#F2B705',
          light: '#FFDF9D',
          dark: '#5B4300',
        },
        teal: {
          DEFAULT: '#4A7C6F',
          light: '#CFE6DF',
          dark: '#26473E',
        },
        espresso: {
          DEFAULT: '#1E1916',
          muted: '#57413F',
          outline: '#8B716E',
        },
      },
      fontFamily: {
        anton: ['var(--font-anton)', 'Impact', 'sans-serif'],
        fraunces: ['var(--font-fraunces)', 'Georgia', 'serif'],
        jakarta: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        retro: '3px 3px 0px #1E1916',
        'retro-sm': '2px 2px 0px #1E1916',
        'retro-lg': '4px 4px 0px #1E1916',
        'retro-xl': '6px 6px 0px #1E1916',
        'retro-hover': '5px 5px 0px #1E1916',
      },
      borderWidth: {
        retro: '1.5px',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        marquee: 'marquee 26s linear infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
