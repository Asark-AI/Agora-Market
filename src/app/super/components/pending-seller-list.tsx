'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';
import { Button } from '@/app/super/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/super/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

// In a real app, this data would be fetched from your API
const pendingSellers = [
  { name: 'Vintage Finds', owner: 'Alex Johnson', avatar: 'https://picsum.photos/seed/seller1/40/40', hint: 'vintage clothing' },
  { name: 'Gadget Gurus', owner: 'Ben Carter', avatar: 'https://picsum.photos/seed/seller2/40/40', hint: 'tech gadgets' },
  { name: 'Kente Kingdom', owner: 'Ama Boafo', avatar: 'https://picsum.photos/seed/seller3/40/40', hint: 'african fabric' },
];

export function PendingSellerList() {
  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="font-headline">Pending Approvals</CardTitle>
        <CardDescription>New seller applications to review.</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingSellers.length > 0 ? (
            <div className="space-y-4">
            {pendingSellers.map((seller) => (
                <div key={seller.name} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-4">
                        <Avatar>
                        <AvatarImage src={seller.avatar} alt={seller.name} data-ai-hint={seller.hint} />
                        <AvatarFallback>{seller.name.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div>
                        <p className="font-semibold">{seller.name}</p>
                        <p className="text-sm text-muted-foreground">{seller.owner}</p>
                        </div>
                    </div>
                     <Button asChild variant="secondary" size="sm">
                        <Link href="/dashboard/sellers">
                            Review <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            ))}
            </div>
        ) : (
            <div className="text-sm text-center text-muted-foreground py-8">
                No pending applications.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
