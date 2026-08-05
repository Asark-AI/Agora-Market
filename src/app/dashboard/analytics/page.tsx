
'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Product, ServiceProduct } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Percent,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  TrendingUp,
  Bot,
  Info,
  Wrench,
  Briefcase,
  Wallet,
  Clock,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import NextImage from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfMonth, endOfMonth, eachMonthOfInterval, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
  orders: {
    label: 'Orders',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

// --- Components ---

const KpiCard = ({ title, value, change, icon: Icon, unit = '' }: { title: string, value: string, change?: number, icon: React.ElementType, unit?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}{unit}</div>
      {change !== undefined &&
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {change >= 0 ? <ArrowUp className="h-3 w-3 text-green-500" /> : <ArrowDown className="h-3 w-3 text-red-500" />}
          <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>{Math.abs(change)}%</span> vs last month
        </p>
      }
    </CardContent>
  </Card>
);

const CircularProgressBar = ({ score, size = 120, strokeWidth = 10 }: { score: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    stroke="hsl(var(--border))"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke="hsl(var(--primary))"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            <span className="absolute text-3xl font-bold">{score}</span>
        </div>
    );
}

const AnalyticsSkeleton = () => (
    <div className="space-y-8 p-1">
        <header>
            <Skeleton className="h-9 w-1/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
        </header>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-80" />
            <Skeleton className="h-80" />
        </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-64" />
            <Skeleton className="h-64" />
        </div>
    </div>
);


export default function AnalyticsPage() {
    const { seller, sellerOrders, sellerProducts, sellerCustomers, sellerRepairRequests, loading } = useAuth();
    const [revenuePeriod, setRevenuePeriod] = useState<'7d' | '30d' | '3m' | '12m'>('30d');

    const pageConfig = useMemo(() => {
        if (!seller) return null;
        const isStore = seller.businessType === 'store' || seller.businessType === 'manufacturing';
        const isRepair = seller.businessType === 'repairs';
        const isService = seller.businessType === 'services';

        return {
            isStore,
            isRepair,
            isService,
            kpiTitles: {
                revenue: 'Total Revenue',
                orders: isStore ? 'Total Orders' : (isRepair ? 'Total Jobs' : 'Total Bookings'),
                customers: 'Customers',
                completionRate: 'Completion Rate',
                aov: isStore ? 'Avg. Order Value' : (isRepair ? 'Avg. Job Value' : 'Avg. Booking Value'),
            },
            charts: {
                revenueTitle: 'Revenue',
                ordersTitle: isStore ? 'Orders Overview' : (isRepair ? 'Jobs Overview' : 'Bookings Overview'),
                productTitle: isStore ? 'Product Performance' : (isRepair ? 'Top Repair Types' : 'Top Services'),
            }
        };
    }, [seller]);
    
    const analyticsData = useMemo(() => {
        if (!seller || !pageConfig) return null;

        const customerMap = new Map(sellerCustomers.map(c => [c.userId, c]));
        const productMap = new Map(sellerProducts.map(p => [p.id, p]));
        
        let revenue = 0, totalOrders = 0, completedOrders = 0, aov = 0;
        let onlineOrdersCount = 0;
        let walkInOrdersCount = 0;
        
        if (pageConfig.isStore || pageConfig.isService) {
            completedOrders = sellerOrders.filter(o => o.status === 'fulfilled' || o.status === 'shipped' || o.status === 'completed').length;
            revenue = sellerOrders.reduce((sum, order) => (order.status === 'fulfilled' || order.status === 'shipped' || order.status === 'completed') ? sum + order.total : sum, 0);
            totalOrders = sellerOrders.length;
            if (pageConfig.isStore) {
                walkInOrdersCount = sellerOrders.filter(o => o.paymentMethod && o.paymentMethod !== 'flutterwave').length;
                onlineOrdersCount = totalOrders - walkInOrdersCount;
            }
        } else if (pageConfig.isRepair) {
            completedOrders = sellerRepairRequests.filter(r => r.status === 'completed').length;
            revenue = sellerRepairRequests.reduce((sum, req) => (req.status === 'completed' && req.quote) ? sum + req.quote : sum, 0);
            totalOrders = sellerRepairRequests.length;
        }

        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        aov = completedOrders > 0 ? revenue / completedOrders : 0;
        const customers = {
            value: sellerCustomers.length,
            new: sellerCustomers.filter(c => c.totalOrders <= 1).length,
            returning: sellerCustomers.filter(c => c.totalOrders > 1).length,
        };

        const getRevenueData = (period: '7d' | '30d' | '3m' | '12m') => {
             // Mocked for simplicity - in a real app, this would query/aggregate based on the period
            const dataMap: { [key: string]: { revenue: number } } = {};
            if(period === '7d') return [{ name: 'Mon', revenue: 1200 }, { name: 'Tue', revenue: 1500 }, { name: 'Wed', revenue: 1100 }, { name: 'Thu', revenue: 1800 }, { name: 'Fri', revenue: 2200 }, { name: 'Sat', revenue: 2500 }, { name: 'Sun', revenue: 2300 }];
            if(period === '30d') return Array.from({ length: 30 }, (_, i) => ({ name: `Day ${i + 1}`, revenue: 1000 + Math.random() * 1500 }));
            if(period === '3m') return Array.from({ length: 12 }, (_, i) => ({ name: `Week ${i + 1}`, revenue: 7000 + Math.random() * 5000 }));
            if(period === '12m') return [{ name: 'Jan', revenue: 45000 }, { name: 'Feb', revenue: 48000 }, { name: 'Mar', revenue: 52000 }, { name: 'Apr', revenue: 55000 }, { name: 'May', revenue: 58000 }, { name: 'Jun', revenue: 62000 }, { name: 'Jul', revenue: 65000 }, { name: 'Aug', revenue: 68000 }, { name: 'Sep', revenue: 72000 }, { name: 'Oct', revenue: 75000 }, { name: 'Nov', revenue: 82000 }, { name: 'Dec', revenue: 95000 }];
            return [];
        }

        const topItems = pageConfig.isStore ? 
            (sellerProducts as Product[])
            .sort((a,b) => (b.clicks || 0) - (a.clicks || 0))
            .slice(0, 5)
            .map(p => ({id: p.id, image: p.images[0], name: p.name, revenue: 100, units: 10, stock: p.stock}))
            : (sellerProducts as ServiceProduct[])
            .sort((a,b) => (b.clicks || 0) - (a.clicks || 0))
            .slice(0, 5)
            .map(s => ({id: s.id, image: s.coverImageUrl, name: s.name, revenue: 100, units: 10, stock: undefined }));

        return {
            kpiData: { totalRevenue: { value: revenue }, totalOrders: { value: totalOrders, online: onlineOrdersCount, walkIn: walkInOrdersCount }, customers, completionRate: { value: completionRate }, aov: { value: aov } },
            revenueData: getRevenueData(revenuePeriod),
            ordersData: { daily: [{ name: 'Mon', orders: 20 }, { name: 'Tue', orders: 25 }, { name: 'Wed', orders: 18 }, { name: 'Thu', orders: 30 }, { name: 'Fri', orders: 35 }, { name: 'Sat', orders: 40 }, { name: 'Sun', orders: 38 }], summary: { pending: 15, cancelled: 3, returned: 2 } },
            topItems: topItems,
            lowStockProducts: pageConfig.isStore ? (sellerProducts as Product[]).filter(p => p.stock > 0 && p.stock <= 10) : [],
            outOfStockProducts: pageConfig.isStore ? (sellerProducts as Product[]).filter(p => p.stock === 0) : [],
            earningsData: { gross: revenue, commission: revenue * 0.1, net: revenue * 0.9, withdrawable: revenue * 0.7, pending: revenue * 0.2 },
            sellerScore: 88,
            insights: [
                { 
                    title: 'Product Opportunity', 
                    text: 'Your "Handwoven Kente Scarf" has high views but low conversion. Consider updating the description or adding more images.', 
                    icon: Lightbulb, 
                    color: 'text-yellow-600', 
                    bgColor: 'bg-yellow-500/10'
                },
                { 
                    title: 'Positive Revenue Trend', 
                    text: 'Your revenue has increased by 12% this month compared to the previous month. Keep up the great work!', 
                    icon: TrendingUp,
                    color: 'text-green-600', 
                    bgColor: 'bg-green-500/10'
                }
            ],
            alerts: [{ title: "Revenue Milestone", text: `Congratulations! You've crossed ₵${(Math.floor(revenue/1000)*1000).toLocaleString()} in total revenue.`, icon: TrendingUp, color: "text-green-500", bgColor: "bg-green-500/10" }],
        }
        
    }, [seller, sellerOrders, sellerProducts, sellerCustomers, sellerRepairRequests, pageConfig, revenuePeriod]);
    
    if (loading || !pageConfig || !analyticsData) {
        return <AnalyticsSkeleton />;
    }

    return (
        <div className="space-y-8 p-1">
            <header>
                <h1 className="text-3xl font-bold font-headline">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Your store’s performance at a glance.</p>
            </header>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <KpiCard title={pageConfig.kpiTitles.revenue} value={`₵${(analyticsData.kpiData.totalRevenue.value / 1000).toFixed(1)}k`} change={12.5} icon={DollarSign} />
                
                {pageConfig.isStore ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{pageConfig.kpiTitles.orders}</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.kpiData.totalOrders.value.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{analyticsData.kpiData.totalOrders.online} online vs {analyticsData.kpiData.totalOrders.walkIn} walk-in</p>
                    </CardContent>
                  </Card>
                ) : (
                  <KpiCard title={pageConfig.kpiTitles.orders} value={analyticsData.kpiData.totalOrders.value.toLocaleString()} change={8.2} icon={pageConfig.isRepair ? Wrench : Briefcase } />
                )}

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{pageConfig.kpiTitles.customers}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.kpiData.customers.value}</div>
                        <p className="text-xs text-muted-foreground">{analyticsData.kpiData.customers.new} new vs {analyticsData.kpiData.customers.returning} returning</p>
                    </CardContent>
                </Card>
                <KpiCard title={pageConfig.kpiTitles.completionRate} value={analyticsData.kpiData.completionRate.value.toFixed(1)} unit="%" change={-1.5} icon={Percent} />
                <KpiCard title={pageConfig.kpiTitles.aov} value={`₵${analyticsData.kpiData.aov.value.toFixed(2)}`} change={4.3} icon={DollarSign} />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{pageConfig.charts.revenueTitle}</CardTitle>
                                <CardDescription>Track your revenue over different periods.</CardDescription>
                            </div>
                            <Tabs defaultValue={revenuePeriod} onValueChange={(v) => setRevenuePeriod(v as any)} className="space-y-4">
                                <TabsList>
                                    <TabsTrigger value="7d">7d</TabsTrigger>
                                    <TabsTrigger value="30d">30d</TabsTrigger>
                                    <TabsTrigger value="3m">3m</TabsTrigger>
                                    <TabsTrigger value="12m">12m</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pl-2">
                        <ChartContainer config={chartConfig}>
                            <AreaChart data={analyticsData.revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor="var(--color-revenue)"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="var(--color-revenue)"
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₵${value / 1000}k`} />
                                <ChartTooltip
                                    cursor={true}
                                    content={<ChartTooltipContent indicator="line" />}
                                />
                                <Area
                                    dataKey="revenue"
                                    type="monotone"
                                    fill="url(#fillRevenue)"
                                    stroke="var(--color-revenue)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Orders Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>{pageConfig.charts.ordersTitle}</CardTitle>
                        <CardDescription>A summary of your daily workload.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[150px] w-full">
                            <BarChart data={analyticsData.ordersData.daily}>
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideIndicator />}
                                />
                                <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-md bg-secondary p-3">
                                <p className="text-xs font-medium text-muted-foreground">Pending</p>
                                <p className="text-xl font-bold">{analyticsData.ordersData.summary.pending}</p>
                            </div>
                            <div className="rounded-md bg-secondary p-3">
                                <p className="text-xs font-medium text-muted-foreground">Cancelled</p>
                                <p className="text-xl font-bold">{analyticsData.ordersData.summary.cancelled}</p>
                            </div>
                             <div className="rounded-md bg-secondary p-3">
                                <p className="text-xs font-medium text-muted-foreground">Returned</p>
                                <p className="text-xl font-bold">{analyticsData.ordersData.summary.returned}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Product Performance */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{pageConfig.charts.productTitle}</CardTitle>
                        <CardDescription>Your top 5 best-performing items.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">{pageConfig.isStore ? 'Units Sold' : 'Times Booked'}</TableHead>
                                    {pageConfig.isStore && <TableHead className="text-right">Stock</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analyticsData.topItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <NextImage src={item.image || 'https://placehold.co/40x40.png'} alt={item.name} width={40} height={40} className="rounded-md" />
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">₵{item.revenue.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{item.units}</TableCell>
                                        {pageConfig.isStore && <TableCell className="text-right">{item.stock}</TableCell>}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    {pageConfig.isStore && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Inventory Alerts</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analyticsData.lowStockProducts.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-yellow-600 mb-2">Low Stock</h4>
                                    {analyticsData.lowStockProducts.map(p => <p key={p.id} className="text-sm text-muted-foreground">{p.name} - {p.stock} left</p>)}
                                </div>
                                )}
                                {analyticsData.outOfStockProducts.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-red-600 mb-2">Out of Stock</h4>
                                    {analyticsData.outOfStockProducts.map(p => <p key={p.id} className="text-sm text-muted-foreground">{p.name}</p>)}
                                </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    <Card>
                        <CardHeader><CardTitle>Total Views</CardTitle></CardHeader>
                        <CardContent><p className="text-3xl font-bold">12,408</p><p className="text-sm text-muted-foreground">Total views this month.</p></CardContent>
                    </Card>
                </div>
            </div>

            {/* Earnings and Seller Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Earnings Breakdown</CardTitle>
                        <CardDescription>A summary of your current financial standing.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="rounded-lg bg-secondary p-4">
                            <p className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="size-4" /> Gross Revenue</p>
                            <p className="font-bold text-2xl mt-2">₵{analyticsData.earningsData.gross.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-secondary p-4">
                            <p className="text-sm text-muted-foreground flex items-center gap-2"><Percent className="size-4" /> Platform Fee</p>
                            <p className="font-bold text-2xl mt-2">₵{analyticsData.earningsData.commission.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-secondary p-4">
                            <p className="text-sm text-muted-foreground flex items-center gap-2"><Wallet className="size-4" /> Net Earnings</p>
                            <p className="font-bold text-2xl mt-2">₵{analyticsData.earningsData.net.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 p-4">
                            <p className="text-sm font-medium flex items-center gap-2"><CheckCircle className="size-4" /> Withdrawable</p>
                            <p className="font-bold text-2xl mt-2">₵{analyticsData.earningsData.withdrawable.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 p-4">
                            <p className="text-sm font-medium flex items-center gap-2"><Clock className="size-4" /> Pending</p>
                            <p className="font-bold text-2xl mt-2">₵{analyticsData.earningsData.pending.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle>Seller Performance</CardTitle>
                        <CardDescription>Your score based on fulfillment rate, response time, and customer ratings.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <CircularProgressBar score={analyticsData.sellerScore} />
                        <p className="mt-2 font-bold text-lg">Excellent</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* AI Insights & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> Smart Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {analyticsData.insights.map((insight, i) => (
                             <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${insight.bgColor}`}>
                                <insight.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${insight.color}`} />
                                <div>
                                    <p className="font-semibold text-sm">{insight.title}</p>
                                    <p className="text-xs text-muted-foreground">{insight.text}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Alerts & Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {analyticsData.alerts.map((alert, i) => (
                            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${alert.bgColor}`}>
                                <alert.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${alert.color}`} />
                                <div>
                                    <p className="font-semibold text-sm">{alert.title}</p>
                                    <p className="text-xs text-muted-foreground">{alert.text}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
