/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#22543D', // Deep Forest Green
                    light: '#48BB78',   // Vibrant Leaf Green
                    dark: '#1C4532',    // Darker Green
                },
                secondary: {
                    DEFAULT: '#ECC94B', // Vibrant Gold
                    light: '#F6E05E',   // Soft Gold
                    dark: '#D69E2E',    // Deep Gold
                },
                accent: {
                    DEFAULT: '#F6AD55', // Warm Orange
                    light: '#FBD38D',
                    dark: '#DD6B20',
                },
                background: '#F8FAFC', // Very light cool gray
                surface: '#FFFFFF',    // White
                text: {
                    DEFAULT: '#1A202C', // Slate 900
                    muted: '#718096',   // Slate 500
                }
            },
            fontFamily: {
                sans: ['Inter', 'Outfit', 'sans-serif'],
            },
            boxShadow: {
                'premium': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                'vibrant': '0 20px 25px -5px rgba(72, 187, 120, 0.1), 0 10px 10px -5px rgba(72, 187, 120, 0.04)',
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            }
        },
    },
    plugins: [],
}
