
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/super/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Badge } from '@/app/super/components/ui/badge';

const runs = [
    { name: 'Claims-Checker', time: '2 min ago', latency: '2.5s', status: 'Live' },
    { name: 'KYC-Validator', time: '5 min ago', latency: '1.2s', status: 'Live' },
    { name: 'Fraud-Monitor', time: '2 min ago', latency: '3.8s', status: 'Closed' },
    { name: 'Swift-Analyzer', time: '10 min ago', latency: '1.2s', status: 'Live' },
]

export function LiveRunsStream() {
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Live': return 'default';
            case 'Closed': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Live Runs Stream</CardTitle>
                    <Badge variant="secondary">Last 50</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Latency</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {runs.map(run => (
                            <TableRow key={run.name}>
                                <TableCell className="font-medium">{run.name}</TableCell>
                                <TableCell>{run.time}</TableCell>
                                <TableCell>{run.latency}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={getStatusVariant(run.status) as any}
                                        className={run.status === 'Live' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                    >
                                    <span className={`mr-2 h-2 w-2 rounded-full ${run.status === 'Live' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {run.status}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
