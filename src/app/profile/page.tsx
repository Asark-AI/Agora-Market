
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { collectionGroup, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ShoppingCart, Bell, LockKeyhole, HelpCircle, Package, Clock3, Heart, Bike, Store, Star, Eye, ArrowRight, CheckCircle2, ChevronRight, CircleDot, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PublicShell } from '@/components/public-shell';

const orderTabs = ['To Pay', 'To Ship', 'Shipped', 'To Receive', 'Completed'] as const;
type OrderTab = typeof orderTabs[number];

function getOrderTab(order: Order): OrderTab {
    if (order.status === 'pending' && !order.transactionId && order.paymentStatus !== 'SUCCESS') return 'To Pay';
    if (order.status === 'pending' || order.status === 'fulfilled') return 'To Ship';
    if (order.status === 'shipped') return 'Shipped';
    if (order.status === 'delivered') return 'To Receive';
    return 'Completed';
}

function getDeliveryLabel(order: Order) {
    if (order.status === 'delivered') return 'Delivered';
    if (order.status === 'shipped') return 'In transit';
    if (order.status === 'fulfilled') return 'Preparing shipment';
    if (order.status === 'completed') return 'Completed';
    return order.transactionId ? 'Payment confirmed' : 'Awaiting payment';
}

function getOrderItem(item: Order['items'][number]) {
    const extendedItem = item as Order['items'][number] & { name?: string; productName?: string; image?: string; imageUrl?: string; variant?: string };
    return {
        name: extendedItem.name || extendedItem.productName || 'Marketplace item',
        image: extendedItem.image || extendedItem.imageUrl,
        variant: extendedItem.variant || 'Standard',
    };
}

function OrderHistory({ orders, activeTab }: { orders: Order[]; activeTab: OrderTab }) {
    if (orders.length === 0) {
        const emptyCopy: Record<OrderTab, { title: string; description: string }> = {
            'To Pay': { title: 'Nothing waiting for payment', description: 'Orders that need your attention will appear here.' },
            'To Ship': { title: 'Nothing is being prepared', description: 'Paid orders will appear here while sellers prepare them.' },
            Shipped: { title: 'No shipped orders yet', description: 'You will see your shipment here once it leaves the seller.' },
            'To Receive': { title: 'No deliveries on the way', description: 'Orders in transit will appear here with delivery updates.' },
            Completed: { title: 'No completed orders yet', description: 'Your completed purchases will appear here.' },
        };
        const copy = emptyCopy[activeTab];
        return (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-5 py-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#eef4ef] text-[#397253]"><Package className="size-6" /></div>
                <h2 className="mt-5 text-lg font-semibold">{copy.title}</h2>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{copy.description}</p>
                <Button asChild className="mt-6">
                    <Link href="/">Start Shopping</Link>
                </Button>
            </div>
        )
    }
    return (
        <div className="space-y-4">
            {orders.map(order => (
                <Card key={order.id} className="overflow-hidden border-border/80 shadow-sm">
                    <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/70 px-4 py-4 sm:px-5">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{order.pickup?.sellerName || 'Agora seller'}</p>
                            <CardDescription className="mt-1">Order #{order.id.slice(0, 8).toUpperCase()}</CardDescription>
                        </div>
                        <Badge variant="outline" className="shrink-0 capitalize">{getDeliveryLabel(order)}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 py-4 sm:px-5">
                        {order.items.slice(0, 2).map((item, index) => {
                            const product = getOrderItem(item);
                            return <div key={`${item.productId}-${index}`} className="flex items-center gap-3"><div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">{product.image ? <img src={product.image} alt="" className="size-full object-cover" /> : <Package className="size-6 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.variant} · Qty {item.quantity}</p></div><p className="text-sm font-semibold">GH₵{(item.price * item.quantity).toFixed(2)}</p></div>;
                        })}
                        {order.items.length > 2 && <p className="text-xs text-muted-foreground">+ {order.items.length - 2} more item(s)</p>}
                        <div className="flex items-center justify-between border-t border-border/70 pt-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Truck className="size-4" /><span>{order.status === 'shipped' || order.status === 'delivered' ? 'Estimated delivery update available' : 'Delivery estimate after dispatch'}</span></div><p className="text-base font-semibold">GH₵{order.total.toFixed(2)}</p></div>
                        <div className="flex gap-2"><Button asChild className="flex-1"><Link href={order.shipmentIds?.[0] ? `/track-order?deliveryId=${order.shipmentIds[0]}` : `/profile?tab=orders&order=${order.id}`}><Truck className="mr-2 size-4" />Track Order</Link></Button><Button asChild variant="outline" className="flex-1"><Link href={`/profile?tab=orders&order=${order.id}`}>View Details<ChevronRight className="ml-1 size-4" /></Link></Button></div>
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
    const [loadingData, setLoadingData] = useState(true);
    const [orderFilter, setOrderFilter] = useState<OrderTab>('To Pay');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/sign-in');
        } else if (user) {
            const fetchData = async () => {
                setLoadingData(true);
                try {
                    if (!db) {
                        setOrders([]);
                        return;
                    }

                    // Fetch Orders
                    const ordersQuery = query(collectionGroup(db, 'orders'), where('buyerId', '==', user.id), orderBy('date', 'desc'));
                    const ordersSnapshot = await getDocs(ordersQuery);
                    setOrders(ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
                    
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
    const visibleOrders = orders.filter((order) => {
        return getOrderTab(order) === orderFilter;
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
                    <div className="border-b border-border pb-4">
                        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
                    </div>
                    <div className="-mx-4 flex gap-6 overflow-x-auto border-b border-border px-4 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Order status">
                        {orderTabs.map((status) => <button key={status} type="button" role="tab" aria-selected={status === orderFilter} onClick={() => setOrderFilter(status)} className={`shrink-0 border-b-2 px-1 pb-3 font-medium ${status === orderFilter ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'}`}>{status}</button>)}
                    </div>
                    <OrderHistory activeTab={orderFilter} orders={visibleOrders} />
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
