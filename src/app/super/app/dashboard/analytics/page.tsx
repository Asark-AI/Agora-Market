
'use client';

import { useState, useEffect } from 'react';
import { getUsers, type User } from '@/app/super/services/users';
import { getProducts, type Product } from '@/app/super/services/products';
import { getSellers, type Seller } from '@/app/super/services/sellers';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';
import { Button } from '@/app/super/components/ui/button';
import { Download, Users as UsersIcon, ShoppingCart, CheckCircle, Package } from 'lucide-react';
import { Badge } from '@/app/super/components/ui/badge';
import { AiInsights } from '@/app/super/components/ai-insights';

const salesData = [
  { name: 'Jan', sales: 4000 }, { name: 'Feb', sales: 3000 }, { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 4500 }, { name: 'May', sales: 6000 }, { name: 'Jun', sales: 5500 },
  { name: 'Jul', sales: 7000 }, { name: 'Aug', sales: 6500 }, { name: 'Sep', sales: 7500 },
  { name: 'Oct', sales: 8000 }, { name: 'Nov', sales: 9500 }, { name: 'Dec', sales: 11000 },
];

const channelData = [
    { name: 'Web', sales: 65000 },
    { name: 'Mobile App', sales: 42000 },
    { name: 'In-Store', sales: 18000 },
    { name: 'API', sales: 9500 },
]

const CATEGORY_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const REVENUE_SHARE_COLORS = ['hsl(var(--chart-2))', 'hsl(var(--chart-1))'];


export default function AnalyticsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [usersData, productsData, sellersData] = await Promise.all([
                getUsers(),
                getProducts(),
                getSellers(),
            ]);
            setUsers(usersData);
            setProducts(productsData);
            setSellers(sellersData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const totalRevenue = sellers.reduce((acc, seller) => acc + seller.revenue, 0);
    const totalCustomers = users.length;
    const totalProducts = products.length;
    const totalSellers = sellers.length;
    const pendingProducts = products.filter(p => p.status === 'Pending').length;

    const topProducts = [...products]
        .sort((a,b) => b.price * b.stock - a.price * a.stock) // Mocking revenue with price * stock
        .slice(0, 5)
        .map(p => ({ name: p.name, revenue: p.price * (10 + Math.floor(Math.random() * 50)) })); // Mock revenue
        
    const categoryData = products.reduce((acc, product) => {
        const existing = acc.find(item => item.name === product.category);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: product.category, value: 1 });
        }
        return acc;
    }, [] as {name: string, value: number}[]);

    // Assuming a 15% platform commission
    const agoraShare = totalRevenue * 0.15;
    const sellerShare = totalRevenue * 0.85;
    const revenueShareData = [
        { name: "Sellers' Share", value: sellerShare },
        { name: "Agora's Share", value: agoraShare },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Platform Analytics</h1>
                    <p className="mt-2 text-muted-foreground">Comprehensive insights into customers, products, and sellers.</p>
                </div>
                 <Button>
                    <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">GHC{totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+8.5% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Customers</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">+120 this month</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Products</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalProducts}</div>
                         <p className="text-xs text-muted-foreground">across all sellers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Sellers</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalSellers}</div>
                        <p className="text-xs text-muted-foreground">+5 new this month</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Approvals</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{pendingProducts}</div>
                        <p className="text-xs text-muted-foreground">products awaiting review</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Over Time</CardTitle>
                            <CardDescription>Revenue trend for the past 12 months.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                 </div>
                 <div>
                    <AiInsights sellers={sellers} loading={loading} />
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
               <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Top Selling Products</CardTitle>
                         <CardDescription>Highest revenue-generating products this month.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={150} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value) => `GHC${Number(value).toLocaleString()}`}/>
                                <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Top Sellers</CardTitle>
                        <CardDescription>Your most valuable sellers by total revenue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-[350px] w-full" /> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Seller</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sellers.sort((a,b) => b.revenue - a.revenue).slice(0, 5).map(seller => (
                                        <TableRow key={seller.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={seller.avatar.src} alt={seller.name} data-ai-hint={seller.avatar.hint} />
                                                        <AvatarFallback>{seller.name.substring(0,1)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{seller.name}</p>
                                                        <p className="text-xs text-muted-foreground">{seller.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={seller.status === 'Active' ? 'default' : 'secondary'}>{seller.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">GHC{seller.revenue.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Revenue Share Breakdown</CardTitle>
                        <CardDescription>Agora platform vs. seller revenue.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={revenueShareData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={80} 
                                    label={(entry) => `${(entry.percent * 100).toFixed(0)}%`}
                                >
                                    {revenueShareData.map((entry, index) => <Cell key={`cell-${index}`} fill={REVENUE_SHARE_COLORS[index % REVENUE_SHARE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => `GHC${Number(value).toLocaleString()}`} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Sales by Channel</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={channelData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `GHC${Number(value)/1000}k`}/>
                                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <Card className="lg:col-span-5">
                    <CardHeader>
                        <CardTitle>Product Category Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
             </div>

        </div>
    );
}
