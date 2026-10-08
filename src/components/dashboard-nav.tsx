
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
    BarChart2,
    Settings,
    Wallet,
    MessageSquare,
    Store,
    Megaphone,
    Boxes,
    Truck,
    X,
    LogOut,
    ShoppingBag,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { AppLogo } from './app-logo';
import { usePageLoaderStore } from '@/hooks/use-page-loader';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

function NavItemWithBadge({ 
  href, 
  label, 
  icon, 
  badge,
  isActive,
  onClick,
  isMobile = false
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={{ children: label }}
        onClick={onClick}
        className={cn('dashboard-nav-link', isMobile && 'h-12 rounded-xl px-3')}
      >
        <Link href={href as Route} className="relative flex items-center justify-between">
          <span className={cn('flex items-center gap-3', isActive && 'text-primary')}>
            {icon}
            <span>{label}</span>
          </span>
          {badge && (
            <span className="ml-2 inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
              {badge}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
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
  const { logOut, sellerOrders, sellerProducts, sellerMessages, user } = useAuth();
  const { show: showLoader } = usePageLoaderStore();

  const unreadMessages = sellerMessages?.filter(m => !m.read && m.senderId !== user?.id).length || 0;
  const draftProducts = sellerProducts?.filter(p => p.status === 'draft').length || 0;
  const pendingOrders = sellerOrders?.filter(o => o.status === 'pending').length || 0;

  const navigationSections: NavSection[] = [
    {
      label: 'SELL',
      items: [
        {
          href: '/dashboard',
          label: 'Overview',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          href: '/dashboard/products',
          label: 'Products',
          icon: <Package className="h-4 w-4" />,
          badge: draftProducts > 0 ? `${draftProducts} draft` : undefined,
        },
        {
          href: '/dashboard/orders',
          label: 'Orders',
          icon: <ShoppingCart className="h-4 w-4" />,
          badge: pendingOrders > 0 ? `${pendingOrders}` : undefined,
        },
      ],
    },
    {
      label: 'GROW',
      items: [
        {
          href: '/dashboard/analytics',
          label: 'Analytics',
          icon: <BarChart2 className="h-4 w-4" />,
        },
        {
          href: '/dashboard/marketing',
          label: 'Marketing',
          icon: <Megaphone className="h-4 w-4" />,
        },
        {
          href: '/dashboard/customers',
          label: 'Customers',
          icon: <Users className="h-4 w-4" />,
        },
        {
          href: '/dashboard/messages',
          label: 'Messages',
          icon: <MessageSquare className="h-4 w-4" />,
          badge: unreadMessages > 0 ? `${unreadMessages}` : undefined,
        },
      ],
    },
    {
      label: 'MANAGE',
      items: [
        {
          href: '/dashboard/storefront',
          label: 'Business',
          icon: <Store className="h-4 w-4" />,
        },
        {
          href: '/dashboard/stock',
          label: 'Inventory',
          icon: <Boxes className="h-4 w-4" />,
        },
        {
          href: '/dashboard/suppliers',
          label: 'Suppliers',
          icon: <Truck className="h-4 w-4" />,
        },
        {
          href: '/dashboard/subscription',
          label: 'Payments',
          icon: <Wallet className="h-4 w-4" />,
        },
        {
          href: '/dashboard/settings',
          label: 'Settings',
          icon: <Settings className="h-4 w-4" />,
        },
      ],
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

  const renderNavSections = (isMobile = false) => (
    <>
      {navigationSections.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel className={cn('text-xs font-semibold uppercase tracking-wider', isMobile && 'px-3 text-xs')}>
            {section.label}
          </SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
              return (
                <NavItemWithBadge
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  isActive={isActive}
                  onClick={handleNavigation}
                  isMobile={isMobile}
                />
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}

      <SidebarGroup>
        <SidebarGroupLabel className={cn('text-xs font-semibold uppercase tracking-wider', isMobile && 'px-3 text-xs')}>ACCOUNT</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild 
              onClick={handleNavigation} 
              className={cn('dashboard-nav-link', isMobile && 'h-12 rounded-xl px-3')}
            >
              <Link href="/">
                <ShoppingBag className="h-4 w-4" />
                <span>Switch to Buyer Mode</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={cn('text-destructive hover:bg-destructive/10 hover:text-destructive', isMobile && 'h-12 rounded-xl px-3')}
              onClick={() => {
                handleNavigation();
                void logOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
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
            <div className="flex items-center gap-3">
                <AppLogo className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-sm font-semibold tracking-[0.12em]">AGORA</h1>
                <p className="text-[11px] text-muted-foreground">Seller Center</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="space-y-1">
            <SidebarMenu>{renderNavSections(false)}</SidebarMenu>
          </SidebarContent>
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
                  <p className="text-sm font-semibold tracking-[0.12em]">AGORA</p>
                  <p className="text-xs text-sidebar-foreground/70">Seller Center</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => onMobileOpenChange(false)}
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              <SidebarMenu>{renderNavSections(true)}</SidebarMenu>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
