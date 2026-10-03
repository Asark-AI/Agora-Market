
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Badge } from '@/app/super/components/ui/badge';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { getTickets, type SupportTicket } from '@/app/super/services/tickets';
import { getStaff, type StaffMember } from '@/app/super/services/staff';
import { Ticket, Clock, ShieldAlert, Smile, MoreHorizontal, Plus, User, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/super/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/app/super/components/ui/avatar';
import { Separator } from '@/app/super/components/ui/separator';
import { Textarea } from '@/app/super/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/super/components/ui/select';
import { Label } from '@/app/super/components/ui/label';
import { formatDistanceToNow } from 'date-fns';


const PRIORITY_COLORS = {
    'Low': '#22c55e',
    'Medium': '#f97316',
    'High': '#ef4444',
    'Urgent': '#b91c1c',
};

export default function CustomerServicePage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [ticketsData, staffData] = await Promise.all([
                getTickets(),
                getStaff(),
            ]);
            setTickets(ticketsData);
            setStaff(staffData);
            setLoading(false);
        };
        fetchData();
    }, []);
    
    const handleUpdateTicket = (ticketId: string, updates: Partial<SupportTicket>) => {
        const updatedTicket = { ...updates, lastUpdated: new Date().toISOString() };
        setTickets(currentTickets => currentTickets.map(t => t.id === ticketId ? { ...t, ...updatedTicket } : t));
        if (selectedTicket && selectedTicket.id === ticketId) {
            setSelectedTicket(prev => prev ? { ...prev, ...updatedTicket } : null);
        }
    };

    const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const pendingEscalations = tickets.filter(t => t.priority === 'Urgent' && t.status !== 'Resolved' && t.status !== 'Closed').length;
    const avgResponseTime = "2h 15m"; // Mock data
    const csat = 92.5; // Mock data
    
    const supportStaff = staff.filter(s => s.department === 'Customer Service');

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Open': return 'default';
            case 'In Progress': return 'secondary';
            case 'Resolved': return 'outline';
            case 'Closed': return 'destructive';
            default: return 'secondary';
        }
    };
    
    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case 'Urgent': return 'destructive';
            case 'High': return 'default';
            case 'Medium': return 'secondary';
            case 'Low': return 'outline';
            default: return 'secondary';
        }
    };

    const priorityData = Object.entries(
        tickets.reduce((acc, ticket) => {
            acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));
    
    const isSlaBreached = (ticket: SupportTicket): boolean => {
        if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
            return false;
        }
        const lastUpdated = new Date(ticket.lastUpdated);
        const hoursSinceUpdate = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        return hoursSinceUpdate > 24;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Customer Service Hub</h1>
                    <p className="mt-2 text-muted-foreground">Monitor support tickets and team performance.</p>
                </div>
                 <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Ticket
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Open Tickets <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : openTickets}</div>
                        <p className="text-xs text-muted-foreground">{tickets.length} total tickets this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Avg. Response Time <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-24" /> : avgResponseTime}</div>
                        <p className="text-xs text-muted-foreground">-5% from last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Pending Escalations <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : pendingEscalations}</div>
                        <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            CSAT Score <Smile className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-20" /> : `${csat}%`}</div>
                        <p className="text-xs text-muted-foreground">+1.2% from last month</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Support Tickets</CardTitle>
                            <CardDescription>Overview of all incoming customer support tickets.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Agent</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tickets.map((ticket) => (
                                            <TableRow key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
                                                <TableCell className="font-medium">{ticket.customer.name}</TableCell>
                                                <TableCell className="truncate max-w-xs">{ticket.subject}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getPriorityVariant(ticket.priority) as any}>{ticket.priority}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(ticket.status) as any}>{ticket.status}</Badge>
                                                </TableCell>
                                                <TableCell>{ticket.agent}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                    {isSlaBreached(ticket) && <ShieldAlert className="h-4 w-4 text-destructive" />}
                                                    <span className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(ticket.lastUpdated), { addSuffix: true })}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}>View</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                 <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tickets by Priority</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} label>
                                        {priorityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Common Issues</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between"><span>Login Issues</span><span className="font-semibold">25%</span></div>
                             <div className="flex justify-between"><span>Order Tracking</span><span className="font-semibold">20%</span></div>
                              <div className="flex justify-between"><span>Return/Refund</span><span className="font-semibold">18%</span></div>
                               <div className="flex justify-between"><span>Product Question</span><span className="font-semibold">15%</span></div>
                                <div className="flex justify-between"><span>Other</span><span className="font-semibold">22%</span></div>
                        </CardContent>
                    </Card>
                 </div>
            </div>
            
            {selectedTicket && (
                <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{selectedTicket.subject}</DialogTitle>
                            <DialogDescription>
                                Ticket ID: <span className="font-mono">{selectedTicket.id}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                            <div className="md:col-span-2 space-y-6">
                                {/* History */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Ticket History</h3>
                                    {selectedTicket.history.map((h, i) => (
                                        <div key={i} className="flex gap-3">
                                             <Avatar className="h-8 w-8">
                                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                             </Avatar>
                                            <div className="w-full">
                                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                    <span className="font-semibold text-foreground">{h.agent}</span>
                                                    <span>{new Date(h.date).toLocaleString()}</span>
                                                </div>
                                                <div className="mt-1 text-sm p-3 bg-muted rounded-lg">
                                                    <p className="font-medium">{h.action}</p>
                                                    {h.note && <p className="text-muted-foreground mt-1">{h.note}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Separator />
                                {/* Reply Box */}
                                <div>
                                    <h3 className="font-semibold mb-2">Post Reply</h3>
                                    <Textarea placeholder="Type your reply here..." className="min-h-[120px]" />
                                    <div className="mt-2 flex justify-end gap-2">
                                        <Button variant="outline">Add Internal Note</Button>
                                        <Button>Send Reply</Button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {/* Customer Info */}
                                <Card>
                                    <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
                                    <CardContent className="text-sm">
                                        <p className="font-semibold">{selectedTicket.customer.name}</p>
                                        <p className="text-muted-foreground">{selectedTicket.customer.email}</p>
                                    </CardContent>
                                </Card>
                                {/* Ticket Details */}
                                <Card>
                                    <CardHeader><CardTitle>Ticket Details</CardTitle></CardHeader>
                                    <CardContent className="space-y-4 text-sm">
                                        <div className="space-y-1">
                                            <Label>Priority</Label>
                                            <Select 
                                                value={selectedTicket.priority} 
                                                onValueChange={(value: 'Low' | 'Medium' | 'High' | 'Urgent') => handleUpdateTicket(selectedTicket.id, { priority: value })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Low">Low</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="High">High</SelectItem>
                                                    <SelectItem value="Urgent">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className="space-y-1">
                                            <Label>Agent</Label>
                                            <Select 
                                                value={selectedTicket.agent}
                                                onValueChange={(value) => handleUpdateTicket(selectedTicket.id, { agent: value })}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Select an agent" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                                                    {supportStaff.map(member => (
                                                        <SelectItem key={member.id} value={member.name}>
                                                            {member.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Status</Label>
                                            <Select 
                                                value={selectedTicket.status}
                                                onValueChange={(value: 'Open' | 'In Progress' | 'Resolved' | 'Closed') => handleUpdateTicket(selectedTicket.id, { status: value })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Open">Open</SelectItem>
                                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                                    <SelectItem value="Resolved">Resolved</SelectItem>
                                                    <SelectItem value="Closed">Closed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

        </div>
    );
}

    