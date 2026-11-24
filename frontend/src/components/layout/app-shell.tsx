'use client';

import { Bell, ChevronDown, ChevronRight, LogOut, Menu, Search, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, SheetContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/form-controls';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/misc';
import { AnimatedBackground } from '@/components/shared/animated-background';
import { Avatar } from '@/components/shared/cloud-image';
import { Logo } from '@/components/shared/logo';
import { BRAND, NAV, ROUTE_LABELS, type NavGroup } from '@/constants';
import { AUTH_MODE, useAuth } from '@/features/auth/auth-provider';
import { useApi } from '@/hooks/use-api';
import { cn, timeAgo } from '@/lib/utils';
import { authService, notificationsService } from '@/services/admin.service';
import type { AppNotification } from '@/types';
import { RouteProgress } from './route-progress';
import { ThemeToggle } from './theme';

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** The menu groups the signed-in user may see (items filtered by permission). */
function useVisibleNav(): NavGroup[] {
  const { can } = useAuth();
  return NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.permission || can(i.permission)) })).filter((g) => g.items.length);
}

/**
 * Desktop menu bar under the green header: a direct link for single-item groups
 * (Dashboard) and a dropdown per section. The open section is marked by a gold bar.
 */
function TopNav() {
  const pathname = usePathname();
  const groups = useVisibleNav();
  return (
    <nav aria-label="Main" className="mx-auto flex h-12 w-full max-w-[1600px] items-stretch gap-1 px-4 sm:px-6 lg:px-8">
      {groups.map((g) => {
        const active = g.items.some((i) => isActive(pathname, i.href));
        const tab = cn(
          'relative flex items-center gap-2 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground',
          'after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-highlight after:transition-transform',
          active ? 'text-primary after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-50',
        );
        if (g.items.length === 1) {
          const item = g.items[0];
          return (
            <Link key={g.label} href={item.href} className={tab} aria-current={active ? 'page' : undefined}>
              <item.icon className="size-4" aria-hidden /> {item.label}
            </Link>
          );
        }
        return (
          <DropdownMenu key={g.label}>
            <DropdownMenuTrigger asChild>
              <button className={tab}>
                {g.label} <ChevronDown className="size-3.5 opacity-70" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-1.5">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.14em] text-highlight">{g.label}</DropdownMenuLabel>
              {g.items.map((item) => {
                const on = isActive(pathname, item.href);
                return (
                  <DropdownMenuItem key={item.href} asChild className={cn('gap-3 py-2', on && 'bg-primary-soft font-semibold text-primary')}>
                    <Link href={item.href} aria-current={on ? 'page' : undefined}>
                      <span className={cn('grid size-8 place-items-center rounded-md', on ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary')}>
                        <item.icon className="size-4" aria-hidden />
                      </span>
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}

/** Phone / tablet: the same sections as a list in a drawer. */
function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const groups = useVisibleNav();
  return (
    <nav className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Main">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-highlight">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const on = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={on ? 'page' : undefined}
                    className={cn('flex items-center gap-3 rounded-md border-l-[3px] border-transparent px-3 py-2 text-sm font-medium', on ? 'border-highlight bg-primary-soft text-primary' : 'text-foreground/80 hover:bg-muted')}
                  >
                    <item.icon className="size-[18px] shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Intermediate breadcrumb segments only link to real pages (avoids dead links such as /billing/invoice). */
const LINKABLE = new Set([...NAV.flatMap((g) => g.items.map((i) => i.href)), '/analyzers/messages', '/patients/new', '/orders/new', '/tests/new']);

function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null; // a top-level page: its name is already marked in the menu bar
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {parts.map((p, i) => {
          const href = `/${parts.slice(0, i + 1).join('/')}`;
          // Any segment that isn't a known page is a record id (e.g. test-cbc, a Firestore id): show "Details".
          const label = ROUTE_LABELS[p] ?? (i > 0 ? 'Details' : p);
          const last = i === parts.length - 1;
          return (
            <li key={href} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
              {last ? (
                <span className="truncate font-medium text-foreground" aria-current="page">{label}</span>
              ) : LINKABLE.has(href) ? (
                <Link href={href} className="truncate hover:text-foreground">{label}</Link>
              ) : (
                <span className="truncate">{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const { can } = useAuth();
  const [q, setQ] = React.useState('');
  if (!can('patients.read')) return null;
  return (
    <form
      role="search"
      className="relative hidden w-52 lg:block xl:w-64 2xl:w-80"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        if (term) router.push(`/patients?q=${encodeURIComponent(term)}`);
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search MR no., name, mobile, CNIC" className="h-9 bg-muted/60 pl-9" aria-label="Search patients" />
    </form>
  );
}

function NotificationsMenu() {
  const { can } = useAuth();
  const enabled = can('notifications.read');
  // Database read quota: a full list is read on page load, when the bell is opened and every
  // 30 minutes; in between, every 2 minutes (only while this tab is visible) the server returns
  // only notifications newer than the newest one shown — 1 read when there is nothing new.
  const last = React.useRef<{ items: AppNotification[]; cursor: string | null; fullAt: number } | null>(null);
  const fetchNotifications = React.useCallback(async (full = false, force = false) => {
    const prev = last.current;
    // Full list: first load, every 30 min, after "mark all read", and when the bell is opened (at most once a minute).
    if (!prev || !prev.cursor || force || Date.now() - prev.fullAt > 30 * 60_000 || (full && Date.now() - prev.fullAt > 60_000)) {
      const res = await notificationsService.list();
      last.current = { items: res.items, cursor: res.cursor, fullAt: Date.now() };
    } else {
      const res = await notificationsService.newSince(prev.cursor);
      const known = new Set(prev.items.map((n) => n.id));
      last.current = { ...prev, cursor: res.cursor, items: [...res.items.filter((n) => !known.has(n.id)), ...prev.items].slice(0, 100) };
    }
    const items = last.current.items;
    return { items, unread: items.filter((n) => !n.read).length };
  }, []);
  const state = useApi(enabled ? () => fetchNotifications() : null, [enabled], { refreshMs: 120_000 });
  const fullReload = React.useCallback(async (force = false) => {
    try {
      state.setData(await fetchNotifications(true, force));
    } catch {
      /* keep the last list */
    }
  }, [fetchNotifications, state]);
  if (!enabled) return null;
  const unread = state.data?.unread ?? 0;
  return (
    <DropdownMenu onOpenChange={(o) => o && void fullReload()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <Bell />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] dark:bg-red-600 font-bold leading-4 text-white">{unread > 99 ? '99+' : unread}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem]">
        <div className="flex items-center justify-between px-2.5 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button className="text-xs font-medium text-primary hover:underline" onClick={() => void notificationsService.readAll().then(() => fullReload(true))}>
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[60vh] overflow-y-auto">
          {!state.data?.items.length ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            state.data.items.slice(0, 8).map((n) => (
              <DropdownMenuItem key={n.id} asChild className="items-start">
                <Link href={n.link ?? '/notifications'} onClick={() => { void notificationsService.read(n.id); if (last.current) last.current.items = last.current.items.map((x) => (x.id === n.id ? { ...x, read: true } : x)); }}>
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : n.severity === 'critical' ? 'bg-destructive' : n.severity === 'warning' ? 'bg-warning' : 'bg-primary')} />
                  <span className="min-w-0">
                    <span className={cn('block truncate text-sm', !n.read && 'font-semibold')}>{n.title}</span>
                    <span className="line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-primary">View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition hover:bg-muted" aria-label="Account menu">
          <Avatar photo={user.photo} name={user.displayName} size={32} />
          <span className="hidden min-w-0 text-left leading-tight sm:block lg:hidden xl:block">
            <span className="block max-w-[10rem] truncate text-sm font-medium">{user.displayName}</span>
            <span className="block max-w-[10rem] truncate text-[11px] text-muted-foreground">{user.roleLabel}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-medium text-foreground">{user.displayName}</span>
          <span className="block truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile"><UserRound /> My profile & security</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => void signOut()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Development-mode banner: shown whenever the backend is not using real auth or persistent storage. */
function EnvironmentBanner() {
  const cfg = useApi(() => authService.config(), []);
  const dev = AUTH_MODE === 'dev' || cfg.data?.authMode === 'dev' || cfg.data?.dataBackend === 'memory';
  if (!dev) return null;
  return (
    <div role="status" className="no-print border-b border-warning/30 bg-warning-soft px-4 py-1.5 text-center text-xs font-medium text-warning">
      DEVELOPMENT MODE — {cfg.data?.dataBackend === 'memory' ? 'in-memory data (not saved), ' : ''}
      {AUTH_MODE === 'dev' ? 'demo sign-in. ' : ''}Do not enter real patient information.
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <React.Suspense fallback={null}>
        <RouteProgress />
      </React.Suspense>
      <AnimatedBackground />

      {/* Mobile drawer */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-72 flex-col border-none bg-card p-0" aria-describedby={undefined}>
          <div className="flex h-16 items-center border-b-2 border-highlight bg-sidebar px-4">
            <Logo inverted />
          </div>
          <span className="sr-only" id="mobile-nav-title">Navigation</span>
          <MobileNav onNavigate={() => setMobileOpen(false)} />
          <p className="border-t p-3 text-center text-[11px] italic text-muted-foreground">{BRAND.tagline}</p>
        </SheetContent>
      </Dialog>

      <EnvironmentBanner />
      <header className="no-print sticky top-0 z-30 shadow-card">
        {/* Green brand bar */}
        <div className="border-b-2 border-highlight bg-sidebar text-sidebar-foreground">
          <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="-ml-2 text-sidebar-foreground hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu />
            </Button>
            <Link href="/dashboard" className="min-w-0" aria-label={`${BRAND.name} home`}>
              <Logo inverted className="[&_div]:hidden min-[400px]:[&_div]:block" />
            </Link>
            <div className="on-brand ml-auto flex items-center gap-1 sm:gap-2">
              <GlobalSearch />
              <ThemeToggle />
              <NotificationsMenu />
              <UserMenu />
            </div>
          </div>
        </div>
        {/* Section menus */}
        <div className="hidden border-b bg-card lg:block">
          <TopNav />
        </div>
      </header>

      <main id="main" className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 empty:hidden">
          <Breadcrumbs />
        </div>
        {children}
      </main>
      <footer className="no-print border-t bg-card/80 py-3 text-center text-[11px] text-muted-foreground">
        {BRAND.name} · {BRAND.tagline}
      </footer>
    </div>
  );
}

export function DemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-dashed border-warning/50 bg-warning-soft px-3 py-2 text-sm text-warning">
      <Badge tone="demo">DEMO</Badge>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
