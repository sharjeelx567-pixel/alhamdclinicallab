/**
 * ════════════════════════════════════════════════════════════════════════
 *  THEME SETTINGS — colours live in src/styles/theme.css, fonts in ./fonts.ts
 * ════════════════════════════════════════════════════════════════════════
 */
export const themeConfig = {
  /** Theme used on first visit (users can still toggle; their choice is remembered). */
  defaultTheme: 'light' as 'dark' | 'light',
  /** Decorative page background: off — plain grey canvas for a clean, professional look. */
  animatedBackground: false,
  /** Optional hero image for the login page, e.g. '/images/login-lab.jpg' (place a LICENSED image in /public/images). Empty = built-in design. */
  loginImage: '',
} as const;
