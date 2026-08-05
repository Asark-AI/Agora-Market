'use client';

import { useState, useMemo } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Edit, ListTree, Upload, Calendar, Tags, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { categories } from '@/lib/data';
import type { Product } from '@/lib/types';
import { usePageLoaderStore } from '@/hooks/use-page-loader';

export default function ProductsPage() {
    const { seller, sellerProducts, loading } = useAuth();
    const { show: showLoader } = usePageLoaderStore();

    const pageConfig = useMemo(() => {
        if (!seller) return null;
        const isStore = seller.businessType === 'store' || seller.businessType === 'manufacturing';
        return {
            isStore,
            itemType: isStore ? 'Product' : 'Service',
            itemTypePlural: isStore ? 'Products' : 'Services',
        };
    }, [seller]);
    
    if (loading || !seller || !pageConfig) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        );
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

    return (
        <Card>
            <CardHeader className="flex-wrap gap-4">
                 <div className="flex-wrap gap-y-4 flex flex-col items-center text-center">
                    <div>
                        <CardTitle className="font-headline">My {pageConfig.itemTypePlural}</CardTitle>
                        <CardDescription>View, manage, and add new {pageConfig.itemTypePlural.toLowerCase()}.</CardDescription>
                    </div>
                     <div className="flex flex-wrap justify-center gap-2">
                        {pageConfig.isStore ? (
                             <>
                                <Button asChild variant="outline" onClick={showLoader}>
                                    <Link href="/dashboard/stock">
                                        <ListTree className="mr-2 size-5" /> Manage Inventory
                                    </Link>
                                </Button>
                                 <Button asChild variant="outline" onClick={showLoader}>
                                    <Link href="#">
                                        <Upload className="mr-2 size-5" /> Bulk Upload (CSV)
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button asChild variant="outline" onClick={showLoader}>
                                    <Link href="#">
                                        <Calendar className="mr-2 size-5" /> Availability Calendar
                                    </Link>
                                </Button>
                                 <Button asChild variant="outline" onClick={showLoader}>
                                    <Link href="#">
                                        <Tags className="mr-2 size-5" /> Packages & Pricing
                                    </Link>
                                </Button>
                            </>
                        )}
                         <Button asChild onClick={showLoader}>
                            <Link href="/dashboard/add-product">
                                <PlusCircle className="mr-2 size-5" />
                                Add New {pageConfig.itemType}
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
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
                        {sellerProducts.length > 0 ? sellerProducts.map(item => {
                            const product = item as Product;
                            const { profit, margin } = 'price' in product ? calculateProfit(product) : { profit: null, margin: null };

                            return (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <NextImage
                                            src={(product.images && product.images[0]) || 'https://placehold.co/40x40.png'}
                                            alt={product.name}
                                            width={40}
                                            height={40}
                                            className="rounded-md object-cover"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{getCategoryName(product.categoryId)}</TableCell>
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
                                        <TableCell className="text-right">{product.stock}</TableCell>
                                    ) : (
                                        <TableCell className="text-center">
                                            <Badge variant="outline">Available</Badge>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-center">
                                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                            {product.status}
                                        </Badge>
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
                                <TableCell colSpan={7} className="text-center h-24">
                                    No {pageConfig.itemTypePlural.toLowerCase()} added yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
