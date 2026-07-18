'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LiquidLoader } from '@/components/liquid-loader';
import { ShieldAlert } from 'lucide-react';
import { AccountSettingsTab } from '@/components/settings/account-settings-tab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Store, MessageSquare, Wallet } from 'lucide-react';
import { StorefrontSettingsTab } from '@/components/settings/storefront-settings-tab';
import { CommsSettingsTab } from '@/components/settings/comms-settings-tab';
import { FinancialsSettingsTab } from '@/components/settings/financials-settings-tab';

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
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your account, store, and communication settings.
            </p>
          </div>
          
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="account"><User className="mr-2 size-4"/>Account</TabsTrigger>
              <TabsTrigger value="storefront"><Store className="mr-2 size-4"/>Storefront</TabsTrigger>
              <TabsTrigger value="comms"><MessageSquare className="mr-2 size-4"/>Communications</TabsTrigger>
              <TabsTrigger value="financials"><Wallet className="mr-2 size-4"/>Financials</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <AccountSettingsTab />
            </TabsContent>
            <TabsContent value="storefront">
              <p className="text-sm text-muted-foreground p-4 text-center bg-secondary rounded-lg">Storefront customization has moved. Please use the dedicated <a href="/dashboard/storefront" className="underline font-semibold">Storefront Editor</a>.</p>
            </TabsContent>
            <TabsContent value="comms">
                <CommsSettingsTab />
            </TabsContent>
             <TabsContent value="financials">
                <FinancialsSettingsTab />
            </TabsContent>
          </Tabs>
        </div>
    )
}