
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/super/components/ui/card';
import { Badge } from '@/app/super/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Group A', value: 75, color: '#f97316' }, // orange
  { name: 'Group B', value: 25, color: '#22c55e' }, // green
  { name: 'Group C', value: 50, color: '#3b82f6' }, // blue
];
const totalValue = data.reduce((acc, item) => acc + item.value, 0);
const policyCoverage = 94;

const items = [
    { name: 'Data Privacy (DAT-001)', status: 'Active' },
    { name: 'Approval Gates (APR-002)', status: 'Active' },
    { name: 'Security Training (SEC-003)', status: 'Draft' },
]

export function CompliancePulse() {
  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Compliance pulse</CardTitle>
        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={450}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={10}
                    >
                        {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Policy Coverage</p>
                <p className="text-4xl font-bold">{policyCoverage}%</p>
            </div>
        </div>
        <div className="w-full space-y-2 mt-6">
            {items.map(item => (
                 <div key={item.name} className="flex justify-between items-center text-sm p-2 rounded-md">
                    <span>{item.name}</span>
                    <Badge variant={item.status === 'Active' ? 'default' : 'secondary'} className={item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{item.status}</Badge>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
