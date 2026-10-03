
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Switch } from '@/app/super/components/ui/switch';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { getAutomations, type Automation } from '@/app/super/services/automations';
import { Plus } from 'lucide-react';
import { Badge } from '@/app/super/components/ui/badge';

export default function AutomationsPage() {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getAutomations();
            setAutomations(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const getStatusVariant = (status: string) => {
        return status === 'Active' ? 'default' : 'secondary';
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Marketing Automations</h1>
                    <p className="mt-2 text-muted-foreground">Set up and manage automated workflows to engage customers.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Automation
                </Button>
            </div>

            {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {automations.map((automation) => (
                        <Card key={automation.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <automation.icon className="h-6 w-6 text-muted-foreground" />
                                        <CardTitle className="text-lg">{automation.title}</CardTitle>
                                    </div>
                                    <Badge variant={getStatusVariant(automation.status)}>
                                        {automation.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-between">
                                <CardDescription className="mb-4">{automation.description}</CardDescription>
                                <div className="flex justify-between items-center">
                                    <Switch
                                        checked={automation.status === 'Active'}
                                        onCheckedChange={(checked) => {
                                            setAutomations(current =>
                                                current.map(a =>
                                                    a.id === automation.id
                                                        ? { ...a, status: checked ? 'Active' : 'Inactive' }
                                                        : a
                                                )
                                            );
                                        }}
                                        aria-label={`Activate ${automation.title}`}
                                    />
                                    <Button variant="outline">Configure</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
