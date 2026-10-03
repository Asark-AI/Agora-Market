
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTransactions, type Transaction } from '@/app/super/services/transactions';
import { getPayouts, type Payout } from '@/app/super/services/payouts';
import { getSellers, type Seller } from '@/app/super/services/sellers';
import { getExpenses, type Expense } from '@/app/super/services/expenses';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Badge } from '@/app/super/components/ui/badge';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { Input } from '@/app/super/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/super/components/ui/select';
import { Download, Search, DollarSign, CheckCircle, Clock, AlertCircle, TrendingUp, TrendingDown, Scale, HandCoins, PiggyBank, Eye, FileText, CalendarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/super/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/super/components/ui/popover';
import { Calendar } from '@/app/super/components/ui/calendar';
import { cn } from '@/app/super/lib/utils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';


const revenueExpenseData = [
  { month: 'Jan', revenue: 150000, expenses: 40000 },
  { month: 'Feb', revenue: 180000, expenses: 45000 },
  { month: 'Mar', revenue: 220000, expenses: 50000 },
  { month: 'Apr', revenue: 210000, expenses: 48000 },
  { month: 'May', revenue: 250000, expenses: 55000 },
  { month: 'Jun', revenue: 280000, expenses: 60000 },
  { month: 'Jul', revenue: 310000, expenses: 62000 },
  { month: 'Aug', revenue: 290000, expenses: 61000 },
  { month: 'Sep', revenue: 330000, expenses: 65000 },
  { month: 'Oct', revenue: 350000, expenses: 70000 },
  { month: 'Nov', revenue: 400000, expenses: 75000 },
  { month: 'Dec', revenue: 450000, expenses: 80000 },
];

const channelData = [
    { name: 'Web', revenue: 65000 },
    { name: 'Mobile App', revenue: 42000 },
    { name: 'API', revenue: 9500 },
];

const BUSINESS_TYPE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];


export default function FinancePage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [transactionFilter, setTransactionFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
    const [expenseDateFilter, setExpenseDateFilter] = useState<DateRange | undefined>();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [transData, payoutData, sellerData, expenseData] = await Promise.all([
                getTransactions(),
                getPayouts(),
                getSellers(),
                getExpenses(),
            ]);
            setTransactions(transData);
            setPayouts(payoutData);
            setSellers(sellerData);
            setExpenses(expenseData);
            setLoading(false);
        };
        fetchData();
    }, []);
    
    const handleUpdatePayoutStatus = (payoutId: string, newStatus: Payout['status']) => {
        setPayouts(currentPayouts =>
            currentPayouts.map(p => p.id === payoutId ? { ...p, status: newStatus } : p)
        );
    };

    const grossRevenue = transactions.filter(t => t.type === 'Sale').reduce((acc, t) => acc + t.amount, 0);
    const platformCommission = transactions.filter(t => t.type === 'Commission').reduce((acc, t) => acc + t.amount, 0);
    const sellerPayoutLiability = payouts.filter(p => p.status === 'Pending').reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = platformCommission - totalExpenses;
    
    const revenueByBusinessType = sellers.reduce((acc, seller) => {
        const type = seller.businessType;
        if (!acc[type]) {
            acc[type] = 0;
        }
        acc[type] += seller.revenue;
        return acc;
    }, {} as Record<string, number>);

    const businessTypeData = Object.entries(revenueByBusinessType).map(([name, value]) => ({ name, value }));

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Completed':
            case 'Paid':
                 return 'default';
            case 'Pending': 
            case 'Processing':
                return 'secondary';
            case 'Failed': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getPayoutStatusIcon = (status: string) => {
        switch(status) {
            case 'Paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'Pending':
            case 'Processing':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'Failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
            default: return null;
        }
    }
    
    const filteredTransactions = transactions.filter(t => {
        const typeMatch = transactionFilter === 'all' || t.type.toLowerCase() === transactionFilter;
        const searchMatch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.sellerId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (t.orderId && t.orderId.toLowerCase().includes(searchQuery.toLowerCase()));
        return typeMatch && searchMatch;
    });

     const filteredExpenses = useMemo(() => {
        return expenses
            .filter(expense => {
                const categoryMatch = expenseCategoryFilter === 'all' || expense.category === expenseCategoryFilter;
                const dateMatch = !expenseDateFilter || (
                    new Date(expense.date) >= (expenseDateFilter.from || new Date(0)) &&
                    new Date(expense.date) <= (expenseDateFilter.to || new Date())
                );
                return categoryMatch && dateMatch;
            });
    }, [expenses, expenseCategoryFilter, expenseDateFilter]);

    const uniqueExpenseCategories = useMemo(() => {
        if (loading) return [];
        const categories = expenses.map(e => e.category);
        return ['all', ...Array.from(new Set(categories))];
    }, [expenses, loading]);

    
    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return '';
        return `GHC${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Agora Finance Center</h1>
                    <p className="mt-2 text-muted-foreground">Dedicated financial operations hub for the Agora platform.</p>
                </div>
                <Button>
                    <Download className="mr-2 h-4 w-4" /> Export Financial Report
                </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Gross Revenue</CardTitle><Scale className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{formatCurrency(grossRevenue)}</div><p className="text-xs text-muted-foreground">+5.2% from last month</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Platform Commission</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{formatCurrency(platformCommission)}</div><p className="text-xs text-muted-foreground">+8.1% from last month</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Seller Payout Liability</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{formatCurrency(sellerPayoutLiability)}</div><p className="text-xs text-muted-foreground">3 payouts pending</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{formatCurrency(totalExpenses)}</div><p className="text-xs text-muted-foreground">+2.5% from last month</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Net Profit</CardTitle><PiggyBank className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{formatCurrency(netProfit)}</div><p className="text-xs text-muted-foreground">+12.3% from last month</p></CardContent>
                </Card>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Revenue & Expenses Trend</CardTitle>
                    <CardDescription>Last 12 months performance.</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueExpenseData}>
                            <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `GHC${Number(value)/1000}k`} />
                            <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Legend />
                            <Line type="monotone" dataKey="revenue" name="Gross Revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                            <Line type="monotone" dataKey="expenses" name="Total Expenses" stroke="hsl(var(--destructive))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Seller Payout Management</CardTitle>
                            <CardDescription>Manage and process payments to sellers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {loading ? <Skeleton className="h-[280px] w-full" /> : (
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Seller</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payouts.slice(0, 5).map(payout => (
                                            <TableRow key={payout.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={payout.sellerAvatar.src} alt={payout.sellerName} data-ai-hint={payout.sellerAvatar.hint} />
                                                            <AvatarFallback>{payout.sellerName.substring(0,1)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-sm">{payout.sellerName}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">{payout.sellerId}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">{payout.payoutPeriod}</TableCell>
                                                <TableCell className="text-xs">{payout.paymentMethod}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getPayoutStatusIcon(payout.status)}
                                                        <span className="text-xs">{payout.status}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(payout.amount)}</TableCell>
                                                <TableCell className="text-right">
                                                    {payout.status === 'Pending' && (
                                                        <Button size="sm" onClick={() => handleUpdatePayoutStatus(payout.id, 'Processing')}>Process</Button>
                                                    )}
                                                    {payout.status === 'Processing' && (
                                                         <Button size="sm" onClick={() => handleUpdatePayoutStatus(payout.id, 'Paid')}>Approve</Button>
                                                    )}
                                                    {payout.status === 'Paid' && (
                                                         <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                 </Table>
                             )}
                        </CardContent>
                    </Card>
                 </div>
                 <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Business Type</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={businessTypeData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        outerRadius={100} 
                                        label={(entry) => `${(entry.percent * 100).toFixed(0)}%`}
                                    >
                                        {businessTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={BUSINESS_TYPE_COLORS[index % BUSINESS_TYPE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                 </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Transaction Ledger</CardTitle>
                    <CardDescription>An immutable audit trail of all financial transactions on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by Ref ID, Seller ID, or Order ID..." 
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                        </div>
                        <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="sale">Sale</SelectItem>
                                <SelectItem value="refund">Refund</SelectItem>
                                <SelectItem value="commission">Commission</SelectItem>
                                <SelectItem value="payout">Payout</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     {loading ? <Skeleton className="h-64 w-full" /> : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reference ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.slice(0,10).map(tx => {
                                    const isDebit = tx.type === 'Payout' || tx.type === 'Refund';
                                    const description = tx.type === 'Sale' || tx.type === 'Refund' ? `Order ${tx.orderId}` : 
                                                        tx.type === 'Commission' ? `Commission on Order ${tx.orderId}` : `Payout to Seller ${tx.sellerId}`;
                                    
                                    return (
                                        <TableRow key={tx.id}>
                                            <TableCell className="text-xs">{new Date(tx.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                                            <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
                                            <TableCell className="text-xs">{description}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(tx.status) as any}>{tx.status}</Badge></TableCell>
                                            <TableCell className="text-right font-mono text-red-600">{isDebit ? formatCurrency(tx.amount) : ''}</TableCell>
                                            <TableCell className="text-right font-mono text-green-600">{!isDebit ? formatCurrency(tx.amount) : ''}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                         </Table>
                     )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Expense Management</CardTitle>
                    <CardDescription>Track and categorize all operational expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueExpenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full md:w-[300px] justify-start text-left font-normal",
                                        !expenseDateFilter && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expenseDateFilter?.from ? (
                                        expenseDateFilter.to ? (
                                            <>{format(expenseDateFilter.from, "LLL dd, y")} - {format(expenseDateFilter.to, "LLL dd, y")}</>
                                        ) : (
                                            format(expenseDateFilter.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Filter by date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={expenseDateFilter?.from}
                                    selected={expenseDateFilter}
                                    onSelect={setExpenseDateFilter}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     {loading ? <Skeleton className="h-64 w-full" /> : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredExpenses.map(expense => (
                                    <TableRow key={expense.id}>
                                        <TableCell className="text-xs">{new Date(expense.date).toLocaleDateString()}</TableCell>
                                        <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                                        <TableCell className="text-sm">{expense.description}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(expense.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">
                                                <FileText className="mr-2 h-3 w-3" />
                                                View Receipt
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Revenue by Sales Channel</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={channelData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `GHC${Number(value)/1000}k`}/>
                            <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

        </div>
    );
}
    
