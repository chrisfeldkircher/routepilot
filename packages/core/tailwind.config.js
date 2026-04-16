/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'gt-',
  content: ['./src/**/*.tsx'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        border: 'var(--tour-border, rgba(128,128,128,0.2))',
        primary: {
          DEFAULT: 'var(--tour-primary, rgb(var(--tour-accent, 99, 102, 241)))',
          foreground: 'var(--tour-primary-foreground, #ffffff)',
        },
        muted: {
          DEFAULT: 'var(--tour-muted, rgba(128,128,128,0.1))',
          foreground: 'var(--tour-muted-foreground, rgba(148,163,184,1))',
        },
        accent: {
          DEFAULT: 'var(--tour-accent, rgba(128,128,128,0.1))',
        },
        card: {
          foreground: 'var(--tour-card-foreground, inherit)',
        },
      },
    },
  },
};
