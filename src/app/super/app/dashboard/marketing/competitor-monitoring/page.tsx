
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Badge } from '@/app/super/components/ui/badge';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { getCompetitors, type Competitor } from '@/app/super/services/competitors';
import { Plus, Eye, TrendingUp, Tag, Percent, ArrowUp, ArrowDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';

export default function CompetitorMonitoringPage() {
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getCompetitors();
            setCompetitors(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const totalTracked = competitors.length;
    const activePromos = competitors.reduce((acc, c) => acc + c.promotions.length, 0);

    const getPricingVariant = (pricing: string) => {
        switch (pricing) {
            case 'Higher': return 'destructive';
            case 'Lower': return 'default';
            default: return 'secondary';
        }
    };
    
    const getPricingIcon = (pricing: string) => {
        switch (pricing) {
            case 'Higher': return <ArrowUp className="h-3 w-3" />;
            case 'Lower': return <ArrowDown className="h-3 w-3" />;
            default: return null;
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Competitor Watch</h1>
                    <p className="mt-2 text-muted-foreground">Monitor competitor pricing, products, and promotions.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Competitor
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Tracked Competitors <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalTracked}</div>
                        <p className="text-xs text-muted-foreground">Across all markets</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                           Active Promotions <Tag className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{activePromos}</div>
                        <p className="text-xs text-muted-foreground">Live promotions being tracked</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Average Price Difference <Percent className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">-3.5%</div>
                        <p className="text-xs text-muted-foreground">Our average price vs. theirs</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Competitor Overview</CardTitle>
                    <CardDescription>A summary of key competitor metrics and activities.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Competitor</TableHead>
                                    <TableHead>Last Activity</TableHead>
                                    <TableHead>Pricing</TableHead>
                                    <TableHead>Active Promotions</TableHead>
                                    <TableHead>SEO Rank</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {competitors.map((comp) => (
                                    <TableRow key={comp.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={comp.avatar.src} alt={comp.name} data-ai-hint={comp.avatar.hint} />
                                                    <AvatarFallback>{comp.name.substring(0, 1)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{comp.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{comp.lastActivity}</TableCell>
                                        <TableCell>
                                            <Badge variant={getPricingVariant(comp.pricing) as any} className="gap-1">
                                                {getPricingIcon(comp.pricing)} {comp.pricing}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{comp.promotions.join(', ')}</TableCell>
                                        <TableCell>{comp.seoRank}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">View Details</Button>
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
