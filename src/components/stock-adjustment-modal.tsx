'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LiquidLoader } from '@/components/liquid-loader';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Please select a product.'),
  productName: z.string(),
  type: z.enum(['addition', 'subtraction']),
  quantity: z.coerce.number().int().positive('Quantity must be a positive number.'),
  reason: z.string().min(3, 'Please provide a reason for the adjustment.'),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

const adjustmentReasons = [
    "Stocktake correction",
    "Damaged goods",
    "Customer return",
    "Lost/Stolen",
    "Found stock",
    "Initial stock entry",
];

export function StockAdjustmentModal({ isOpen, onOpenChange }: StockAdjustmentModalProps) {
    const { sellerProducts, addStockAdjustment } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);
    
    const products = sellerProducts.filter(p => 'stock' in p) as Product[];

    const form = useForm<AdjustmentFormValues>({
        resolver: zodResolver(adjustmentSchema),
        defaultValues: {
            productId: '',
            productName: '',
            type: 'addition',
            quantity: 1,
            reason: '',
        },
    });

    const handleClose = () => {
        onOpenChange(false);
        form.reset();
    };

    const onSubmit = async (data: AdjustmentFormValues) => {
        setIsSubmitting(true);
        try {
            await addStockAdjustment(data);
            toast({ title: 'Stock Adjusted', description: 'The inventory has been updated successfully.' });
            handleClose();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to adjust stock.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Stock Adjustment</DialogTitle>
                    <DialogDescription>Manually add or remove stock from your inventory.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="productId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product</FormLabel>
                                    <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                    {field.value ? products.find((p) => p.id === field.value)?.name : "Select product"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search product..." />
                                                <CommandList>
                                                    <CommandEmpty>No products found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {products.map((product) => (
                                                            <CommandItem
                                                                value={product.name}
                                                                key={product.id}
                                                                onSelect={() => {
                                                                    form.setValue("productId", product.id);
                                                                    form.setValue("productName", product.name);
                                                                    setIsProductPopoverOpen(false);
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", product.id === field.value ? "opacity-100" : "opacity-0")} />
                                                                {product.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem><FormLabel>Adjustment Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="addition">Add to Stock</SelectItem><SelectItem value="subtraction">Remove from Stock</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="quantity" render={({ field }) => (
                                <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="reason" render={({ field }) => (
                            <FormItem><FormLabel>Reason</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a reason"/></SelectTrigger></FormControl><SelectContent>{adjustmentReasons.map(reason => (<SelectItem key={reason} value={reason}>{reason}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                        )} />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><LiquidLoader className="mr-2" />Adjusting Stock...</> : 'Confirm Adjustment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
