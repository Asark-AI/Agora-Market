
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/app-logo';
import { appConfig } from '@/lib/config';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Wrench, Package, Truck, AlertTriangle, Calendar } from 'lucide-react';
import type { OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const mockRepairStatus = {
    ticketNumber: 'R12345',
    status: 'in-progress' as OrderStatus,
    device: 'iPhone 13 Pro',
    updates: [
        { status: 'pending', text: 'Repair Request Submitted', date: '2024-08-01', complete: true },
        { status: 'awaiting-quote', text: 'Awaiting Quote from Technician', date: '2024-08-01', complete: true },
        { status: 'in-progress', text: 'Repair in Progress', date: '2024-08-02', complete: true },
        { status: 'awaiting-parts', text: 'Awaiting Part Delivery', date: '2024-08-03', complete: false },
        { status: 'ready-for-pickup', text: 'Ready for Pickup', date: null, complete: false },
        { status: 'completed', text: 'Repair Completed & Closed', date: null, complete: false },
    ],
    estimatedCompletion: '2024-08-05',
};

const statusIcons: Record<OrderStatus, React.ElementType> = {
    'pending': Clock,
    'awaiting-quote': Clock,
    'in-progress': Wrench,
    'awaiting-parts': Package,
    'ready-for-pickup': CheckCircle,
    'completed': CheckCircle,
    'delivered': Truck,
    'cancelled': AlertTriangle,
    'shipped': Truck,
    'upcoming': Calendar,
    'fulfilled': CheckCircle,
};

const StatusTimeline = ({ status, updates, estimatedCompletion }: typeof mockRepairStatus) => {
    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Status for Job #{status}</CardTitle>
                <CardDescription>Device: {mockRepairStatus.device}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {updates.map((update, index) => {
                        const Icon = statusIcons[update.status as OrderStatus] || Clock;
                        return (
                            <div key={index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "rounded-full size-8 flex items-center justify-center",
                                        update.complete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    )}>
                                        <Icon className="size-5" />
                                    </div>
                                    {index < updates.length - 1 && <div className="w-px flex-grow bg-border my-1" />}
                                </div>
                                <div>
                                    <p className={cn(
                                        "font-semibold",
                                        !update.complete && "text-muted-foreground"
                                    )}>{update.text}</p>
                                    {update.date && <p className="text-sm text-muted-foreground">{update.date}</p>}
                                </div>
                            </div>
                        )
                    })}
                </div>
                 <Separator className="my-6" />
                 <div className="text-center">
                    <p className="text-sm text-muted-foreground">Estimated Completion Date</p>
                    <p className="font-semibold">{estimatedCompletion}</p>
                 </div>
            </CardContent>
        </Card>
    )
}


export default function TrackRepairPage() {
    const [jobNumber, setJobNumber] = useState('');
    const [trackedRepair, setTrackedRepair] = useState<typeof mockRepairStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleTrack = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            if (jobNumber.toUpperCase() === 'R12345') {
                setTrackedRepair(mockRepairStatus);
            } else {
                setTrackedRepair(null);
                // In a real app, you'd show a "not found" error
            }
            setIsLoading(false);
        }, 1000);
    }

    return (
        <div className="bg-muted min-h-screen">
            <div className="container mx-auto max-w-lg py-12 px-4">
                 <div className="flex flex-col items-center text-center mb-8">
                    <AppLogo className="h-16 w-16 text-primary mb-4" />
                    <h1 className="text-3xl font-bold font-headline">Track Your Repair</h1>
                    <p className="text-muted-foreground mt-2">
                        Enter your repair job number to see the current status.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Enter Job Number</CardTitle>
                        <CardDescription>You can find this number on your repair receipt or in the confirmation email.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <div className="flex items-center border rounded-l-md bg-secondary px-3">
                                <span className="text-muted-foreground">#</span>
                            </div>
                            <Input
                                value={jobNumber}
                                onChange={(e) => setJobNumber(e.target.value)}
                                placeholder="R12345"
                                className="rounded-l-none"
                            />
                            <Button onClick={handleTrack} disabled={isLoading || !jobNumber}>
                                {isLoading ? 'Tracking...' : 'Track'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {trackedRepair && <StatusTimeline {...trackedRepair} />}
            </div>
        </div>
    );
}
