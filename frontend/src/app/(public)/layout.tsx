import { ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme';
import { RoundLogo } from '@/components/shared/round-logo';
import { BRAND } from '@/constants';

/**
 * Sign-in and password pages: a deep emerald field with the gold star lattice, the
 * logo and name centred above a white "paper" card.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-sidebar text-sidebar-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="ahl-pattern-layer absolute inset-0 !opacity-[0.16] invert" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--brand-2)/0.55),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-highlight to-transparent" />
      </div>

      <div className="absolute right-4 top-4 z-10 [&>button]:text-sidebar-foreground [&>button:hover]:bg-white/10">
        <ThemeToggle />
      </div>

      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 py-10">
        <RoundLogo className="size-28 shadow-elevated ring-4 ring-highlight/70" alt={BRAND.name} />
        <p className="mt-4 text-center font-display text-3xl font-bold tracking-wide text-white">Al Hamd</p>
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-highlight">Clinical Laboratory</p>
        <p lang="ur" dir="rtl" className="mt-1 text-center text-base text-sidebar-muted">الحمد کلینیکل لیبارٹری</p>

        <div className="mt-6 w-full rounded-xl border-t-4 border-highlight bg-card p-6 text-card-foreground shadow-elevated animate-in fade-in-0 slide-in-from-bottom-2 duration-300 sm:p-8">
          {children}
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-center text-xs text-sidebar-muted">
          <ShieldCheck className="size-3.5 text-highlight" aria-hidden /> {BRAND.tagline} · Authorised staff only
        </p>
      </main>
    </div>
  );
}
