'use client';

import { useState, useMemo } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Edit, ListTree, Upload, Calendar, Tags, TrendingUp, TrendingDown, Minus, Search, Star, Package } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { categories } from '@/lib/data';
import type { Product } from '@/lib/types';
import { usePageLoaderStore } from '@/hooks/use-page-loader';
import { DashboardSkeleton } from '@/components/loading-skeletons';

export default function ProductsPage() {
    const { seller, sellerProducts, loading } = useAuth();
    const { show: showLoader } = usePageLoaderStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'inactive' | 'scheduled'>('all');

    const pageConfig = useMemo(() => {
        if (!seller) return null;
        const isStore = seller.businessType === 'store' || seller.businessType === 'manufacturing';
        return {
            isStore,
            itemType: 'Product',
            itemTypePlural: 'Products',
        };
    }, [seller]);

    const filteredProducts = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return sellerProducts.filter((product) => {
            const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
            const matchesSearch = !normalizedSearch || product.name.toLowerCase().includes(normalizedSearch) || product.categoryId.toLowerCase().includes(normalizedSearch);
            return matchesStatus && matchesSearch;
        });
    }, [sellerProducts, searchTerm, statusFilter]);
    
    if (loading || !seller || !pageConfig) {
        return <DashboardSkeleton />;
    }
    
    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || 'N/A';
    }
    
    const calculateProfit = (product: Product) => {
        if (!product.costPrice || product.costPrice <= 0) return { profit: null, margin: null };
        const sellingPrice = product.discountPrice || product.price;
        if (sellingPrice <= 0) return { profit: null, margin: null };
        const profit = sellingPrice - product.costPrice;
        const margin = (profit / sellingPrice) * 100;
        return { profit, margin };
    }

    const statusClass = (status: string) => {
        if (status === 'active') return 'dashboard-status--green';
        if (status === 'draft' || status === 'scheduled') return 'dashboard-status--amber';
        return 'dashboard-status--neutral';
    };

    const getImage = (product: (typeof sellerProducts)[number]) => (
        'coverImageUrl' in product ? product.coverImageUrl : product.images?.[0]
    ) || '';

    const getPrice = (product: (typeof sellerProducts)[number]) => {
        if ('price' in product && typeof product.price === 'number') return product.discountPrice ?? product.price;
        if ('flatFee' in product && typeof product.flatFee === 'number') return product.flatFee;
        if ('hourlyRate' in product && typeof product.hourlyRate === 'number') return product.hourlyRate;
        return null;
    };

    return (
        <Card>
            <CardHeader className="gap-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl">Products</CardTitle>
                        <CardDescription>Manage your listings and keep stock moving.</CardDescription>
                    </div>
                    <Button asChild onClick={showLoader} className="min-h-11 w-full shrink-0 bg-primary text-primary-foreground hover:bg-[#e0b746] sm:w-auto">
                        <Link href="/dashboard/add-product">
                            <PlusCircle className="mr-2 size-4" />
                            Add product
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products" aria-label="Search products" className="h-11 border-border bg-[#171b1f] pl-9" />
                    </div>
                    <div className="grid grid-cols-5 gap-1 rounded-lg border border-border bg-[#101316] p-1" role="group" aria-label="Filter products by status">
                        {(['all', 'active', 'draft', 'inactive', 'scheduled'] as const).map((status) => (
                            <Button key={status} type="button" variant="ghost" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)} className={`min-h-9 px-2 text-xs capitalize ${statusFilter === status ? 'border border-primary/25 bg-accent text-primary' : 'text-muted-foreground'}`}>
                                {status === 'all' ? 'All' : status}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {pageConfig.isStore ? (
                        <>
                            <Button asChild variant="outline" onClick={showLoader}>
                                <Link href="/dashboard/stock">
                                    <ListTree className="mr-2 size-4" /> Manage Inventory
                                </Link>
                            </Button>
                            <Button asChild variant="outline" onClick={showLoader}>
                                <Link href="#">
                                    <Upload className="mr-2 size-4" /> Bulk Upload
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button asChild variant="outline" onClick={showLoader}>
                                <Link href="#">
                                    <Calendar className="mr-2 size-4" /> Availability
                                </Link>
                            </Button>
                            <Button asChild variant="outline" onClick={showLoader}>
                                <Link href="#">
                                    <Tags className="mr-2 size-4" /> Pricing
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground" aria-live="polite">{filteredProducts.length} of {sellerProducts.length} listings</p>
                <div className="space-y-3 md:hidden">
                    {filteredProducts.map((product) => {
                        const image = getImage(product);
                        const price = getPrice(product);
                        const stock = 'stock' in product ? product.stock : undefined;
                        const sales = 'soldCount' in product ? product.soldCount : undefined;
                        const rating = product.ratingAverage;
                        return (
                            <Card key={product.id} className="p-3">
                                <div className="flex gap-3">
                                    <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg border border-border bg-[#171b1f]">
                                        {image ? <NextImage src={image} alt={product.name} fill sizes="76px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="size-5" /></div>}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0"><h3 className="truncate text-sm font-semibold">{product.name}</h3><p className="mt-1 truncate text-xs text-muted-foreground">{getCategoryName(product.categoryId)}</p></div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="-mr-2 -mt-2 h-11 w-11 shrink-0" aria-label={`Actions for ${product.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end"><DropdownMenuItem asChild onClick={showLoader}><Link href={`/dashboard/products/${product.id}/edit`}><Edit className="mr-2 size-4" />Edit listing</Link></DropdownMenuItem></DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                            <span className="font-semibold text-foreground">{price === null ? 'Price unavailable' : `₵${price.toFixed(2)}`}</span>
                                            <span className="dashboard-status dashboard-status--neutral min-h-6 px-2 py-1">{sales === undefined ? 'Sales unavailable' : `${sales} sold`}</span>
                                            {rating !== undefined && rating > 0 ? <span className="inline-flex items-center gap-1 text-muted-foreground"><Star className="size-3.5 fill-current text-primary" />{rating.toFixed(1)}</span> : <span className="text-muted-foreground">Not rated</span>}
                                        </div>
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <span className={`dashboard-status ${statusClass(product.status)}`}>{product.status}</span>
                                            {stock !== undefined && <span className={`text-xs ${stock <= 0 ? 'text-red-300' : stock <= 5 ? 'text-amber-300' : 'text-muted-foreground'}`}>{stock <= 0 ? 'Out of stock' : stock <= 5 ? `Low stock · ${stock} left` : `${stock} in stock`}</span>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {filteredProducts.length === 0 && <div className="rounded-xl border border-border bg-[#171b1f] px-4 py-10 text-center"><Package className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">{sellerProducts.length ? 'No matching products' : 'No products yet'}</p><p className="mt-1 text-sm text-muted-foreground">{sellerProducts.length ? 'Try another search or status filter.' : 'Add your first product to start selling.'}</p>{sellerProducts.length === 0 && <Button asChild className="mt-4 min-h-11 bg-primary text-primary-foreground"><Link href="/dashboard/add-product">Add product</Link></Button>}</div>}
                </div>
                <div className="hidden overflow-x-auto md:block">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead>Performance</TableHead>
                            <TableHead className="text-right">Profit Margin</TableHead>
                            {pageConfig.isStore ? (
                                <TableHead className="text-right">Stock</TableHead>
                            ) : (
                                <TableHead className="text-center">Availability</TableHead>
                            )}
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length > 0 ? filteredProducts.map(item => {
                            const product = item as Product;
                            const { profit, margin } = 'price' in product ? calculateProfit(product) : { profit: null, margin: null };

                            return (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <NextImage
                                            src={getImage(item) || 'https://placehold.co/40x40.png'}
                                            alt={product.name}
                                            width={40}
                                            height={40}
                                            className="rounded-md object-cover"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{getCategoryName(product.categoryId)}</TableCell>
                                    <TableCell className="text-right font-medium">{getPrice(item) === null ? '—' : `₵${getPrice(item)?.toFixed(2)}`}</TableCell>
                                    <TableCell><div className="space-y-1 text-xs"><p>{'soldCount' in item ? `${item.soldCount || 0} sold` : 'Sales unavailable'}</p><p className="inline-flex items-center gap-1 text-muted-foreground">{item.ratingAverage ? <><Star className="size-3 fill-current text-primary" />{item.ratingAverage.toFixed(1)}</> : 'Not rated'}</p></div></TableCell>
                                    <TableCell className="text-right">
                                        {profit !== null && margin !== null ? (
                                            <div className={`flex items-center justify-end gap-1 font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                                {profit > 0 ? <TrendingUp className="size-4" /> : profit < 0 ? <TrendingDown className="size-4" /> : <Minus className="size-4" />}
                                                <span>{margin.toFixed(1)}%</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">N/A</span>
                                        )}
                                    </TableCell>
                                    {pageConfig.isStore && 'stock' in product ? (
                                        <TableCell className="text-right">{product.stock <= 0 ? <span className="dashboard-status dashboard-status--red">Out of stock</span> : product.stock <= 5 ? <span className="dashboard-status dashboard-status--amber">Low · {product.stock}</span> : <span className="text-muted-foreground">{product.stock} units</span>}</TableCell>
                                    ) : (
                                        <TableCell className="text-center">
                                            <Badge variant="outline">Available</Badge>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-center">
                                        <span className={`dashboard-status ${statusClass(product.status)}`}>{product.status}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild onClick={showLoader}>
                                                    <Link href={`/dashboard/products/${product.id}/edit`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        }) : (
                            <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">
                                    No products match the selected search and filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
    );
}
