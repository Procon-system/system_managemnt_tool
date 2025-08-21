
// module.exports = {
//   purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
//   darkMode: false, // or 'media' or 'class'
//   theme: {
//     extend: {
//       colors: {
//         primary: '#D97706',   // Dark orange
//         secondary: '#C2410C', // Slightly darker orange
//       },
//       keyframes: {
//         enlarge: {
//           '0%, 100%': { transform: 'scale(1)' },
//           '50%': { transform: 'scale(1.1)' },
//         },
//       },
//       animation: {
//         enlarge: 'enlarge 1.5s infinite',
//       },
//     },
//   },
//   variants: {
//     extend: {},
//   },
//   plugins: [],
// }
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Make sure this path is correct for your project
  ],
  theme: {
    extend: {
      // 1. Define the custom color palette
      colors: {
        // This creates colors like `bg-tasknitter-blue-600`, `text-tasknitter-blue-100`, etc.
        "tasknitter-blue": {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // These are for semantic color names like `text-foreground`
        foreground: "#0f172a", // A dark slate color for main text
        "muted-foreground": "#64748b", // A lighter slate for secondary text
      },
      // 2. Define custom background gradients
      backgroundImage: {
        "gradient-subtle": "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        "gradient-hero": "linear-gradient(to right, #3b82f6, #60a5fa)",
        "gradient-card": "linear-gradient(145deg, #ffffff, #f1f5f9)",
      },
      // 3. Define custom box shadows
      boxShadow: {
        soft: "0 4px 12px 0 rgba(0, 0, 0, 0.05)",
        medium: "0 8px 16px 0 rgba(0, 0, 0, 0.08)",
        large: "0 12px 24px 0 rgba(0, 0, 0, 0.1)",
        // A colored shadow using our custom blue
        blue: "0 10px 25px -5px rgba(37, 99, 235, 0.2), 0 8px 10px -6px rgba(37, 99, 235, 0.2)",
      },
      // 4. Define keyframes and animations for the feature cards
      keyframes: {
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};