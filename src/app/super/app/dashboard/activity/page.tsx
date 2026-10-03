
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getActivities, type Activity } from '@/app/super/services/activity';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/super/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';
import { Badge } from '@/app/super/components/ui/badge';
import { Button } from '@/app/super/components/ui/button';
import { MoreHorizontal, Search, User, Edit, Trash, PlusCircle, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { Input } from '@/app/super/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/super/components/ui/select';
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from '@/app/super/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/app/super/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/app/super/lib/utils';

const ITEMS_PER_PAGE = 10;

export default function ActivityPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userFilter, setUserFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            const data = await getActivities();
            // In a real app, you would connect to a Firestore stream here
            setActivities(data);
            setLoading(false);
        };
        fetchActivities();
    }, []);

    const uniqueUsers = useMemo(() => {
        if (loading) return [];
        const users = activities.map(a => a.user.name);
        return ['all', ...Array.from(new Set(users))];
    }, [activities, loading]);
    
    const uniqueActions = useMemo(() => {
        if(loading) return [];
        const actions = activities.map(a => a.action.type);
        return ['all', ...Array.from(new Set(actions))];
    }, [activities, loading]);

    const filteredActivities = useMemo(() => {
        return activities
            .filter(activity => {
                const searchMatch = activity.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    activity.action.description.toLowerCase().includes(searchTerm.toLowerCase());
                const userMatch = userFilter === 'all' || activity.user.name === userFilter;
                const actionMatch = actionFilter === 'all' || activity.action.type === actionFilter;
                const dateMatch = !dateFilter || (
                    new Date(activity.timestamp) >= (dateFilter.from || new Date(0)) &&
                    new Date(activity.timestamp) <= (dateFilter.to || new Date())
                );
                return searchMatch && userMatch && actionMatch && dateMatch;
            });
    }, [activities, searchTerm, userFilter, actionFilter, dateFilter]);
    
    const paginatedActivities = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredActivities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredActivities, currentPage]);
    
    const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
    
    const getActionIcon = (type: string) => {
        switch (type) {
            case 'create': return <PlusCircle className="h-4 w-4 text-green-500" />;
            case 'update': return <Edit className="h-4 w-4 text-blue-500" />;
            case 'delete': return <Trash className="h-4 w-4 text-red-500" />;
            case 'approve': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'reject': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <User className="h-4 w-4 text-gray-500" />;
        }
    };
    
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Activity</h1>
                <p className="mt-2 text-muted-foreground">This is where you can see the latest activity across your team.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full md:flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search user or action..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <Select value={userFilter} onValueChange={setUserFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by user" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueUsers.map(user => <SelectItem key={user} value={user}>{user === 'all' ? 'All Users' : user}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by action" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueActions.map(action => <SelectItem key={action} value={action}>{action === 'all' ? 'All Actions' : action}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-full md:w-[300px] justify-start text-left font-normal",
                                !dateFilter && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFilter?.from ? (
                                dateFilter.to ? (
                                    <>{format(dateFilter.from, "LLL dd, y")} - {format(dateFilter.to, "LLL dd, y")}</>
                                ) : (
                                    format(dateFilter.from, "LLL dd, y")
                                )
                                ) : (
                                <span>Pick a date range</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateFilter?.from}
                                selected={dateFilter}
                                onSelect={setDateFilter}
                                numberOfMonths={2}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(ITEMS_PER_PAGE)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Resource</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedActivities.length > 0 ? paginatedActivities.map((activity) => (
                                            <TableRow key={activity.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={activity.user.avatar.src} alt={activity.user.name} data-ai-hint={activity.user.avatar.hint} />
                                                            <AvatarFallback>{activity.user.name.substring(0,1)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{activity.user.name}</p>
                                                            <p className="text-sm text-muted-foreground">{activity.user.role}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getActionIcon(activity.action.type)}
                                                        <span>{activity.action.description}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{activity.resource.type}</Badge>
                                                    <span className="ml-2 text-sm text-muted-foreground truncate">{activity.resource.name}</span>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    No activity found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-end space-x-2 py-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
