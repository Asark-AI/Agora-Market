
'use client';

import { Bell, Menu, Search, Store, UserRound } from 'lucide-react';
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

export function DashboardHeader({
  title,
  onOpenMobileMenu,
}: {
  title: string;
  onOpenMobileMenu?: () => void;
}) {
  const { user, seller, logOut, sellerMessages } = useAuth();

  if (!user || !seller) return null;

  const unreadCount = sellerMessages?.filter(m => !m.read && m.senderId !== user.id).length || 0;
  const hasNotifications = unreadCount > 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[#101316]">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Hamburger + Title */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            className="h-11 w-11 border-border bg-[#171b1f] md:hidden"
            onClick={onOpenMobileMenu ?? undefined}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground sm:text-lg">{title}</h1>
            <Link href="/dashboard/storefront" className="mt-0.5 flex max-w-[55vw] items-center gap-1.5 truncate text-xs text-muted-foreground hover:text-primary">
              <Store className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{seller.name}</span>
            </Link>
          </div>
        </div>

        {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-primary" aria-label="Browse products">
            <Link href="/dashboard/products"><Search className="h-4 w-4" /></Link>
          </Button>
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-lg text-muted-foreground hover:text-primary" aria-label={`Notifications${hasNotifications ? `, ${unreadCount} unread messages` : ''}`}>
                <Bell className="h-4 w-4" />
                {hasNotifications && (
                  <span className="absolute right-0 top-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[#101316] bg-destructive px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unreadCount > 0 ? (
                <div className="p-3 text-sm space-y-2 max-h-64 overflow-y-auto">
                  <p className="font-medium text-foreground">
                    {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">Check your messages for customer inquiries</p>
                </div>
              ) : (
                <div className="p-3 text-sm text-center text-muted-foreground py-6">
                  No new notifications
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/messages">View all messages</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full border border-border bg-[#171b1f] text-primary" aria-label="Open account menu">
                <UserRound className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.name || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/store/${seller.id}`} target="_blank">View Store</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/">Back to Shopping</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logOut} className="text-destructive">
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
