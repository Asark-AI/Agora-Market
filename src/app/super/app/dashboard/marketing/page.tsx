
'use client';

import { DollarSign, Megaphone, BarChart, ArrowUpRight, ArrowDownRight, Plus, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Badge } from '@/app/super/components/ui/badge';
import { Progress } from '@/app/super/components/ui/progress';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { getCampaigns, type Campaign } from '@/app/super/services/campaigns';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { useRouter } from 'next/navigation';

const budgetData = [
  { name: 'Google Ads', spend: 4500, budget: 6000 },
  { name: 'Facebook', spend: 3200, budget: 4000 },
  { name: 'TikTok', spend: 2800, budget: 5000 },
  { name: 'Influencers', spend: 5000, budget: 5000 },
  { name: 'Email', spend: 1200, budget: 1500 },
];

export default function MarketingPage() {
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

    const totalBudget = campaigns.reduce((acc, c) => acc + c.budget, 0);
    const totalSpent = campaigns.reduce((acc, c) => acc + c.spent, 0);
    const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0);
    const overallRoas = totalSpent > 0 ? (totalRevenue / totalSpent) : 0;
    const totalConversions = campaigns.reduce((acc, c) => acc + c.performance.conversions, 0);
    const overallCpa = totalConversions > 0 ? totalSpent / totalConversions : 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-bold tracking-tight">Marketing Hub</h1>
            <p className="mt-2 text-muted-foreground">
                Manage campaigns, track spending, and analyze performance.
            </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><Download className="mr-2 h-4 w-4"/> Generate Report</Button>
            <Button onClick={() => router.push('/super/app/dashboard/marketing/campaigns/new')}><Plus className="mr-2 h-4 w-4"/> New Campaign</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">GHC{totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
                out of GHC{totalBudget.toLocaleString()} budgeted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Overall ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallRoas.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average CPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">GHC{overallCpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">-3.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{campaigns.filter(c => c.status === 'Active').length}</div>
            <p className="text-xs text-muted-foreground">{campaigns.length} total campaigns</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Budget vs. Spend by Channel</CardTitle>
                <CardDescription>Monthly breakdown of marketing channel expenses.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={budgetData} layout="vertical" margin={{ left: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs uppercase text-muted-foreground">Spend</span>
                                            <span className="font-bold text-foreground">GHC{payload[0].value?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs uppercase text-muted-foreground">Budget</span>
                                            <span className="font-bold text-muted-foreground">GHC{payload[1].payload.budget.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    </div>
                                )
                                }
                                return null
                            }}
                        />
                        <Legend />
                        <Bar dataKey="spend" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} name="Spend" />
                        <Bar dataKey="budget" stackId="a" fill="hsl(var(--primary) / 0.2)" radius={[4, 4, 4, 4]} name="Budget" />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Campaign Overview</CardTitle>
                <CardDescription>Performance of all marketing campaigns.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Spend</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>ROAS</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.slice(0, 5).map((campaign) => {
                            const roas = campaign.spent > 0 ? ((campaign.revenue || 0) / campaign.spent) : 0;
                            return (
                            <TableRow key={campaign.id}>
                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                <TableCell>GHC{campaign.spent.toLocaleString()}</TableCell>
                                <TableCell>GHC{(campaign.revenue || 0).toLocaleString()}</TableCell>
                                <TableCell>{roas.toFixed(2)}x</TableCell>
                                <TableCell>
                                    <Badge variant={campaign.status === 'Active' ? 'default' : 'secondary'}>{campaign.status}</Badge>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
