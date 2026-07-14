/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:      '#16407A', // headings, dark backgrounds
          primary:   '#2F6FED', // primary buttons, links
          accent:    '#6C4FD8', // accent, search CTA
          mist:      '#EAF2FA', // light backgrounds
          body:      '#101B2D', // body text
          secondary: '#54627A', // secondary / muted text
          border:    '#E1E9F2', // borders, dividers
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}