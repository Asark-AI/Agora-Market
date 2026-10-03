
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCampaigns, type Campaign } from '@/app/super/services/campaigns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/super/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Badge } from '@/app/super/components/ui/badge';
import { Button } from '@/app/super/components/ui/button';
import { Progress } from '@/app/super/components/ui/progress';
import { MoreHorizontal, Plus, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/app/super/components/ui/dropdown-menu';
import { Skeleton } from '@/app/super/components/ui/skeleton';

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchCampaigns = async () => {
            const data = await getCampaigns();
            setCampaigns(data);
            setLoading(false);
        };
        fetchCampaigns();
    }, []);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Completed': return 'secondary';
            case 'Planned': return 'outline';
            case 'Paused': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Campaign Management</h1>
                    <p className="mt-2 text-muted-foreground">Create, track, and analyze your marketing campaigns.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => alert('Exporting campaigns...')}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button onClick={() => router.push('/super/app/dashboard/marketing/campaigns/new')}>
                        <Plus className="mr-2 h-4 w-4" /> Create Campaign
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>All Campaigns</CardTitle>
                    <CardDescription>An overview of all your marketing campaigns.</CardDescription>
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
                                    <TableHead>Campaign</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Timeline</TableHead>
                                    <TableHead>Budget Usage</TableHead>
                                    <TableHead>Performance</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((campaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">{campaign.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(campaign.status) as any}>{campaign.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm">GHC{campaign.spent.toLocaleString()} / GHC{campaign.budget.toLocaleString()}</span>
                                                <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">CTR: {campaign.performance.ctr}%</div>
                                            <div className="text-sm text-muted-foreground">Conversions: {campaign.performance.conversions.toLocaleString()}</div>
                                        </TableCell>
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
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                                                    <DropdownMenuItem>Duplicate Campaign</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600">Pause Campaign</DropdownMenuItem>
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
