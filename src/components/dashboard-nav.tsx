
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
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
    Contact,
    Wrench,
    Paintbrush,
    Bot,
    Sun,
    Moon,
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

export function DashboardNav() {
  const pathname = usePathname();
  const { seller } = useAuth();
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
        href: '/dashboard/suppliers',
        label: 'Suppliers',
        icon: Truck,
        group: 'main',
        hidden: !isStore
    },
    {
        href: '/dashboard/storefront',
        label: 'Storefront',
        icon: Paintbrush,
        group: 'settings'
    },
    {
        href: '/dashboard/settings',
        label: 'Account Settings',
        icon: Settings,
        group: 'settings'
    },
    {
        href: '/dashboard/subscription',
        label: 'Billing & Subscription',
        icon: Wallet,
        group: 'settings'
    },
  ];

  return (
    <div id="dashboard-nav">
      <Sidebar collapsible="offcanvas" className="md:flex">
        <SidebarHeader>
          <div className="flex items-center gap-2">
              <AppLogo className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-white">Agora</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
              {menuItems.filter(item => item.group === 'main' && !item.hidden).map((item) => (
              <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{
                      children: item.label,
                  }}
                  onClick={showLoader}
                  >
                  <Link href={item.href as Route}>
                      <item.icon />
                      <span>{item.label}</span>
                  </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              ))}
          </SidebarMenu>
          <SidebarSeparator />
          <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarMenu>
                  {menuItems.filter(item => item.group === 'settings').map((item) => (
                  <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={{
                          children: item.label,
                      }}
                      onClick={showLoader}
                      >
                      <Link href={item.href as Route}>
                          <item.icon />
                          <span>{item.label}</span>
                      </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  ))}
              </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
            <ThemeToggle />
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
