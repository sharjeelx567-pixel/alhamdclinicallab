/**
 * ════════════════════════════════════════════════════════════════════════
 *  FONTS — change the import below to switch the whole app's typography.
 *  Keep the `variable` name unchanged.
 * ════════════════════════════════════════════════════════════════════════
 */
import { Inter } from 'next/font/google';

/**
 * One family for everything (Inter is a variable font: every weight from 100–900).
 * Load it ONCE: calling Inter() twice breaks the Google-font loader on Vercel builds.
 * Headings use `font-display`, which falls back to this same font (see tailwind.config.ts).
 */
export const bodyFont = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const fontVariables = bodyFont.variable;
