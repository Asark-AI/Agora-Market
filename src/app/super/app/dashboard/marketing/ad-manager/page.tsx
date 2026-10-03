
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { getAdPlatforms, AdPlatform } from '@/app/super/services/ads';
import { DollarSign, BarChart, Target, Plus, TrendingUp, Download } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Simple icons for ad platforms
const PlatformIcon = ({ platform }: { platform: string }) => {
    // In a real app, you might use SVGs or an icon library
    const colors: {[key: string]: string} = {
        'Google': 'text-red-500',
        'Facebook': 'text-blue-600',
        'TikTok': 'text-black',
        'Snapchat': 'text-yellow-400',
    }
    return <Target className={`h-8 w-8 ${colors[platform] || 'text-gray-400'}`} />
}

export default function AdManagerPage() {
    const [platforms, setPlatforms] = useState<AdPlatform[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getAdPlatforms();
            setPlatforms(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const totalSpend = platforms.reduce((acc, p) => acc + p.spend, 0);
    const totalRevenue = platforms.reduce((acc, p) => acc + p.revenue, 0);
    const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const topChannel = !loading && platforms.length > 0
        ? platforms.reduce((prev, current) => (prev.roas > current.roas) ? prev : current)
        : null;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Ad Manager</h1>
                    <p className="mt-2 text-muted-foreground">Track ad spend and performance across all channels.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Connect Channel
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Total Ad Spend <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">GHC{totalSpend.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+5% vs last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Overall ROAS <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{overallRoas.toFixed(2)}x</div>
                        <p className="text-xs text-muted-foreground">-0.2 from last month</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                           Top Channel <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-3/4" /> : (
                             <>
                                <div className="text-3xl font-bold">{topChannel?.name || 'N/A'}</div>
                                <p className="text-xs text-muted-foreground">
                                    {topChannel ? `${topChannel.roas.toFixed(2)}x ROAS` : ''}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Channel Connections</CardTitle>
                        <CardDescription>Connect and manage your ad platforms.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />) :
                         platforms.map(platform => (
                            <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <PlatformIcon platform={platform.name} />
                                    <div>
                                        <p className="font-semibold">{platform.name}</p>
                                        <p className={`text-sm ${platform.status === 'Connected' ? 'text-green-600' : 'text-muted-foreground'}`}>{platform.status}</p>
                                    </div>
                                </div>
                                <Button variant={platform.status === 'Connected' ? 'secondary' : 'default'}>
                                    {platform.status === 'Connected' ? 'Manage' : 'Connect'}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>ROAS by Channel</CardTitle>
                        <CardDescription>Return on Ad Spend comparison.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={platforms}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}x`} />
                                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                                <Bar dataKey="roas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Performance Breakdown</CardTitle>
                    <CardDescription>Detailed metrics for each connected ad platform.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? <Skeleton className="h-48 w-full" /> : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Spend</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">ROAS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {platforms.map(platform => (
                                    <TableRow key={platform.id}>
                                        <TableCell className="font-medium">{platform.name}</TableCell>
                                        <TableCell>{platform.status}</TableCell>
                                        <TableCell className="text-right">GHC{platform.spend.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">GHC{platform.revenue.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold">{platform.roas.toFixed(2)}x</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                     )}
                </CardContent>
            </Card>

        </div>
    );
}
