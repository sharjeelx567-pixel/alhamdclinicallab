import { FileCheck2, QrCode, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme';
import { RoundLogo } from '@/components/shared/round-logo';
import { BRAND } from '@/constants';

const POINTS = [
  { icon: FileCheck2, title: 'Verified reports', text: 'Every result is checked before the report is issued.' },
  { icon: QrCode, title: 'Reports online', text: 'Patients scan the QR code on their bill to get the report.' },
  { icon: ShieldCheck, title: 'Private & secure', text: 'Patient records are visible to authorised staff only.' },
];

/**
 * Sign-in and password pages. Large screens: a green brand panel on the left and the
 * form on the right. Phones: logo and name above the form.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-background lg:h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:overflow-hidden">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] text-white lg:flex lg:flex-col">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-white/[0.06]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-[26rem] rounded-full bg-black/[0.08]" />

        <div className="relative flex min-h-0 flex-1 flex-col justify-center px-12 py-8 xl:px-20">
          <RoundLogo className="size-24 shadow-2xl ring-4 ring-white/25 [@media(max-height:760px)]:size-20" alt={BRAND.name} />
          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:text-2xl">
            AL HAMD
            <span className="block text-xl font-semibold text-white/85 [@media(max-height:760px)]:text-lg">Clinical Laboratory</span>
          </h2>
          <p lang="ur" dir="rtl" className="mt-1 w-fit text-base text-white/80">الحمد کلینیکل لیبارٹری</p>
          <p className="mt-2 max-w-sm text-xs font-semibold tracking-wide text-white/80">{`${BRAND.address}. CELL : ${BRAND.phone}`.toUpperCase()}</p>

          <ul className="mt-6 grid max-w-sm gap-3 [@media(max-height:760px)]:mt-4">
            {POINTS.map((p) => (
              <li key={p.title} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white/15 ring-1 ring-white/20">
                  <p.icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{p.title}</span>
                  <span className="block text-xs text-white/75">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative px-12 pb-6 text-xs text-white/60 xl:px-20">© {new Date().getFullYear()} {BRAND.name}</p>
      </aside>

      {/* Form side */}
      <main className="relative flex min-h-dvh flex-col lg:min-h-0">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8 sm:px-8">
          <div className="w-full max-w-[360px]">
            <div className="mb-6 flex flex-col items-center text-center lg:hidden">
              <RoundLogo className="size-16 shadow-card ring-1 ring-border" alt={BRAND.name} />
              <p className="mt-2 text-base font-bold tracking-tight">{BRAND.name}</p>
              <p className="text-[11px] font-medium text-muted-foreground">{`${BRAND.address}. CELL : ${BRAND.phone}`.toUpperCase()}</p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-elevated">{children}</div>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground [@media(max-height:760px)]:mt-3">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden /> Authorised laboratory staff only
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
