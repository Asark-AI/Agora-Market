'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/app/super/components/ui/dropdown-menu';
import { LogOut, User, Settings, LayoutGrid, BarChart, MessageCircle, CreditCard, Search, Users as UsersIcon, Building, ShoppingCart, Megaphone, FileText, Gift, Bot, Target, Eye, PenSquare, Link as LinkIcon, Star, Mic, History } from 'lucide-react';
import { ThemeToggle } from '@/app/super/components/theme-toggle';
import { Logo } from '@/app/super/components/icons';
import { Button } from '@/app/super/components/ui/button';
import { appConfig } from '@/app/super/lib/config';
import { useRouter, usePathname } from 'next/navigation';
import { MobileNav } from '@/app/super/components/mobile-nav';
import { useAuth, useUser } from '@/app/super/firebase';
import { useEffect } from 'react';

const dashboardPath = '/super/app/dashboard';

const navItems = [
  { href: dashboardPath, label: 'Dashboard', icon: LayoutGrid },
  { href: `${dashboardPath}/activity`, label: 'Activity', icon: History },
  { href: `${dashboardPath}/users`, label: 'Users', icon: UsersIcon },
  { href: `${dashboardPath}/sellers`, label: 'Sellers', icon: Building },
  { href: `${dashboardPath}/products`, label: 'Products', icon: ShoppingCart },
  {
    href: `${dashboardPath}/marketing`,
    label: 'Marketing',
    icon: Megaphone,
    subItems: [
      { href: `${dashboardPath}/marketing/campaigns`, label: 'Campaigns', icon: Megaphone },
      { href: `${dashboardPath}/marketing/promotions`, label: 'Promotions', icon: Gift },
      { href: `${dashboardPath}/marketing/automations`, label: 'Automations', icon: Bot },
      { href: `${dashboardPath}/marketing/email-manager`, label: 'Email Manager', icon: FileText },
      { href: `${dashboardPath}/marketing/social-planner`, label: 'Social Planner', icon: PenSquare },
      { href: `${dashboardPath}/marketing/influencers`, label: 'Influencers', icon: Star },
      { href: `${dashboardPath}/marketing/ad-manager`, label: 'Ad Manager', icon: Target },
      { href: `${dashboardPath}/marketing/competitor-monitoring`, label: 'Competitor Watch', icon: Eye },
      { href: `${dashboardPath}/marketing/asset-library`, label: 'Asset Library', icon: LinkIcon },
      { href: `${dashboardPath}/marketing/seo-blog`, label: 'SEO & Blog', icon: Mic },
    ],
  },
  { href: `${dashboardPath}/analytics`, label: 'Analytics', icon: BarChart },
  { href: `${dashboardPath}/customer-service`, label: 'Customer Service', icon: MessageCircle },
  { href: `${dashboardPath}/finance`, label: 'Finance', icon: CreditCard },
];

const mainSettingsItems = [
  { href: `${dashboardPath}/settings`, label: 'General', icon: Settings },
  { href: `${dashboardPath}/settings/staff`, label: 'Staff Management', icon: UsersIcon },
  { href: `${dashboardPath}/resources`, label: 'Resources', icon: FileText },
];

export function SuperDashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in?next=%2Fsuper%2Fapp%2Fdashboard');
  }, [user, loading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.replace('/sign-in?next=%2Fsuper%2Fapp%2Fdashboard');
  };

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const isMarketingPage = pathname.startsWith(`${dashboardPath}/marketing`);

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex shrink-0 items-center gap-2">
              <MobileNav navItems={navItems} />
              <Logo className="h-8 w-8 shrink-0 text-foreground" />
              <span className="whitespace-nowrap font-bold text-sm text-foreground font-headline sm:text-lg">{appConfig.siteName}</span>
            </div>
            <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm font-medium lg:flex">
              {navItems.map((item) => (
                item.subItems ? (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger asChild>
                      <Button variant={isMarketingPage ? 'secondary' : 'ghost'} className="shrink-0 gap-2 whitespace-nowrap">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {item.subItems.map((subItem) => (
                        <DropdownMenuItem key={subItem.label} onClick={() => router.push(subItem.href)}>
                          <subItem.icon className="mr-2 h-4 w-4" />
                          {subItem.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    key={item.label}
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className="shrink-0 gap-2 whitespace-nowrap"
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                )
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex"><Search className="h-4 w-4" /></Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarImage src={user.photoURL || 'https://picsum.photos/seed/10/100/100'} alt={user.displayName || 'User'} />
                  <AvatarFallback>{user.email?.substring(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`${dashboardPath}/settings`)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {mainSettingsItems.map((item) => (
                        <DropdownMenuItem key={item.label} onClick={() => router.push(item.href)}>
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
