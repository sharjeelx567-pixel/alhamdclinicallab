/**
 * ════════════════════════════════════════════════════════════════════════
 *  FONTS — change the two imports below to switch the whole app's typography.
 *  Any Google font from `next/font/google` works. Keep the `variable` names unchanged.
 * ════════════════════════════════════════════════════════════════════════
 */
import { Fraunces, Manrope } from 'next/font/google';

/** Body text, tables, forms: clear, slightly rounded sans. */
export const bodyFont = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

/** Headings, numbers on stat cards, brand wordmark: an elegant serif. */
export const displayFont = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'], display: 'swap' });

export const fontVariables = `${bodyFont.variable} ${displayFont.variable}`;
