/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: '#0B0B0F',
                    secondary: '#12121A',
                    tertiary: '#1A1A26',
                    card: '#161622',
                    hover: '#1E1E2E',
                },
                accent: {
                    violet: '#8B5CF6',
                    'violet-light': '#A78BFA',
                    blue: '#3B82F6',
                    'blue-light': '#60A5FA',
                    teal: '#14B8A6',
                    'teal-light': '#2DD4BF',
                    green: '#22C55E',
                },
                text: {
                    primary: '#E2E8F0',
                    secondary: '#94A3B8',
                    muted: '#64748B',
                },
                border: {
                    DEFAULT: '#1E293B',
                    light: '#334155',
                },
                status: {
                    success: '#22C55E',
                    warning: '#F59E0B',
                    danger: '#EF4444',
                    info: '#3B82F6',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            borderRadius: {
                xl: '1rem',
                '2xl': '1.25rem',
            },
            boxShadow: {
                glow: '0 0 20px rgba(139, 92, 246, 0.15)',
                'glow-blue': '0 0 20px rgba(59, 130, 246, 0.15)',
                'glow-teal': '0 0 20px rgba(20, 184, 166, 0.15)',
                card: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
            },
        },
    },
    plugins: [],
};
