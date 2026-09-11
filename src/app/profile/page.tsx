
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, RepairRequest } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ShoppingCart, Wrench, Bell, LockKeyhole, HelpCircle, Package, Clock3, Heart, Bike, Store, Star, Eye, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PublicShell } from '@/components/public-shell';

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
        <div className="space-y-3">
            {orders.map(order => (
                <Card key={order.id} className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-4 py-3">
                        <div>
                            <CardTitle className="text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                            <CardDescription>{format(new Date(order.date), 'dd MMM, yyyy')}</CardDescription>
                        </div>
                        <Badge variant="secondary">{order.status}</Badge>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-4 px-4 py-4">
                        <div>
                            <p className="text-sm font-medium">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                            <p className="mt-1 text-sm font-semibold">GH₵{order.total.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button asChild size="sm" variant="outline"><Link href={`/profile?tab=orders&order=${order.id}`}>Details</Link></Button>
                            <Button asChild size="sm"><Link href={`/profile?tab=orders&order=${order.id}`}>Track</Link></Button>
                        </div>
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
    const { user, seller, logOut, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [repairs, setRepairs] = useState<RepairRequest[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [orderFilter, setOrderFilter] = useState('All');

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
    const ordersTab = searchParams.get('tab') === 'orders';
    const repairsTab = searchParams.get('tab') === 'repairs';
    const visibleOrders = orders.filter((order) => {
        if (orderFilter === 'All') return true;
        if (orderFilter === 'To Pay') return order.status === 'pending' && !order.transactionId;
        if (orderFilter === 'Processing') return order.status === 'pending' || order.status === 'fulfilled';
        if (orderFilter === 'Shipped') return order.status === 'shipped';
        if (orderFilter === 'To Receive') return order.status === 'delivered';
        return order.status === 'completed' || order.status === 'fulfilled';
    });

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
            <PublicShell>
                <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
            {ordersTab ? (
                <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                        <div><p className="text-sm text-muted-foreground">Agora / Account</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Orders</h1></div>
                        <Button asChild variant="outline" size="icon" aria-label="Search orders"><Link href="/search"><ShoppingCart className="size-4" /></Link></Button>
                    </div>
                    <div className="-mx-4 flex gap-5 overflow-x-auto border-b border-border px-4 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {['All', 'To Pay', 'Processing', 'Shipped', 'To Receive', 'Completed'].map((status) => <button key={status} type="button" onClick={() => setOrderFilter(status)} className={`shrink-0 border-b-2 px-1 pb-3 font-medium ${status === orderFilter ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'}`}>{status}</button>)}
                    </div>
                    <OrderHistory orders={visibleOrders} />
                </div>
            ) : repairsTab ? (
                <div className="space-y-5">
                    <div className="border-b border-border pb-4"><p className="text-sm text-muted-foreground">Agora / Account</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Repair History</h1></div>
                    <RepairHistory repairs={repairs} />
                </div>
            ) : (
                <>
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

            <section className="mb-8 border-b border-border pb-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Store className="size-4" /> {seller ? 'Your store is ready' : 'One account, two capabilities'}</div>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{seller ? 'Open Seller Center' : 'Start selling on Agora'}</h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{seller ? 'Manage products, orders, inventory, and customer conversations without leaving Agora.' : 'Turn your products into sales with the same Agora identity you use for shopping.'}</p>
                    </div>
                    <Button asChild className="shrink-0">
                        <Link href={seller ? '/dashboard' : '/seller-signup'}>{seller ? 'Open Seller Center' : 'Start Selling'} <ArrowRight className="ml-2 size-4" /></Link>
                    </Button>
                </div>
            </section>

            <section className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"><Bike className="size-5" /></div>
                    <div>
                        <h2 className="font-semibold">Rider Center</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Apply to deliver with Agora or manage your rider availability.</p>
                    </div>
                </div>
                <Button asChild variant="outline" className="shrink-0"><Link href="/rider">Open Rider Center <ArrowRight className="ml-2 size-4" /></Link></Button>
            </section>

            <div className="mb-8 grid gap-2 sm:grid-cols-2">
                {[
                    { label: 'My Orders', href: '/profile?tab=orders', icon: ShoppingCart },
                    { label: 'Wishlist', href: '/wishlist', icon: Heart },
                    { label: 'Recently Viewed', href: '/products', icon: Clock3 },
                    { label: 'My Reviews', href: '/profile?tab=reviews', icon: Star },
                ].map(({ label, href, icon: Icon }) => (
                    <Link key={label} href={href} className="flex items-center justify-between border-b border-border px-1 py-3 text-sm font-medium transition hover:text-primary">
                        <span className="flex items-center gap-3"><Icon className="size-4 text-muted-foreground" /> {label}</span><ArrowRight className="size-4 text-muted-foreground" />
                    </Link>
                ))}
            </div>
            <section className="space-y-1 border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Services</p>
                <Link href="/profile?tab=repairs" className="flex items-center justify-between border-b border-border py-3 text-sm font-medium"><span className="flex items-center gap-3"><Wrench className="size-4 text-muted-foreground" /> Repair History</span><ArrowRight className="size-4 text-muted-foreground" /></Link>
            </section>
            <section className="mt-6 space-y-1 border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sell on Agora</p>
                <Link href={seller ? '/dashboard' : '/seller-signup'} className="flex items-center justify-between border-b border-border py-3 text-sm font-medium"><span className="flex items-center gap-3"><Store className="size-4 text-muted-foreground" /> {seller ? 'Open Seller Center' : 'Become a Seller'}</span><ArrowRight className="size-4 text-muted-foreground" /></Link>
            </section>
            <section className="mt-6 space-y-1 border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Deliver with Agora</p>
                <Link href="/rider" className="flex items-center justify-between border-b border-border py-3 text-sm font-medium"><span className="flex items-center gap-3"><Bike className="size-4 text-muted-foreground" /> Rider Center</span><ArrowRight className="size-4 text-muted-foreground" /></Link>
            </section>
            <section className="mt-6 space-y-1 border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Settings</p>
                {([
                    ['Settings', '/dashboard/settings', LockKeyhole],
                    ['Notifications', '/profile', Bell],
                    ['Help & Support', '/about', HelpCircle],
                ] as const).map(([label, href, Icon]) => <Link key={label} href={href} className="flex items-center justify-between border-b border-border py-3 text-sm font-medium"><span className="flex items-center gap-3"><Icon className="size-4 text-muted-foreground" /> {label}</span><ArrowRight className="size-4 text-muted-foreground" /></Link>)}
                <button type="button" onClick={logOut} className="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-destructive"><LogOut className="size-4" /> Log Out</button>
            </section>
                </>
            )}
                </div>
            </PublicShell>
    )
}
