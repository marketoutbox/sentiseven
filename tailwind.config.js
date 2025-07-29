module.exports = {
  darkMode: ["class"],
  content: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
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
          hover: "hsl(var(--accent-hover))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          elevated: "hsl(var(--card-elevated))",
        },
        // Premium fintech colors
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        // Chart colors
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        // Premium gradient colors
        gradient: {
          primary: "var(--gradient-primary)",
          card: "var(--gradient-card)",
          surface: "var(--gradient-surface)",
        },
        // Glass morphism
        glass: {
          background: "var(--glass-background)",
          border: "var(--glass-border)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        neuropol: ['var(--font-neuropol)', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium-sm': 'var(--shadow-sm)',
        'premium-md': 'var(--shadow-md)',
        'premium-lg': 'var(--shadow-lg)',
        'premium-xl': 'var(--shadow-xl)',
        'glow-purple': 'var(--glow-purple)',
        'glow-blue': 'var(--glow-blue)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          'from': { boxShadow: 'var(--glow-purple)' },
          'to': { boxShadow: 'var(--glow-blue)' },
        },
        shimmer: {
          'from': { backgroundPosition: '0 0' },
          'to': { backgroundPosition: '-200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-premium': 'var(--gradient-primary)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-surface': 'var(--gradient-surface)',
        'shimmer': 'linear-gradient(110deg, transparent 33%, rgba(255,255,255,0.1) 50%, transparent 66%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Custom plugin for premium utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.glass-morphism': {
          background: 'var(--glass-background)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
        },
        '.text-gradient': {
          background: 'var(--gradient-primary)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          backgroundClip: 'text',
        },
        '.border-gradient': {
          position: 'relative',
          background: 'hsl(var(--card))',
          borderRadius: 'calc(var(--radius) + 1px)',
        },
        '.border-gradient::before': {
          content: '""',
          position: 'absolute',
          inset: '0',
          padding: '1px',
          background: 'var(--gradient-primary)',
          borderRadius: 'inherit',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          '-webkit-mask-composite': 'xor',
        },
        '.btn-premium': {
          background: 'var(--gradient-primary)',
          color: 'hsl(var(--primary-foreground))',
          border: 'none',
          boxShadow: 'var(--glow-purple)',
          transition: 'all 0.3s ease',
        },
        '.btn-premium:hover': {
          transform: 'translateY(-1px)',
          boxShadow: 'var(--shadow-xl), var(--glow-purple)',
        },
        '.card-premium': {
          background: 'var(--gradient-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid hsl(var(--border))',
          boxShadow: 'var(--shadow-lg)',
        },
        '.nav-premium': {
          background: 'var(--glass-background)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
        },
        '.status-indicator': {
          borderRadius: '50%',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        '.status-online': {
          background: 'hsl(var(--success))',
          boxShadow: '0 0 10px hsl(var(--success) / 0.5)',
        },
        '.shimmer-effect': {
          backgroundImage: 'var(--shimmer)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s linear infinite',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
