
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { 
    LayoutDashboard, 
    Package, 
    ShoppingCart, 
    Users, 
    Truck, 
    BarChart2, 
    Settings,
    Wallet,
    MessageSquare,
    Wrench,
    Paintbrush,
    Sun,
    Moon,
    X,
    LogOut,
} from 'lucide-react';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { AppLogo } from './app-logo';
import { useTheme } from 'next-themes';
import { usePageLoaderStore } from '@/hooks/use-page-loader';

function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    return (
        <div className="hidden group-data-[state=expanded]:flex items-center justify-center gap-2 rounded-lg bg-sidebar-accent p-2 text-sidebar-accent-foreground">
            <Button
                variant={theme === 'light' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex-1"
            >
                <Sun className="mr-2 size-4" /> Light
            </Button>
             <Button
                variant={theme === 'dark' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex-1"
            >
                <Moon className="mr-2 size-4" /> Dark
            </Button>
        </div>
    );
}

export function DashboardNav({
  mobileOpen,
  onMobileOpenChange,
}: {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { seller, logOut } = useAuth();
  const { show: showLoader } = usePageLoaderStore();

  const isStore = seller?.businessType === 'store' || seller?.businessType === 'manufacturing';
  const isService = seller?.businessType === 'services';
  const isRepair = seller?.businessType === 'repairs';
  
  const getOrdersLink = () => {
    if (isRepair) return '/dashboard/repairs';
    return '/dashboard/orders';
  }

  const getOrdersLabel = () => {
    if (isRepair) return 'Repair Requests';
    if (isService) return 'Bookings';
    return 'Orders';
  }
  
  const menuItems = [
    {
      href: '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      group: 'main'
    },
    {
      href: '/dashboard/products',
      label: isStore ? 'Products' : 'Services',
      icon: isRepair ? Wrench : Package,
      group: 'main'
    },
    {
      href: getOrdersLink(),
      label: getOrdersLabel(),
      icon: ShoppingCart,
      group: 'main'
    },
    {
        href: '/dashboard/analytics',
        label: 'Analytics',
        icon: BarChart2,
        group: 'main'
    },
    {
        href: '/dashboard/messages',
        label: 'Messages',
        icon: MessageSquare,
        group: 'main'
    },
    {
        href: '/dashboard/customers',
        label: 'Customers',
        icon: Users,
        group: 'main'
    },
    {
        href: '/dashboard/storefront',
        label: 'Store',
        icon: Paintbrush,
        group: 'settings'
    },
    {
        href: '/dashboard/settings',
        label: 'Settings',
        icon: Settings,
        group: 'settings'
    },
    {
        href: '/dashboard/subscription',
        label: 'Payments',
        icon: Wallet,
        group: 'settings'
    },
  ];

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onMobileOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen, onMobileOpenChange]);

  const handleNavigation = () => {
    showLoader();
    onMobileOpenChange(false);
  };

  const renderNavItems = (isMobile = false) => (
    <>
      {menuItems.filter((item) => item.group === 'main').map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={{ children: item.label }}
              onClick={handleNavigation}
              className={cn(isMobile && 'h-12 rounded-xl px-3')}
            >
              <Link href={item.href as Route}>
                <Icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
      <SidebarSeparator className={cn(isMobile && 'my-2')} />
      <SidebarGroup>
        <SidebarGroupLabel className={cn(isMobile && 'px-3')}>Settings</SidebarGroupLabel>
        <SidebarMenu>
          {menuItems.filter((item) => item.group === 'settings').map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{ children: item.label }}
                  onClick={handleNavigation}
                  className={cn(isMobile && 'h-12 rounded-xl px-3')}
                >
                  <Link href={item.href as Route}>
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={cn('h-12 rounded-xl px-3 text-destructive', isMobile && 'h-12 rounded-xl px-3')}
              onClick={() => {
                handleNavigation();
                void logOut();
              }}
            >
              <button type="button" className="flex w-full items-center gap-2">
                <LogOut className="size-4" />
                <span>Logout</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );

  return (
    <div id="dashboard-nav">
      <div className="hidden md:block">
        <Sidebar collapsible="offcanvas" className="md:flex">
        <SidebarHeader>
          <div className="flex items-center gap-2">
              <AppLogo className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-white">Agora</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>{renderNavItems(false)}</SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <ThemeToggle />
        </SidebarFooter>
      </Sidebar>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[80] md:hidden"
          role="presentation"
          onClick={() => onMobileOpenChange(false)}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <aside
            className="relative flex h-full w-[85vw] max-w-[320px] flex-col border-r border-border bg-sidebar text-sidebar-foreground shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sidebar-border/50 px-4 py-4">
              <div className="flex items-center gap-2">
                <AppLogo className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Agora Seller</p>
                  <p className="text-xs text-sidebar-foreground/70">Management Hub</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => onMobileOpenChange(false)}
                aria-label="Close dashboard navigation"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <SidebarMenu>{renderNavItems(true)}</SidebarMenu>
            </div>
            <div className="border-t border-sidebar-border/50 p-3">
              <ThemeToggle />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
