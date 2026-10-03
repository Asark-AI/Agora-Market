
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { generateAnalyticsInsights } from '@/app/super/ai/flows/generate-analytics-insights';
import type { Insight } from '@/app/super/ai/schemas/seller-insights';
import type { Seller } from '@/app/super/services/sellers';

interface AiInsightsProps {
    sellers: Seller[];
    loading: boolean;
}

const InsightIcon = ({ type }: { type: string }) => {
    switch(type) {
        case 'positive': return <TrendingUp className="h-5 w-5 text-green-500" />;
        case 'negative': return <TrendingDown className="h-5 w-5 text-red-500" />;
        default: return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
}

export function AiInsights({ sellers, loading }: AiInsightsProps) {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [aiLoading, setAiLoading] = useState(true);

    useEffect(() => {
        if (!loading && sellers.length > 0) {
            setAiLoading(true);
            generateAnalyticsInsights(sellers)
                .then(setInsights)
                .catch(console.error)
                .finally(() => setAiLoading(false));
        }
    }, [sellers, loading]);

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-primary" />
                    <CardTitle>AI-Powered Insights</CardTitle>
                </div>
                <CardDescription>Automated analysis of your platform data.</CardDescription>
            </CardHeader>
            <CardContent>
                {aiLoading || loading ? (
                     <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {insights.map((insight, index) => (
                            <div key={index} className="flex items-start gap-4">
                                <div className="p-2 bg-muted rounded-full">
                                    <InsightIcon type={insight.type} />
                                </div>
                                <div>
                                    <p className="font-semibold">{insight.title}</p>
                                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 { !aiLoading && !loading && insights.length === 0 && (
                     <div className="text-center py-10 text-muted-foreground">
                        <p>No significant insights found at this time.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
