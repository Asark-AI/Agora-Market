
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Badge } from '@/app/super/components/ui/badge';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { getInfluencers, type Influencer } from '@/app/super/services/influencers';
import { Plus, Users, DollarSign, TrendingUp, Link as LinkIcon, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/app/super/components/ui/dropdown-menu';

export default function InfluencerPage() {
    const [influencers, setInfluencers] = useState<Influencer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const influencersData = await getInfluencers();
            setInfluencers(influencersData);
            setLoading(false);
        };
        fetchData();
    }, []);
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Pending': return 'secondary';
            case 'On Hold': return 'destructive';
            default: return 'secondary';
        }
    };
    
    const totalCommissions = influencers.reduce((acc, i) => acc + i.commission, 0);
    const topPerformer = !loading && influencers.length > 0 
        ? influencers.reduce((prev, current) => (prev.totalSales > current.totalSales) ? prev : current)
        : null;


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Influencer Marketing</h1>
                    <p className="mt-2 text-muted-foreground">Manage your influencer and affiliate partnerships.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Influencer
                </Button>
            </div>

             <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Total Affiliates <Users className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{influencers.length}</div>
                        <p className="text-xs text-muted-foreground">+3 since last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                           Commissions Paid (YTD) <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">GHC{totalCommissions.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+15% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Top Performer <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-3/4" /> : (
                            <>
                                <div className="text-3xl font-bold">{topPerformer?.name || 'N/A'}</div>
                                <p className="text-xs text-muted-foreground">
                                    {topPerformer ? `GHC${topPerformer.totalSales.toLocaleString()} in sales` : ''}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Influencer Directory</CardTitle>
                    <CardDescription>An overview of all your influencer partners.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Influencer</TableHead>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Followers</TableHead>
                                    <TableHead>Commission</TableHead>
                                    <TableHead>Total Sales</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {influencers.map((influencer) => (
                                    <TableRow key={influencer.id}>
                                        <TableCell>
                                             <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={influencer.avatar.src} alt={influencer.name} data-ai-hint={influencer.avatar.hint} />
                                                    <AvatarFallback>{influencer.name.substring(0, 1)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{influencer.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{influencer.channel}</TableCell>
                                        <TableCell>{(influencer.followers / 1000).toFixed(1)}k</TableCell>
                                        <TableCell>{influencer.commissionRate}%</TableCell>
                                        <TableCell>GHC{influencer.totalSales.toLocaleString()}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(influencer.status) as any}>{influencer.status}</Badge></TableCell>
                                        <TableCell>
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                    <DropdownMenuItem>Generate Link</DropdownMenuItem>
                                                    <DropdownMenuItem>View Performance</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
