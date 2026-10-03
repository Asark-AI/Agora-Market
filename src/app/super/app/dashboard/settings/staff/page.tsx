'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { Plus, Check, X, Users, UserCheck, UserX, Search } from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/app/super/firebase';
import { collection, doc, updateDoc, getFirestore } from 'firebase/firestore';
import { Badge } from '@/app/super/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/super/components/ui/select';
import { useToast } from '@/app/super/hooks/use-toast';
import { errorEmitter } from '@/app/super/firebase';
import { FirestorePermissionError } from '@/app/super/firebase/errors';
import { Input } from '@/app/super/components/ui/input';
import { Tabs, TabsTrigger, TabsList } from '@/app/super/components/ui/tabs';


// Define the structure for a staff member, which can now be fetched from Firestore
export interface StaffMember {
    id: string;
    name: string;
    email: string;
    department?: 'Customer Service' | 'Marketing' | 'Finance' | 'Unassigned';
    role?: 'Admin' | 'Manager' | 'Agent' | 'Pending';
    joinedDate: string;
    status: 'Active' | 'Pending' | 'Suspended';
    avatar: {
      src: string;
      hint: string;
    };
}

export default function StaffManagementPage() {
    const firestore = getFirestore();
    const { toast } = useToast();
    
    const staffCollection = useMemoFirebase(() => collection(firestore, 'staff'), [firestore]);
    const { data: staff, isLoading: loading } = useCollection<StaffMember>(staffCollection);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');


    const handleUpdateStaff = (id: string, updates: Partial<StaffMember>) => {
        const staffDocRef = doc(firestore, 'staff', id);
        updateDoc(staffDocRef, updates)
            .then(() => {
                toast({
                    title: "Staff Updated",
                    description: "The staff member's details have been successfully updated.",
                });
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: staffDocRef.path,
                    operation: 'update',
                    requestResourceData: updates,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };
    
    const filteredStaff = useMemo(() => {
        if (!staff) return [];
        return staff
            .filter(member => {
                if (statusFilter === 'all') return true;
                return member.status.toLowerCase() === statusFilter;
            })
            .filter(member => 
                member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [staff, searchTerm, statusFilter]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Pending': return 'secondary';
            case 'Suspended': return 'destructive';
            default: return 'outline';
        }
    };
    
    const totalStaff = staff?.length || 0;
    const pendingApprovals = staff?.filter(s => s.status === 'Pending').length || 0;
    const activeStaff = staff?.filter(s => s.status === 'Active').length || 0;


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Staff Management</h1>
                    <p className="mt-2 text-muted-foreground">Approve, assign roles, and manage your team members.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Staff Member
                </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className='flex-row items-center justify-between pb-2'>
                        <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12"/> : totalStaff}</div>
                        <p className="text-xs text-muted-foreground">members in the organization</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className='flex-row items-center justify-between pb-2'>
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <UserX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12"/> : pendingApprovals}</div>
                        <p className="text-xs text-muted-foreground">awaiting admin confirmation</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className='flex-row items-center justify-between pb-2'>
                        <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12"/> : activeStaff}</div>
                        <p className="text-xs text-muted-foreground">currently active members</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>A list of all team members in your organization.</CardDescription>
                        </div>
                         <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search name or email..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="suspended">Suspended</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    {loading ? (
                        <div className="space-y-2 mt-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <div className="mt-4 border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Member</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStaff.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={member.avatar.src} alt={member.name} data-ai-hint={member.avatar.hint} />
                                                    <AvatarFallback>{member.name.substring(0, 1)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(member.status)}>{member.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                             {member.status === 'Pending' ? (
                                                <span className="text-muted-foreground text-xs">Unassigned</span>
                                             ) : (
                                                <Select
                                                    value={member.department}
                                                    onValueChange={(value) => handleUpdateStaff(member.id, { department: value as any })}
                                                >
                                                    <SelectTrigger className="w-40 text-xs h-8">
                                                        <SelectValue placeholder="Select dept." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Unassigned">Unassigned</SelectItem>
                                                        <SelectItem value="Customer Service">Customer Service</SelectItem>
                                                        <SelectItem value="Marketing">Marketing</SelectItem>
                                                        <SelectItem value="Finance">Finance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                             )}
                                        </TableCell>
                                        <TableCell>
                                             {member.status === 'Pending' ? (
                                                <span className="text-muted-foreground text-xs">Awaiting approval</span>
                                             ) : (
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(value) => handleUpdateStaff(member.id, { role: value as any })}
                                                >
                                                    <SelectTrigger className="w-36 text-xs h-8">
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Admin">Admin</SelectItem>
                                                        <SelectItem value="Manager">Manager</SelectItem>
                                                        <SelectItem value="Agent">Agent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                             )}
                                        </TableCell>
                                        <TableCell>{new Date(member.joinedDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            {member.status === 'Pending' ? (
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => handleUpdateStaff(member.id, { status: 'Active', role: 'Agent', department: 'Unassigned' })}>
                                                        <Check className="mr-2 h-4 w-4" /> Approve
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleUpdateStaff(member.id, { status: 'Suspended' })}>
                                                        <X className="mr-2 h-4 w-4" /> Decline
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                     {!loading && filteredStaff.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No staff members found.</p>
                            <p className="text-xs">Try adjusting your search or filter.</p>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
