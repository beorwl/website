/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Reference CSS variables in Tailwind classes
        'primary-bg': 'var(--bg-primary)',
        'primary-text': 'var(--text-primary)',
        'secondary-text': 'var(--text-secondary)',
        'accent': 'var(--accent)',
        'surface': 'var(--bg-surface)',
      }
    },
  },
  plugins: [],
}

