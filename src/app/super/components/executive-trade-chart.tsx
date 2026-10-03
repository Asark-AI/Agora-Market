'use client';

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, Line, LineChart, ComposedChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/super/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/app/super/components/ui/chart';

// In a real app, this data would be fetched from your API
const chartData: any[] = [
    // Example: { month: 'January', imports: 186, exports: 80 },
];

const chartConfig = {
  imports: {
    label: 'Imports',
    color: 'hsl(var(--chart-1))',
  },
  exports: {
    label: 'Exports',
    color: 'hsl(var(--chart-2))',
  },
};

export function ExecutiveChart() {
  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="font-headline">Trade Overview</CardTitle>
        <CardDescription>Monthly Imports vs. Exports (in millions USD)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            {chartData.length > 0 ? (
                <ComposedChart data={chartData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis 
                        tickFormatter={(value) => `$${value}M`}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Legend />
                    <Bar dataKey="imports" fill="var(--color-imports)" radius={4} />
                    <Line type="monotone" dataKey="exports" stroke="var(--color-exports)" strokeWidth={2} dot={false} />
                </ComposedChart>
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <p className="text-muted-foreground">No trade data available.</p>
                </div>
            )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
