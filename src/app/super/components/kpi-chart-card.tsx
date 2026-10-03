
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/super/components/ui/card';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Button } from './ui/button';

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  chartType?: 'bar' | 'line' | 'area';
  chartData: number[];
}

export function KpiChartCard({ title, value, change, changeType, chartType = 'bar', chartData }: KpiCardProps) {
  const isIncrease = changeType === 'increase';
  const data = chartData.map((v, i) => ({ name: `D${i}`, value: v }));
  
  const ChartComponent = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart;
  const chartGraph = chartType === 'line'
    ? <Line dataKey="value" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
    : chartType === 'area'
      ? <Area dataKey="value" fill="var(--color-chart-1)" stroke="var(--color-chart-1)" strokeWidth={2} />
      : <Bar dataKey="value" className="fill-primary" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mt-2 -mr-2"><MoreHorizontal className="h-4 w-4"/></Button>
        </div>
        <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{value}</p>
            <span className={`flex items-center text-sm font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                {isIncrease ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {change}
            </span>
        </div>
        <CardDescription>Compare from last 24hrs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
                 <ChartComponent data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                    {chartGraph}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
