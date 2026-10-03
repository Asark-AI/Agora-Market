'use client';

import { ExecutiveChart } from '@/app/super/components/executive-chart';
import { PendingSellerList } from '@/app/super/components/pending-seller-list';
import { RegionalPerformanceMap } from '@/app/super/components/regional-performance-map';
import { SubscriptionTracker } from '@/app/super/components/subscription-tracker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/super/components/ui/card';
import { DollarSign, ShoppingCart, Users, UserPlus } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
       <div className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground">A high-level overview of key trade data and platform metrics.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
             <DollarSign className="h-5 w-5 text-muted-foreground absolute right-6 top-6" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">GHC 1.2M</div>
            <p className="text-xs text-muted-foreground">+15.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground absolute right-6 top-6" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4,802</div>
            <p className="text-xs text-muted-foreground">+12.1% from last month</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground absolute right-6 top-6" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">345</div>
            <p className="text-xs text-muted-foreground">+25 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <UserPlus className="h-5 w-5 text-muted-foreground absolute right-6 top-6" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,204</div>
            <p className="text-xs text-muted-foreground">+8.5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExecutiveChart />
        <PendingSellerList />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card className="shadow-lg h-full">
                <CardHeader>
                    <CardTitle className="font-headline">Sales by Region</CardTitle>
                    <CardDescription>Live sales performance across Ghana.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <RegionalPerformanceMap />
                </CardContent>
            </Card>
        </div>
        <div>
            <SubscriptionTracker />
        </div>
      </div>
    </div>
  );
}
