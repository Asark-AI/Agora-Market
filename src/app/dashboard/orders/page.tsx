
'use client';

import { useState, useMemo, FC } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    MoreHorizontal, 
    FileText, 
    Truck, 
    CheckCircle, 
    XCircle, 
    Search,
    Send,
    MessageSquare,
    Printer,
    Download
} from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { Order } from '@/lib/types';
import { usePageLoaderStore } from '@/hooks/use-page-loader';
import { PosSystem } from '@/components/pos-system';
import React from 'react';


const paymentStatusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  paid: 'default',
  pending: 'secondary',
  refunded: 'destructive',
};
const paymentStatusText: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  refunded: 'Refunded',
};

const fulfillmentStatusVariant: Record<Order['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  fulfilled: 'default',
  pending: 'secondary',
  cancelled: 'destructive',
  shipped: 'outline',
  upcoming: 'secondary',
  completed: 'default',
  'in-progress': 'outline',
  'awaiting-quote': 'outline',
  'awaiting-parts': 'outline',
  'ready-for-pickup': 'default',
  'delivered': 'default',
};

const fulfillmentStatusText: Record<Order['status'], string> = {
    fulfilled: 'Fulfilled',
    pending: 'Pending',
    cancelled: 'Cancelled',
    shipped: 'Shipped',
    upcoming: 'Upcoming',
    completed: 'Completed',
    'in-progress': 'In Progress',
    'awaiting-quote': 'Awaiting Quote',
    'awaiting-parts': 'Awaiting Parts',
    'ready-for-pickup': 'Ready for Pickup',
    'delivered': 'Delivered',
};

const OnlineOrdersTab: FC = () => {
    const { seller, sellerOrders, sellerCustomers, loading } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { show: showLoader } = usePageLoaderStore();

    const filteredOrders = useMemo(() => {
        return sellerOrders.filter(order => {
            const customer = sellerCustomers.find(c => c.userId === order.buyerId);
            const matchesSearch = searchTerm === '' ||
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [sellerOrders, searchTerm, statusFilter, sellerCustomers]);

    const getCustomerName = (order: Order) => {
        const customer = sellerCustomers.find(c => c.userId === order.buyerId);
        return customer?.name || 'Unknown Customer';
    }
    
    const getPaymentStatus = (order: Order): 'paid' | 'pending' | 'refunded' => {
        if(order.paymentMethod && order.paymentMethod !== 'flutterwave' && (order.status === 'fulfilled' || order.status === 'completed' || order.status === 'delivered')) return 'paid';
        if (order.transactionId) return 'paid';
        return 'pending';
    }
    
    const orderActionsMenu = (orderId: string) => (
        <DropdownMenuContent align="end">
            <DropdownMenuItem asChild onClick={showLoader}>
                <Link href={`/dashboard/orders/${orderId}` as Route}>
                    <FileText className="mr-2 h-4 w-4" /> View Details
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={() => window.open(`/dashboard/orders/${orderId}/receipt`, '_blank')}>
                <Link href="#">
                    <Printer className="mr-2 h-4 w-4" /> Print Invoice
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Truck className="mr-2 h-4 w-4" /> Update Status
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal><DropdownMenuSubContent>
                    <DropdownMenuItem><Send className="mr-2 h-4 w-4" /><span>Mark as Shipped</span></DropdownMenuItem>
                    <DropdownMenuItem><CheckCircle className="mr-2 h-4 w-4" /><span>Mark as Fulfilled</span></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive"><XCircle className="mr-2 h-4 w-4" /><span>Cancel Order</span></DropdownMenuItem>
                </DropdownMenuSubContent></DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild onClick={showLoader}>
                <Link href="/dashboard/messages">
                    <MessageSquare className="mr-2 h-4 w-4" /> Contact Customer
                </Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
    );

    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                        <CardTitle className="font-headline">Manage Online Orders</CardTitle>
                        <CardDescription>View, track, and manage all your customer orders from your online storefront.</CardDescription>
                    </div>
                    <Button variant="outline" className="w-full md:w-auto shrink-0">
                        <Download className="mr-2 h-4 w-4" />
                        Export Orders
                    </Button>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by Order ID, customer name..." 
                            className="pl-10" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Filter by status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="fulfilled">Fulfilled</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-center">Items</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Fulfillment</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map(order => {
                                    const paymentStatus = getPaymentStatus(order);
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">
                                                <Link href={`/dashboard/orders/${order.id}` as Route} className="text-primary hover:underline" onClick={showLoader}>
                                                    #{order.id.toUpperCase().slice(0,8)}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">{format(new Date(order.date), 'dd MMM, yyyy')}</p>
                                            </TableCell>
                                            <TableCell>{getCustomerName(order)}</TableCell>
                                            <TableCell className="text-center">{order.items.length}</TableCell>
                                            <TableCell>
                                                <Badge variant={paymentStatusVariant[paymentStatus]}>{paymentStatusText[paymentStatus]}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={fulfillmentStatusVariant[order.status]}>
                                                    {fulfillmentStatusText[order.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                ₵{order.total.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    {orderActionsMenu(order.id)}
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        No orders found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map(order => {
                            const paymentStatus = getPaymentStatus(order);
                            return (
                                <Card key={order.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base">
                                                    <Link href={`/dashboard/orders/${order.id}` as Route} className="text-primary hover:underline" onClick={showLoader}>
                                                        #{order.id.toUpperCase().slice(0,8)}
                                                    </Link>
                                                </CardTitle>
                                                <CardDescription>{format(new Date(order.date), 'dd MMM, yyyy')}</CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                {orderActionsMenu(order.id)}
                                            </DropdownMenu>
                                        </div>
                                        <p className="text-sm font-medium pt-2">{getCustomerName(order)}</p>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Total</span>
                                            <span className="font-semibold">₵{order.total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Payment</span>
                                            <Badge variant={paymentStatusVariant[paymentStatus]}>{paymentStatusText[paymentStatus]}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Fulfillment</span>
                                            <Badge variant={fulfillmentStatusVariant[order.status]}>{fulfillmentStatusText[order.status]}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    ) : (
                         <div className="text-center py-16 text-muted-foreground">
                            <p>No orders found for the selected filters.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}


export default function OrdersPage() {
    const { seller, loading } = useAuth();
    
    if (loading || !seller) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <Tabs defaultValue="online-orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="online-orders">Online Orders</TabsTrigger>
            <TabsTrigger value="pos-system">POS (Walk-in Sales)</TabsTrigger>
          </TabsList>
          <TabsContent value="online-orders" className="mt-4">
             <OnlineOrdersTab />
          </TabsContent>
          <TabsContent value="pos-system" className="mt-4">
            <PosSystem />
          </TabsContent>
        </Tabs>
    );
}

