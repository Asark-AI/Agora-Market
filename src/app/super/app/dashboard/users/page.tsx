'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUsers, type User } from '@/app/super/services/users';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/super/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';
import { Badge } from '@/app/super/components/ui/badge';
import { Button } from '@/app/super/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/app/super/components/ui/dropdown-menu';
import { Skeleton } from '@/app/super/components/ui/skeleton';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await getUsers();
            setUsers(data);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Pending': return 'secondary';
            case 'Inactive': return 'outline';
            case 'Suspended': return 'destructive';
            default: return 'outline';
        }
    };
    
    const handleRowClick = (userId: string) => {
        router.push(`/dashboard/users/${userId}`);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Users</h1>
                <p className="mt-2 text-muted-foreground">Manage your Agora platform's users and their details.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all users in your platform.</CardDescription>
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
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Total Spent</TableHead>
                                    <TableHead>Last Order</TableHead>
                                    <TableHead>Date Joined</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} onClick={() => handleRowClick(user.id)} className="cursor-pointer">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.avatar.src} alt={user.name} data-ai-hint={user.avatar.hint} />
                                                    <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(user.status) as any}>{user.status}</Badge>
                                        </TableCell>
                                        <TableCell>GHC{user.totalSpent.toLocaleString()}</TableCell>
                                        <TableCell>{user.lastOrderDate}</TableCell>
                                        <TableCell>{user.dateJoined}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(user.id); }}>View profile</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>View orders</DropdownMenuItem>
                                                     {user.status === 'Pending' && (
                                                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Approve User</DropdownMenuItem>
                                                     )}
                                                    <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>Suspend user</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
