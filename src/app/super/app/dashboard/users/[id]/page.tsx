
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getUsers, type User } from '@/app/super/services/users';
import { getOrders, type Order } from '@/app/super/services/orders';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';
import { Badge } from '@/app/super/components/ui/badge';
import { Button } from '@/app/super/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { DollarSign, ShoppingBag, Star, Edit, MoreVertical } from 'lucide-react';
import { Textarea } from '@/app/super/components/ui/textarea';

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;
            setLoading(true);
            const [usersData, ordersData] = await Promise.all([getUsers(), getOrders()]);
            const currentUser = usersData.find(u => u.id === userId) || null;
            const userOrders = ordersData.filter(o => o.customerId === userId);
            
            setUser(currentUser);
            setOrders(userOrders);
            setLoading(false);
        };
        fetchData();
    }, [userId]);

    if (loading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!user) {
        return <div className="text-center py-20">User not found.</div>;
    }
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Inactive': return 'secondary';
            case 'Suspended': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getOrderStatusVariant = (status: string) => {
         switch (status) {
            case 'Delivered': return 'default';
            case 'Shipped': return 'secondary';
            case 'Pending': return 'outline';
            case 'Cancelled': return 'destructive';
            default: return 'secondary';
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <Avatar className="w-24 h-24 border-4 border-background">
                            <AvatarImage src={user.avatar.src} alt={user.name} data-ai-hint={user.avatar.hint}/>
                            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <div className="flex justify-between items-center">
                                 <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
                                 <div className="flex gap-2">
                                     <Button variant="outline"><Edit className="mr-2 h-4 w-4"/>Edit Profile</Button>
                                     <Button variant="destructive">Suspend User</Button>
                                 </div>
                            </div>
                            <p className="text-muted-foreground">{user.email}</p>
                             <div className="mt-2 flex items-center gap-4">
                                <Badge variant={getStatusVariant(user.status) as any}>{user.status}</Badge>
                                <span className="text-sm text-muted-foreground">Joined: {user.dateJoined}</span>
                                <span className="text-sm text-muted-foreground">Region: {user.region}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total Spent</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">GHC{user.totalSpent.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Orders</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">GHC{(user.totalSpent / (orders.length || 1)).toFixed(2)}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Loyalty Status</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">{user.segment}<Star className="h-6 w-6 text-yellow-400"/></div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader><CardTitle>Order History</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                            <TableCell>{order.date}</TableCell>
                                            <TableCell><Badge variant={getOrderStatusVariant(order.status) as any}>{order.status}</Badge></TableCell>
                                            <TableCell className="text-right font-medium">GHC{order.total.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                         <CardHeader><CardTitle>Agent Notes</CardTitle></CardHeader>
                         <CardContent>
                            <Textarea placeholder="Add a note about this customer..." className="mb-2"/>
                            <Button size="sm">Save Note</Button>
                         </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <p>Opened support ticket #TKT-008</p>
                            <p>Viewed "Wireless Bluetooth Headphones"</p>
                            <p>Completed order #ORD-115</p>
                        </CardContent>
                     </Card>
                </div>
            </div>

        </div>
    );
}
