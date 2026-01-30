/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'dark-start-bg': '#1a1a1a',      // Dark button background
                'dark-start-hover': '#2c2c2c',   // Slightly lighter on hover
                'dark-start-text': '#f5f5f5',    // Light text for contrast
                'violet-glow': '#7c3aed',        // For hover animation
            },
            fontFamily: {
                brooding: ['"Creepster"', 'cursive'], // Example dark font
            },
            boxShadow: {
                'deep': '0 4px 0 rgba(0,0,0,0.7)',
            },
        },
    },
    plugins: [],
};
