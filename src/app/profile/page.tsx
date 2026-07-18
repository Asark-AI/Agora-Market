
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, RepairRequest } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ShoppingCart, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function OrderHistory({ orders }: { orders: Order[] }) {
    if (orders.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">You have no order history.</p>
                <Button asChild className="mt-4">
                    <Link href="/">Start Shopping</Link>
                </Button>
            </div>
        )
    }
    return (
        <div className="space-y-4">
            {orders.map(order => (
                <Card key={order.id}>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle className="text-base">Order #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                            <CardDescription>Date: {format(new Date(order.date), 'dd MMM, yyyy')}</CardDescription>
                        </div>
                        <Badge variant="secondary">{order.status}</Badge>
                    </CardHeader>
                    <CardContent>
                        <p>Total: <span className="font-semibold">₵{order.total.toFixed(2)}</span></p>
                        <p>{order.items.length} item(s)</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function RepairHistory({ repairs }: { repairs: RepairRequest[] }) {
    if (repairs.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">You have no repair requests.</p>
            </div>
        )
    }
    return (
        <div className="space-y-4">
            {repairs.map(repair => (
                <Card key={repair.id}>
                     <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle className="text-base">Job #{repair.ticketNumber}</CardTitle>
                            <CardDescription>Device: {repair.brandModel}</CardDescription>
                        </div>
                        <Badge variant="secondary">{repair.status}</Badge>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-muted-foreground">{repair.issueSummary}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export default function ProfilePage() {
    const { user, logOut, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [repairs, setRepairs] = useState<RepairRequest[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/sign-in');
        } else if (user) {
            const fetchData = async () => {
                setLoadingData(true);
                try {
                    if (!db) {
                        setOrders([]);
                        setRepairs([]);
                        return;
                    }

                    // Fetch Orders
                    const ordersQuery = query(collection(db, 'orders'), where('buyerId', '==', user.id), orderBy('date', 'desc'));
                    const ordersSnapshot = await getDocs(ordersQuery);
                    setOrders(ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
                    
                    // Fetch Repairs
                    const repairsQuery = query(collection(db, 'repairRequests'), where('buyerId', '==', user.id), orderBy('createdAt', 'desc'));
                    const repairsSnapshot = await getDocs(repairsQuery);
                    setRepairs(repairsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RepairRequest)));
                } catch (error) {
                    console.error("Failed to fetch user data:", error);
                    // Handle error appropriately, maybe show a toast
                } finally {
                    setLoadingData(false);
                }
            };
            fetchData();
        }
    }, [user, authLoading, router]);
    
    const isLoading = authLoading || loadingData;

    if (isLoading || !user) {
        return (
            <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
                <div className="flex items-center gap-6">
                    <Skeleton className="size-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-6">
                    <Avatar className="size-24">
                        <AvatarImage src={`https://placehold.co/96x96/E2E8F0/475569?text=${user.name.charAt(0)}`} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold font-headline">{user.name}</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={logOut}>
                    <LogOut className="mr-2 size-4" />
                    Log Out
                </Button>
            </div>
            
            <Tabs defaultValue="orders">
                <TabsList>
                    <TabsTrigger value="orders"><ShoppingCart className="mr-2 size-4" /> Order History</TabsTrigger>
                    <TabsTrigger value="repairs"><Wrench className="mr-2 size-4" /> Repair History</TabsTrigger>
                </TabsList>
                <TabsContent value="orders">
                    <OrderHistory orders={orders} />
                </TabsContent>
                <TabsContent value="repairs">
                    <RepairHistory repairs={repairs} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
