
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getProducts, type Product } from '@/app/super/services/products';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/super/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/super/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/super/components/ui/avatar';
import { Badge } from '@/app/super/components/ui/badge';
import { Button } from '@/app/super/components/ui/button';
import { MoreHorizontal, Plus, Search, Calendar as CalendarIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/app/super/components/ui/dropdown-menu';
import { Skeleton } from '@/app/super/components/ui/skeleton';
import { Input } from '@/app/super/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/super/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/super/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/app/super/components/ui/popover';
import { Calendar } from '@/app/super/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/app/super/lib/utils';


export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();


    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const data = await getProducts();
            setProducts(data);
            setLoading(false);
        };
        fetchProducts();
    }, []);

    const handleUpdateStatus = (productId: string, newStatus: 'Approved' | 'Pending' | 'Declined') => {
        setProducts(currentProducts =>
            currentProducts.map(product =>
                product.id === productId ? { ...product, status: newStatus } : product
            )
        );
    };

    const uniqueCategories = useMemo(() => {
        if (loading) return [];
        const categories = products.map(p => p.category);
        return ['all', ...Array.from(new Set(categories))];
    }, [products, loading]);

    const filteredProducts = useMemo(() => {
        return products
            .filter(product => {
                const statusMatch = statusFilter === 'all' || product.status.toLowerCase() === statusFilter;
                const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
                const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    product.seller.toLowerCase().includes(searchTerm.toLowerCase());
                const dateMatch = !dateFilter || (
                    new Date(product.submitted) >= (dateFilter.from || new Date(0)) &&
                    new Date(product.submitted) <= (dateFilter.to || new Date())
                );

                return statusMatch && categoryMatch && searchMatch && dateMatch;
            });
    }, [products, searchTerm, statusFilter, categoryFilter, dateFilter]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            case 'Declined': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Product Management</h1>
                    <p className="mt-2 text-muted-foreground">Approve, monitor, and manage all products on your platform.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div className="flex-1 mb-4 sm:mb-0">
                                <CardTitle>All Products</CardTitle>
                                <CardDescription>A list of all products submitted by sellers.</CardDescription>
                            </div>
                            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="approved">Approved</TabsTrigger>
                                    <TabsTrigger value="declined">Declined</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative w-full md:flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search product or seller..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>)}
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
                                    <span>Filter by submission date</span>
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
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Image</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <Avatar className="h-10 w-10 rounded-md">
                                                    <AvatarImage src={product.image.src} alt={product.name} data-ai-hint={product.image.hint} />
                                                    <AvatarFallback className="rounded-md">{product.name.substring(0, 1)}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">by {product.seller}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(product.status)}>{product.status}</Badge>
                                            </TableCell>
                                            <TableCell>{product.category}</TableCell>
                                            <TableCell>{product.stock}</TableCell>
                                            <TableCell>GHC{product.price.toFixed(2)}</TableCell>
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
                                                        <DropdownMenuSeparator />
                                                        {product.status === 'Pending' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(product.id, 'Approved')}>Approve</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(product.id, 'Declined')}>Decline</DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {product.status !== 'Pending' && (
                                                            <DropdownMenuItem className="text-red-600">Remove Product</DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No products found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    