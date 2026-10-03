'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Progress } from '@/app/super/components/ui/progress';
import { Bell, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// In a real app, this data would be fetched from your API
const expiringSellers = [
  { name: 'Home Goods Inc.', owner: 'Eve Davis', avatar: '...', hint: '...', expiry: 'in 2 weeks' },
];

const totalSellers = 345;
const premiumSellers = 128;
const premiumPercentage = totalSellers > 0 ? Math.round((premiumSellers / totalSellers) * 100) : 0;

export function SubscriptionTracker() {
  return (
    <Card className="shadow-lg h-full">
       <CardHeader className="flex flex-row items-center justify-between">
         <div>
            <CardTitle className="font-headline">Subscriptions</CardTitle>
            <CardDescription>Track seller subscription status.</CardDescription>
         </div>
         <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/sellers">
                Manage <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <h3 className="text-sm font-medium">Premium Plan Adoption</h3>
            <span className="text-sm text-muted-foreground">{premiumSellers} / {totalSellers} sellers</span>
          </div>
          <Progress value={premiumPercentage} className="w-full" />
           <p className="text-xs text-muted-foreground mt-2">{premiumPercentage}% of sellers are on a premium plan.</p>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Upcoming Expiries
          </h3>
          {expiringSellers.length > 0 ? (
            expiringSellers.map((seller) => (
              <div key={seller.name} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold">{seller.name}</p>
                    <p className="text-sm text-muted-foreground">Expires {seller.expiry}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Remind
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground rounded-lg border p-3 text-center">
                No upcoming subscription expiries.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
