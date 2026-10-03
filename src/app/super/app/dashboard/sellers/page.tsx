
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSellers, type Seller } from '@/app/super/services/sellers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/super/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';
import { Badge } from '@/app/super/components/ui/badge';
import { Button } from '@/app/super/components/ui/button';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/app/super/components/ui/dropdown-menu';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { Input } from '@/app/super/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/super/components/ui/tabs';

export default function SellersPage() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const router = useRouter();

    useEffect(() => {
        const fetchSellers = async () => {
            const data = await getSellers();
            setSellers(data);
            setLoading(false);
        };
        fetchSellers();
    }, []);
    
    const handleUpdateStatus = (sellerId: string, newStatus: 'Active' | 'Pending' | 'Suspended') => {
        setSellers(currentSellers => 
            currentSellers.map(seller => 
                seller.id === sellerId ? { ...seller, status: newStatus } : seller
            )
        );
    };

    const filteredSellers = useMemo(() => {
        return sellers
            .filter(seller => {
                if (statusFilter === 'all') return true;
                return seller.status.toLowerCase() === statusFilter;
            })
            .filter(seller => 
                seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                seller.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                seller.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [sellers, searchTerm, statusFilter]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Pending': return 'secondary';
            case 'Suspended': return 'destructive';
            default: return 'outline';
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Seller Management</h1>
                    <p className="mt-2 text-muted-foreground">Approve, monitor, and manage all businesses on your platform.</p>
                </div>
                 <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Seller
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            <CardTitle>All Sellers</CardTitle>
                            <CardDescription>A list of all businesses registered on Agora.</CardDescription>
                        </div>
                         <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by name, owner, or email..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="suspended">Suspended</TabsTrigger>
                        </TabsList>
                    </Tabs>
                
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                         <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Seller</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Business Type</TableHead>
                                        <TableHead>Total Revenue</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSellers.map((seller) => (
                                        <TableRow key={seller.id} >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={seller.avatar.src} alt={seller.name} data-ai-hint={seller.avatar.hint} />
                                                        <AvatarFallback>{seller.name.substring(0, 1)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{seller.name}</p>
                                                        <p className="text-sm text-muted-foreground">{seller.owner}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(seller.status)}>{seller.status}</Badge>
                                            </TableCell>
                                            <TableCell>{seller.businessType}</TableCell>
                                            <TableCell>GHC{seller.revenue.toLocaleString()}</TableCell>
                                            <TableCell>{seller.joined}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                                        <DropdownMenuItem>Edit Information</DropdownMenuItem>
                                                         <DropdownMenuSeparator />
                                                        {seller.status === 'Pending' && (
                                                          <>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(seller.id, 'Active')}>Approve</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(seller.id, 'Suspended')}>Reject</DropdownMenuItem>
                                                          </>
                                                        )}
                                                        {seller.status === 'Active' && (
                                                          <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(seller.id, 'Suspended')}>Suspend</DropdownMenuItem>
                                                        )}
                                                         {seller.status === 'Suspended' && (
                                                          <DropdownMenuItem onClick={() => handleUpdateStatus(seller.id, 'Active')}>Re-activate</DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                    )}
                     {!loading && filteredSellers.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            <p className="text-lg font-semibold">No sellers found</p>
                            <p>Try adjusting your search or filters.</p>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
