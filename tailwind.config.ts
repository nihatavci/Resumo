import type { Config } from "tailwindcss";

const config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1200px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'sans-serif'],
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			dia: {
  				canvas: '#F8F8F8',
  				body: '#636363',
  				tertiary: '#959595',
  				button: '#D9D9D9',
  				divider: '#E5E5E5',
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			dia: '30px',
  			'dia-sm': '16px',
  			'dia-btn': '12px',
  		},
  		boxShadow: {
  			dia: '0px 0px 8px 0px rgba(0,0,0,0.08)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'loading-dot': {
  				'0%': { opacity: '0.2', transform: 'translateX(-2px) scale(0.8)' },
  				'50%': { opacity: '0.8', transform: 'translateX(2px) scale(1)' },
  				'100%': { opacity: '0.2', transform: 'translateX(-2px) scale(0.8)' }
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  		},
  		typography: {
  			xxxs: {
  				css: {
  					fontSize: '0.625rem',
  					h1: { fontSize: '1rem' },
  					h2: { fontSize: '0.875rem' },
  					h3: { fontSize: '0.75rem' },
  					h4: { fontSize: '0.625rem' }
  				}
  			},
  			xxs: {
  				css: {
  					fontSize: '0.75rem',
  					h1: { fontSize: '1.25rem' },
  					h2: { fontSize: '1.15rem' },
  					h3: { fontSize: '1rem' },
  					h4: { fontSize: '0.875rem' }
  				}
  			}
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/typography")
  ],
} satisfies Config;

export default config;
