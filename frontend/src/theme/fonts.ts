/**
 * ════════════════════════════════════════════════════════════════════════
 *  FONTS — change the imports below to switch the whole app's typography.
 *  Keep the `variable` names unchanged.
 * ════════════════════════════════════════════════════════════════════════
 */
import { Inter } from 'next/font/google';

/** Body text, tables, forms. */
export const bodyFont = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

/** Headings and numbers: the same clean family, heavier weights. */
export const displayFont = Inter({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700', '800'], display: 'swap' });

export const fontVariables = `${bodyFont.variable} ${displayFont.variable}`;
