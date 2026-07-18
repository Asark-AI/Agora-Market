
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, MessageSquare, ShoppingBag, Wrench, Search, Users, DollarSign } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import type { Route } from 'next';
import { usePageLoaderStore } from '@/hooks/use-page-loader';

export default function CustomersPage() {
    const { seller, sellerCustomers, loading } = useAuth();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { show: showLoader } = usePageLoaderStore();

    useEffect(() => {
        if (!loading && !seller) {
            router.push('/sign-in');
        }
    }, [seller, loading, router]);

    const filteredCustomers = useMemo(() => {
        if (!sellerCustomers) return [];
        return sellerCustomers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sellerCustomers, searchTerm]);

    const summaryData = useMemo(() => {
        if (!sellerCustomers) return { totalCustomers: 0, totalRevenue: 0, avgRevenue: 0 };
        const totalCustomers = sellerCustomers.length;
        const totalRevenue = sellerCustomers.reduce((acc, customer) => acc + customer.totalSpent, 0);
        const avgRevenue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
        return { totalCustomers, totalRevenue, avgRevenue };
    }, [sellerCustomers]);
    
    const pageConfig = useMemo(() => {
        if (!seller) return null;
        const isRepairShop = seller.businessType === 'repairs';
        return {
            isRepairShop,
            ordersLink: (isRepairShop ? '/dashboard/repairs' : '/dashboard/orders') as Route,
            ordersLabel: isRepairShop ? 'View Repair Requests' : 'View Orders',
            orderIcon: isRepairShop ? <Wrench className="mr-2 h-4 w-4" /> : <ShoppingBag className="mr-2 h-4 w-4" />,
            dateLabel: isRepairShop ? 'Last Service' : 'Last Order',
            countLabel: isRepairShop ? 'Jobs' : 'Orders',
            pageDescription: isRepairShop ? "A list of your clients." : "A list of customers who have purchased from your store.",
        };
    }, [seller]);

    if (loading || !seller || !pageConfig) {
         return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryData.totalCustomers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₵{summaryData.totalRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Revenue/Customer</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₵{summaryData.avgRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Customers</CardTitle>
                    <CardDescription>
                        {pageConfig.pageDescription}
                    </CardDescription>
                    <div className="relative pt-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers by name or email..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>{pageConfig.dateLabel}</TableHead>
                                <TableHead className="text-right">{pageConfig.countLabel}</TableHead>
                                <TableHead className="text-right">Total Spent</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={customer.avatar} />
                                                    <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{customer.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <a href={`mailto:${customer.email}`} className="text-primary hover:underline" onClick={showLoader}>{customer.email}</a>
                                                <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(customer.lastOrderDate), 'dd MMM, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">{customer.totalOrders}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            ₵{customer.totalSpent.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                        <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild onClick={showLoader}>
                                                        <Link href={pageConfig.ordersLink}>
                                                            {pageConfig.orderIcon}
                                                            {pageConfig.ordersLabel}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild onClick={showLoader}>
                                                        <Link href="/dashboard/messages">
                                                            <MessageSquare className="mr-2 h-4 w-4" />
                                                            Message Customer
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No customers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
