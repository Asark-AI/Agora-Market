'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { LiquidLoader } from '@/components/liquid-loader';
import { Check, ChevronsUpDown, Trash2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, Supplier, PurchaseOrderItem } from '@/lib/types';
import Image from 'next/image';

interface PurchaseOrderModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function PurchaseOrderModal({ isOpen, onOpenChange }: PurchaseOrderModalProps) {
    const { sellerProducts, sellerSuppliers, addPurchaseOrder } = useAuth();
    const { toast } = useToast();

    const [step, setStep] = useState(0);
    const [cart, setCart] = useState<Map<string, { product: Product; quantity: number; cost: number }>>(new Map());
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false);
    const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);
    
    const products = useMemo(() => sellerProducts.filter(p => 'stock' in p) as Product[], [sellerProducts]);

    const totalCost = useMemo(() => {
        return Array.from(cart.values()).reduce((acc, { quantity, cost }) => acc + quantity * cost, 0);
    }, [cart]);

    const addToCart = (product: Product) => {
        if (!cart.has(product.id)) {
            setCart(new Map(cart.set(product.id, { product, quantity: 1, cost: 0 })));
            toast({ title: "Item Added", description: `${product.name} added to the purchase order.` });
        }
        setIsProductPopoverOpen(false);
    };

    const updateCart = (productId: string, field: 'quantity' | 'cost', value: number) => {
        const item = cart.get(productId);
        if (item) {
            const newValue = Math.max(0, value);
            setCart(new Map(cart.set(productId, { ...item, [field]: newValue })));
        }
    };
    
    const removeFromCart = (productId: string) => {
        const newCart = new Map(cart);
        newCart.delete(productId);
        setCart(newCart);
    };

    const handleNext = () => {
        if (step === 0 && !selectedSupplier) {
            toast({ variant: 'destructive', title: 'No Supplier Selected', description: 'Please select a supplier.' });
            return;
        }
        if (step === 1 && cart.size === 0) {
            toast({ variant: 'destructive', title: 'Empty Order', description: 'Please add at least one product.' });
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleSubmit = () => {
        if (!selectedSupplier || cart.size === 0) return;
        setIsSubmitting(true);
        const poItems: PurchaseOrderItem[] = Array.from(cart.values()).map(({ product, quantity, cost }) => ({
            productId: product.id,
            productName: product.name,
            quantity,
            cost,
        }));
        
        addPurchaseOrder({
            supplierId: selectedSupplier.id,
            date: new Date().toISOString(),
            totalCost,
            status: 'draft',
            items: poItems,
        });

        setTimeout(() => {
            toast({ title: 'Purchase Order Created!', description: 'The draft PO has been saved.' });
            handleClose();
        }, 1000);
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            setStep(0);
            setCart(new Map());
            setSelectedSupplier(null);
            setIsSubmitting(false);
        }, 300);
    };

    const steps = [
        // Step 1: Select Supplier
        <div>
            <p className="mb-2 text-sm font-medium">Select the supplier for this purchase order.</p>
            <Popover open={isSupplierPopoverOpen} onOpenChange={setIsSupplierPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                        {selectedSupplier ? selectedSupplier.name : "Select a supplier..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search supplier..." />
                        <CommandList>
                            <CommandEmpty>No suppliers found.</CommandEmpty>
                            <CommandGroup>
                                {sellerSuppliers.map((supplier) => (
                                    <CommandItem key={supplier.id} onSelect={() => { setSelectedSupplier(supplier); setIsSupplierPopoverOpen(false); }}>
                                        <Check className={cn("mr-2 h-4 w-4", selectedSupplier?.id === supplier.id ? "opacity-100" : "opacity-0")} />
                                        {supplier.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>,
        // Step 2: Add Products
        <div className='space-y-4'>
            <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                        Search and add a product...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search product..." />
                        <CommandList>
                            <CommandEmpty>No products found.</CommandEmpty>
                            <CommandGroup>
                                {products.map((product) => (
                                    <CommandItem key={product.id} onSelect={() => addToCart(product)}>
                                        <Check className={cn("mr-2 h-4 w-4", cart.has(product.id) ? "opacity-100" : "opacity-0")} />
                                        {product.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <div className="mt-4 border rounded-md max-h-64 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Cost/Item</TableHead><TableHead></TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {cart.size > 0 ? (
                            Array.from(cart.values()).map(({ product, quantity, cost }) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell><Input type="number" className="h-8 w-20" value={quantity} onChange={e => updateCart(product.id, 'quantity', parseInt(e.target.value, 10))} /></TableCell>
                                    <TableCell><Input type="number" className="h-8 w-24" value={cost} onChange={e => updateCart(product.id, 'cost', parseFloat(e.target.value))} placeholder="Cost" /></TableCell>
                                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeFromCart(product.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Add products to your purchase order</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>,
        // Step 3: Review & Confirm
        <div>
            {selectedSupplier && <div className="mb-4 p-3 bg-secondary rounded-md text-sm"><span className="font-semibold">Supplier:</span> {selectedSupplier.name}</div>}
            <h4 className="font-semibold mb-2">Order Items</h4>
            <div className="border rounded-md">
                <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Cost</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {Array.from(cart.values()).map(({ product, quantity, cost }) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{quantity}</TableCell>
                                <TableCell>₵{cost.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">₵{(cost * quantity).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-4 text-lg font-bold flex justify-between">
                <span>Total Cost:</span>
                <span>₵{totalCost.toFixed(2)}</span>
            </div>
        </div>
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <DialogDescription>Create a new purchase order for a supplier.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Progress value={((step + 1) / steps.length) * 100} />
                    {steps[step]}
                </div>
                <DialogFooter>
                    {step > 0 && <Button variant="ghost" onClick={() => setStep(prev => prev - 1)} disabled={isSubmitting}>Back</Button>}
                    {step < steps.length - 1 ? (
                        <Button onClick={handleNext}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <LiquidLoader /> : 'Save Purchase Order'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}