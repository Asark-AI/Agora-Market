
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/super/components/ui/card';
import { AlertTriangle, TrendingUp } from 'lucide-react';

const data = [
    { type: 'Unused', percentage: 60, color: 'bg-green-500' },
    { type: 'Used', percentage: 30, color: 'bg-orange-500' },
    { type: 'Reserved', percentage: 45, color: 'bg-green-500' }, // This seems wrong, should total 100
]

// Corrected data
const correctedData = [
    { type: 'Unused', percentage: 25, color: 'bg-green-500' },
    { type: 'Used', percentage: 60, color: 'bg-orange-500' },
    { type: 'Reserved', percentage: 15, color: 'bg-blue-500' },
]


export function CostForecast() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>30-day Cost Forecast</CardTitle>
        <div className="flex items-center gap-2 text-3xl font-bold">
            GHC3,890
            <span className="flex items-center gap-1 text-sm font-normal text-green-600">
                <TrendingUp className="h-4 w-4"/>
                12%
            </span>
        </div>
        <CardDescription>Projected spend for next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
             <div className="flex w-full h-3 rounded-full overflow-hidden">
                {correctedData.map((d) => (
                    <div key={d.type} className={d.color} style={{ width: `${d.percentage}%` }}/>
                ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500"/>Unused</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500"/>Used</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500"/>Reserved</div>
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-50 p-2 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4"/>
            Confidence: <span className="font-semibold">87%</span> vs last month
        </div>
      </CardContent>
    </Card>
  );
}
