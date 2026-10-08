
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DashboardSkeleton } from '@/components/loading-skeletons';
import { ShieldAlert } from 'lucide-react';
import { AccountSettingsTab } from '@/components/settings/account-settings-tab';
import Link from 'next/link';
import { Bell, ChevronRight, ShieldCheck, Store, UserRound } from 'lucide-react';

function AccessDeniedPrompt() {
    return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full mb-4">
                    <ShieldAlert className="size-10" />
                </div>
                <CardTitle className="text-2xl font-headline">Access Denied</CardTitle>
                <CardDescription>
                    You do not have the necessary permissions to view this page. Please contact your account administrator.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>This section is restricted to users with 'Owner' or 'Manager' roles.</p>
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return <DashboardSkeleton />;
    }

    const allowedRoles: (string | undefined)[] = ['Owner', 'Manager'];
    if (!user || !allowedRoles.includes(user.role)) {
        return <AccessDeniedPrompt />;
    }

    return (
                <div className="mx-auto max-w-[1100px] space-y-6">
                    <header className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Settings</p>
                        <h1 className="text-2xl font-semibold sm:text-[26px]">Account settings</h1>
                        <p className="text-sm text-muted-foreground">Manage your business profile, security, and notification preferences.</p>
                    </header>
                    <nav aria-label="Account settings sections" className="grid gap-3 sm:grid-cols-2">
                        {[
                            { href: '#account-settings-profile', title: 'Account', description: 'Business name and contact information', icon: UserRound },
                            { href: '#account-settings-store', title: 'Store status', description: 'Control storefront visibility', icon: Store },
                            { href: '#account-settings-password', title: 'Security', description: 'Password management', icon: ShieldCheck },
                            { href: '#account-settings-notifications', title: 'Notifications', description: 'Email and SMS preferences', icon: Bell },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.title} href={item.href} className="flex min-h-[72px] items-center gap-3 rounded-xl border border-border bg-[#171b1f] px-4 py-3 transition-colors hover:border-primary/25 hover:bg-accent/70">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary"><Icon className="size-4" /></span>
                                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span></span>
                                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                                </Link>
                            );
                        })}
                    </nav>
          <AccountSettingsTab />
        </div>
    )
}
