
'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, FileText, Wrench, CheckCircle, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { OrderStatus, RepairRequest } from '@/lib/types';
import Link from 'next/link';
import { usePageLoaderStore } from '@/hooks/use-page-loader';

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  fulfilled: 'default',
  completed: 'default',
  pending: 'secondary',
  'in-progress': 'outline',
  'awaiting-quote': 'outline',
  'awaiting-parts': 'outline',
  'ready-for-pickup': 'default',
  'delivered': 'default',
  cancelled: 'destructive',
  shipped: 'outline',
  upcoming: 'secondary',
};

const statusText: Record<OrderStatus, string> = {
    'in-progress': 'In Progress',
    'awaiting-quote': 'Awaiting Quote',
    'awaiting-parts': 'Awaiting Parts',
    'ready-for-pickup': 'Ready for Pickup',
    'delivered': 'Delivered',
    fulfilled: 'Fulfilled',
    pending: 'New Request',
    cancelled: 'Cancelled',
    shipped: 'Shipped',
    upcoming: 'Upcoming',
    completed: 'Completed',
};

const urgencyVariant: Record<RepairRequest['urgency'], 'default' | 'secondary' | 'destructive'> = {
    Normal: 'secondary',
    High: 'default',
    Emergency: 'destructive',
};

export default function RepairsPage() {
    const { seller, sellerRepairRequests, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const { show: showLoader } = usePageLoaderStore();

    const filteredRequests = useMemo(() => {
        return sellerRepairRequests.filter(req => {
            if (activeTab === 'all') return true;
            if (activeTab === 'completed') return req.status === 'completed' || req.status === 'delivered';
            return req.status === activeTab;
        });
    }, [sellerRepairRequests, activeTab]);

    if (loading || !seller) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    const tabs = ['all', 'pending', 'awaiting-quote', 'in-progress', 'completed', 'cancelled'];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Manage Repair Requests</CardTitle>
                <CardDescription>View, track, and manage all incoming repair jobs.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        {tabs.map(tab => (
                            <TabsTrigger key={tab} value={tab} className="capitalize">{tab.replace('-', ' ')}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value={activeTab} className="mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ticket #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Device</TableHead>
                                    <TableHead>Issue</TableHead>
                                    <TableHead>Urgency</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRequests.length > 0 ? (
                                    filteredRequests.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.ticketNumber}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{req.customerName}</p>
                                                    <p className="text-sm text-muted-foreground">{req.customerContact}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{req.deviceType}</TableCell>
                                            <TableCell className="text-sm">{req.issueSummary}</TableCell>
                                            <TableCell>
                                                <Badge variant={urgencyVariant[req.urgency]}>{req.urgency}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant[req.status]}>
                                                    {statusText[req.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild onClick={showLoader}>
                                                            <Link href={`/dashboard/repairs/${req.id}`}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                View Full Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Wrench className="mr-2 h-4 w-4" />
                                                            Update Status
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Clock className="mr-2 h-4 w-4" />
                                                            Log Time/Parts
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Mark as Completed
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">
                                            No repair requests in this category.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
