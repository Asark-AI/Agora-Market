
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
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="rounded-b-[24px] border-x border-b border-border/60 bg-gradient-to-r from-background via-background to-muted/20 px-4 py-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.28)] sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <Building className="size-3.5" />
                Seller workspace
              </div>
              <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Welcome Back, {user.name.split(' ')[0]}!</h1>
              <p className="text-sm text-muted-foreground">Your {seller.businessType} control room - monitoring products, orders, and compliance.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="size-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">New Sale!</p>
                  <p>You just made a sale of ₵1,200. Great job!</p>
                  <p className="mt-1 text-xs text-muted-foreground">5 minutes ago</p>
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
                <DropdownMenuItem onClick={logOut}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-4">
          <QuickActions isStore={isStore} />
        </div>
      </div>
    </header>
  );
}
