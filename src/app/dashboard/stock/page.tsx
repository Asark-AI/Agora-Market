'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, SlidersHorizontal, Package, AlertTriangle, Coins } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Product, StockAdjustment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const StockAdjustmentModal = dynamic(() => import('@/components/stock-adjustment-modal'), {
  ssr: false,
  loading: () => null,
});

type StockMovementType = 'adjustment-add' | 'adjustment-remove' | 'transfer' | 'sale' | 'purchase';

interface StockMovement {
  id: string;
  date: string; // ISO String
  type: StockMovementType;
  product: string;
  quantity: number; // can be negative for sales/adjustments
  reason?: string;
  reference?: string;
}

const typeVariant: Record<StockMovementType, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  'adjustment-add': 'default',
  'adjustment-remove': 'destructive',
  'transfer': 'outline',
  'sale': 'secondary',
  'purchase': 'default',
};

const typeText: Record<StockMovementType, string> = {
  'adjustment-add': 'Adjustment (In)',
  'adjustment-remove': 'Adjustment (Out)',
  'transfer': 'Transfer',
  'sale': 'Sale',
  'purchase': 'Purchase',
};

export default function StockPage() {
    const { sellerProducts, sellerOrders, sellerStockAdjustments, loading } = useAuth();
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    
    const products = useMemo(() => sellerProducts.filter(p => 'stock' in p) as Product[], [sellerProducts]);

    const stockData = useMemo(() => {
        const totalItems = products.reduce((sum, p) => sum + (p.stock || 0), 0);
        const totalValue = products.reduce((sum, p) => sum + (p.stock || 0) * (p.costPrice || 0), 0);
        const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 5).length;
        return { totalItems, totalValue, lowStockItems };
    }, [products]);

    const movements = useMemo(() => {
        const saleMovements: StockMovement[] = sellerOrders.flatMap(order => 
            order.items.map(item => ({
                id: `${order.id}-${item.productId}`,
                date: order.date,
                type: 'sale' as StockMovementType,
                product: products.find(p => p.id === item.productId)?.name || 'Unknown',
                quantity: -item.quantity,
                reference: `Order #${order.id.slice(0, 6)}`,
            }))
        );

        const adjustmentMovements: StockMovement[] = sellerStockAdjustments.map(adj => ({
            id: adj.id,
            date: adj.date,
            type: adj.type === 'addition' ? 'adjustment-add' : 'adjustment-remove',
            product: adj.productName,
            quantity: adj.type === 'addition' ? adj.quantity : -adj.quantity,
            reason: adj.reason,
        }));
        
        return [...saleMovements, ...adjustmentMovements].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    }, [sellerOrders, sellerStockAdjustments, products]);

    if (loading) {
        return (
            <div className="space-y-6">
                 <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <>
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₵{stockData.totalValue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Based on cost price</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stockData.totalItems}</div>
                            <p className="text-xs text-muted-foreground">Across {products.length} products</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stockData.lowStockItems}</div>
                            <p className="text-xs text-muted-foreground">Items with 5 or less units</p>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader className='flex-wrap gap-4 flex-row items-center justify-between'>
                        <div>
                            <CardTitle className="font-headline">Stock Movements</CardTitle>
                            <CardDescription>Track all inventory sales, purchases, and adjustments.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsAdjustmentModalOpen(true)}>
                                <SlidersHorizontal className="mr-2 size-5" />
                                New Adjustment
                            </Button>
                            <Button disabled>
                                <ArrowLeftRight className="mr-2 size-5" />
                                New Transfer
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Reason/Ref</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.length > 0 ? movements.map(move => (
                                    <TableRow key={move.id}>
                                        <TableCell>{format(parseISO(move.date), 'dd MMM, yyyy HH:mm')}</TableCell>
                                        <TableCell>
                                            <Badge variant={typeVariant[move.type]}>
                                                {typeText[move.type]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{move.product}</TableCell>
                                        <TableCell className={`text-right font-semibold ${move.quantity > 0 ? 'text-green-600' : 'text-destructive'}`}>
                                            {move.quantity > 0 ? `+${move.quantity}` : move.quantity}
                                        </TableCell>
                                        <TableCell>{move.reason || move.reference}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No stock movements recorded.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <StockAdjustmentModal isOpen={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen} />
        </>
    );
}
