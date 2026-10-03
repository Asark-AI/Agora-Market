'use client';

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/super/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/app/super/components/ui/chart';

const chartData = [
  { region: 'Accra', orders: 1250 },
  { region: 'Kumasi', orders: 980 },
  { region: 'Takoradi', orders: 750 },
  { region: 'Cape C.', orders: 620 },
  { region: 'Tamale', orders: 450 },
];

const chartConfig = {
  orders: {
    label: 'Orders',
    color: 'hsl(var(--chart-2))',
  },
};

export function ExecutiveTradeChart() {
  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="font-headline">Orders by Region</CardTitle>
        <CardDescription>Top performing regions by order volume.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            {chartData.length > 0 ? (
                <BarChart data={chartData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="region"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                    />
                    <YAxis />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Legend />
                    <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
                </BarChart>
            ) : (
                <div className="flex h-[250px] w-full items-center justify-center">
                    <p className="text-muted-foreground">No regional data available.</p>
                </div>
            )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
