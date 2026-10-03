
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Users2, Mail, Send, Plus, MoreHorizontal, Eye, Copy, PenSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Badge } from '@/app/super/components/ui/badge';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { getEmailCampaigns, type EmailCampaign, getAudienceSegments, type AudienceSegment, getEmailTemplates, type EmailTemplate } from '@/app/super/services/emails';

export default function EmailManagerPage() {
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [segments, setSegments] = useState<AudienceSegment[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [campaignData, segmentData, templateData] = await Promise.all([
                getEmailCampaigns(),
                getAudienceSegments(),
                getEmailTemplates(),
            ]);
            setCampaigns(campaignData);
            setSegments(segmentData);
            setTemplates(templateData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Sent': return 'default';
            case 'Draft': return 'secondary';
            case 'Scheduled': return 'outline';
            default: return 'secondary';
        }
    };

    const totalSubscribers = segments.reduce((acc, seg) => acc + seg.count, 0);
    const avgOpenRate = campaigns.length > 0 ? campaigns.reduce((acc, c) => acc + c.openRate, 0) / campaigns.length : 0;
    const avgClickRate = campaigns.length > 0 ? campaigns.reduce((acc, c) => acc + c.clickRate, 0) / campaigns.length : 0;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Email Marketing</h1>
                    <p className="mt-2 text-muted-foreground">Manage your email campaigns, audiences, and templates.</p>
                </div>
                <Button>
                    <Send className="mr-2 h-4 w-4" /> Create Email Campaign
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Total Subscribers <Users2 className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalSubscribers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+5.2% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Avg. Open Rate <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{avgOpenRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">+1.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Avg. Click Rate <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{avgClickRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">-0.5% from last month</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Email Campaigns</CardTitle>
                    <CardDescription>An overview of your recent email campaigns.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campaign</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Sent / Goal</TableHead>
                                    <TableHead>Open Rate</TableHead>
                                    <TableHead>Click Rate</TableHead>
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
                                        <TableCell>{campaign.sent.toLocaleString()} / {campaign.goal.toLocaleString()}</TableCell>
                                        <TableCell>{campaign.openRate.toFixed(1)}%</TableCell>
                                        <TableCell>{campaign.clickRate.toFixed(1)}%</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">View Report</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Audience Segments</CardTitle>
                        <CardDescription>Manage your customer segments for targeted emails.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {loading ? (
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                        ) : (
                            segments.map(segment => (
                                <div key={segment.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <p className="font-semibold">{segment.name}</p>
                                        <p className="text-sm text-muted-foreground">{segment.count.toLocaleString()} subscribers</p>
                                    </div>
                                    <Button variant="outline" size="sm">View</Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Email Templates</CardTitle>
                        <CardDescription>Create and manage reusable email templates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                        ) : (
                            templates.map(template => (
                                <div key={template.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <p className="font-semibold">{template.name}</p>
                                        <p className="text-sm text-muted-foreground">Last updated: {template.lastUpdated}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><PenSquare className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))
                        )}
                         <Button variant="outline" className="w-full mt-4">
                            <Plus className="mr-2 h-4 w-4" /> Create New Template
                        </Button>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
