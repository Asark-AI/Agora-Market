
'use client';

import { Bell, User, Menu } from 'lucide-react';
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
  onOpenMobileMenu: () => void;
}) {
  const { user, seller, logOut, sellerMessages } = useAuth();

  if (!user || !seller) return null;

  const unreadCount = sellerMessages?.filter(m => !m.read && m.senderId !== user.id).length || 0;
  const hasNotifications = unreadCount > 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-3 flex-1">
          <Button
            size="icon"
            variant="outline"
            className="md:hidden h-9 w-9"
            onClick={onOpenMobileMenu}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
          </div>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
                <Bell className="h-4 w-4" />
                {hasNotifications && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
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
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                <User className="h-4 w-4" />
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
