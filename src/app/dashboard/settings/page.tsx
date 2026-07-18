
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LiquidLoader } from '@/components/liquid-loader';
import { ShieldAlert } from 'lucide-react';
import { AccountSettingsTab } from '@/components/settings/account-settings-tab';

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
        return <LiquidLoader />;
    }

    const allowedRoles: (string | undefined)[] = ['Owner', 'Manager'];
    if (!user || !allowedRoles.includes(user.role)) {
        return <AccessDeniedPrompt />;
    }

    return (
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-headline">
              Account Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your business profile and password settings.
            </p>
          </div>
          <AccountSettingsTab />
        </div>
    )
}
