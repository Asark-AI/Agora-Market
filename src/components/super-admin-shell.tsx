'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  ChevronRight,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Store,
  Users,
  X,
} from 'lucide-react';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin?view=sellers', label: 'Sellers', icon: Store },
  { href: '/admin?view=users', label: 'Users', icon: Users },
  { href: '/admin?view=applications', label: 'Applications', icon: FileCheck2 },
  { href: '/admin?view=reports', label: 'Reports', icon: BarChart3 },
];

export function SuperAdminShell({
  children,
  userName,
  onLogOut,
}: {
  children: React.ReactNode;
  userName: string;
  onLogOut: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const renderNavigation = () => navigation.map((item) => {
    const Icon = item.icon;
    const active = pathname === '/admin' && (item.href === '/admin' ? !searchParams.get('view') : searchParams.get('view') === new URL(item.href, 'http://localhost').searchParams.get('view'));
    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        aria-disabled={false}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition',
          active ? 'bg-emerald-300 text-[#10231c] shadow-lg shadow-emerald-950/20' : 'text-emerald-50/65 hover:bg-white/[0.06] hover:text-white',
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{item.label}</span>
        <ChevronRight className="h-4 w-4 opacity-40" />
      </Link>
    );
  });

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200/80 bg-[#10231c] text-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1">
            <AppLogo className="h-full w-full" />
          </div>
          <div>
            <p className="font-headline text-lg font-semibold tracking-tight">Agora</p>
            <p className="text-[10px] uppercase tracking-[0.26em] text-emerald-200/70">Control center</p>
          </div>
        </div>

        <div className="px-5 py-7">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/10 bg-white/[0.06] px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Super Admin</p>
              <p className="truncate text-xs text-emerald-100/55">Full platform access</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4" aria-label="Admin navigation">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/40">Workspace</p>
          <div className="space-y-1">{renderNavigation()}</div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <button type="button" onClick={onLogOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-emerald-50/65 transition hover:bg-white/[0.06] hover:text-white">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f5f7f4]/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <Button size="icon" variant="outline" className="lg:hidden" aria-label="Open admin navigation" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-700/70">Platform operations</p>
                <h1 className="font-headline text-xl font-semibold tracking-tight sm:text-2xl">Operations center</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="outline" size="icon" className="rounded-full border-slate-200 bg-white" aria-label="View notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce9df] text-sm font-bold text-[#24553d]">{userName.charAt(0).toUpperCase()}</div>
                <div className="max-w-36">
                  <p className="truncate text-sm font-semibold">{userName}</p>
                  <p className="text-xs text-slate-500">Super administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label="Close admin navigation" className="absolute inset-0 bg-slate-950/45" onClick={() => setMobileOpen(false)} />
            <aside className="relative flex h-full w-[min(86vw,20rem)] flex-col bg-[#10231c] p-5 text-white shadow-2xl">
              <div className="mb-8 flex items-center justify-between"><p className="font-headline text-lg font-semibold">Agora Control center</p><Button size="icon" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setMobileOpen(false)} aria-label="Close admin navigation"><X className="h-5 w-5" /></Button></div>
              <nav className="space-y-1" aria-label="Admin navigation">{renderNavigation()}</nav>
              <button type="button" onClick={onLogOut} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-emerald-50/65 hover:bg-white/[0.06] hover:text-white"><LogOut className="h-4 w-4" />Sign out</button>
            </aside>
          </div>
        )}
        <main className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
