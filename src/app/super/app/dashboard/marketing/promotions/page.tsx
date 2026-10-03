
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Badge } from '@/app/super/components/ui/badge';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { getPromotions, type Promotion } from '@/app/super/services/promotions';
import { Plus, Tag, TrendingUp, BarChart } from 'lucide-react';

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getPromotions();
            setPromotions(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Expired': return 'secondary';
            case 'Scheduled': return 'outline';
            default: return 'secondary';
        }
    };

    const activeCodes = promotions.filter(p => p.status === 'Active').length;
    const totalRedemptions = promotions.reduce((acc, p) => acc + p.redemptions, 0);
    const discountedRevenue = promotions.reduce((acc, p) => acc + p.revenueGenerated, 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Promotions & Discounts</h1>
                    <p className="mt-2 text-muted-foreground">Create and manage discount codes to drive sales.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Promotion
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Active Codes <Tag className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{activeCodes}</div>
                        <p className="text-xs text-muted-foreground">Total active promotions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                           Total Redemptions <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalRedemptions.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Across all promotions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Discounted Revenue <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="text-3xl font-bold">GHC{discountedRevenue.toLocaleString()}</div>
                         <p className="text-xs text-muted-foreground">Revenue from orders with discounts</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>All Promotions</CardTitle>
                    <CardDescription>An overview of all your discount codes.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Redemptions</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {promotions.map((promo) => (
                                    <TableRow key={promo.id}>
                                        <TableCell className="font-mono font-medium">{promo.code}</TableCell>
                                        <TableCell>{promo.type}</TableCell>
                                        <TableCell>{promo.type === 'Percentage' ? `${promo.value}%` : `GHC${promo.value.toFixed(2)}`}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(promo.status) as any}>{promo.status}</Badge></TableCell>
                                        <TableCell>{promo.redemptions.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">GHC{promo.revenueGenerated.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edit</Button>
                                        </TableCell>
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
