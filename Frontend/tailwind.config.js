/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          green: '#1B8F3E',
          btn: '#1B8F3E',
          blue: '#1C3F94',
          navy: '#0D1B2A',
          dark: '#05324f',
          gray: '#F3F4F6',
          success: '#22C55E',
          info: '#3B82F6',
          warning: '#F59E0B',
          error: '#EF4444',
          muted: '#6B7280',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: '12px',
        btn: '10px',
      },
      spacing: {
        section: '80px',
        'card-pad': '24px',
        gap: '16px',
        xs: '8px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.10)',
      },
      /* Fixa2an typography system (Poppins) */
      fontSize: {
        // Liten text
        xs: ['12px', { lineHeight: '1.4', letterSpacing: '0px' }],
        // Brödtext
        sm: ['14px', { lineHeight: '1.5', letterSpacing: '0px' }],
        // Brödtext stor
        base: ['16px', { lineHeight: '1.6', letterSpacing: '0px' }],
        // H4
        lg: ['18px', { lineHeight: '1.35', letterSpacing: '0px' }],
        // H3
        xl: ['20px', { lineHeight: '1.3', letterSpacing: '0px' }],
        // H2
        '2xl': ['24px', { lineHeight: '1.25', letterSpacing: '-0.2px' }],
        // H1
        '3xl': ['32px', { lineHeight: '1.2', letterSpacing: '-0.5px' }],
        '4xl': ['36px', { lineHeight: '1.15', letterSpacing: '-0.5px' }],
        h1: ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.5px' }],
        h2: ['24px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.2px' }],
        h3: ['20px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0px' }],
        h4: ['18px', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '0px' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400', letterSpacing: '0px' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400', letterSpacing: '0px' }],
        small: ['12px', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0px' }],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
