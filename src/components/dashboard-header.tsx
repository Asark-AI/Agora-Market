
'use client';

import { Bell, User, PanelLeft, Search, Building, Menu } from 'lucide-react';
import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { QuickActions } from './quick-actions';

export function DashboardHeader({
  title,
  onOpenMobileMenu,
}: {
  title: string;
  onOpenMobileMenu: () => void;
}) {
  const { user, seller, logOut } = useAuth();
  
  if (!user || !seller) return null;
  
  const isStore = seller.businessType === 'store' || seller.businessType === 'manufacturing';
  
  return (
    <header className="sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="outline"
              className="md:hidden"
              onClick={onOpenMobileMenu}
              aria-label="Open dashboard navigation"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open Menu</span>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Welcome Back, {user.name.split(' ')[0]}!</h1>
              <p className="text-sm text-muted-foreground">Your {seller.businessType} control room - monitoring products, orders, and compliance.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
                <Search className="size-5" />
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">New Sale!</p>
                    <p>You just made a sale of ₵1,200. Great job!</p>
                    <p className="text-xs text-muted-foreground mt-1">5 minutes ago</p>
                </div>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="overflow-hidden rounded-full">
                    <User className="h-5 w-5" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.name || 'My Account'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href={`/store/${seller.id}`} target="_blank">View Storefront</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logOut}>
                    Logout
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      <div className="mt-6">
        <QuickActions isStore={isStore} />
      </div>
    </header>
  );
}
