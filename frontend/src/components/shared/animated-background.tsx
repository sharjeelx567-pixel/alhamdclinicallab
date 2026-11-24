import { themeConfig } from '@/theme/config';
import { cn } from '@/lib/utils';

/**
 * Decorative page backdrop: a faint lattice of eight-point stars (the motif of the
 * Al Hamd logo) with a soft emerald wash at the top. Static — no animation, no blur —
 * so it costs almost nothing to draw, even on low-end PCs. Hidden from assistive tech.
 */
export function AnimatedBackground({ variant = 'app', className }: { variant?: 'app' | 'auth'; className?: string }) {
  if (!themeConfig.animatedBackground) return null;
  return (
    <div aria-hidden className={cn('no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}>
      <div className="ahl-pattern-layer absolute inset-0" />
      <div className={cn('absolute inset-x-0 top-0 bg-gradient-to-b from-primary/[0.07] to-transparent', variant === 'auth' ? 'h-full' : 'h-72')} />
    </div>
  );
}
