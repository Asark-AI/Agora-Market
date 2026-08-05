
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReceiptDialog } from '@/components/receipt-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
    Trash2, UserPlus, Users, Barcode, CheckCircle, Printer, ShoppingCart, DollarSign, Wallet, ChevronsUpDown, Check
} from 'lucide-react';
import type { Product, Customer, OrderItem, Order } from '@/lib/types';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { categories } from '@/lib/data';

const customerFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required").optional().or(z.literal('')),
});
type CustomerFormValues = z.infer<typeof customerFormSchema>;

const AddCustomerDialog = ({ onCustomerAdded }: { onCustomerAdded: (customer: Customer) => void }) => {
    const { addCustomer } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerFormSchema),
        defaultValues: { name: '', email: '', phone: '' }
    });

    const onSubmit = async (data: CustomerFormValues) => {
        try {
            const normalizedData = {
                ...data,
                phone: data.phone || '',
            };
            const newCustomer = await addCustomer(normalizedData);
            onCustomerAdded(newCustomer);
            setIsOpen(false);
            form.reset();
        } catch (error: any) {
            form.setError("email", { type: "manual", message: error.message });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><UserPlus className="mr-2 size-4" />New Customer</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john.d@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input type="tel" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="submit">Add Customer</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};


const PosProductCard = ({ product, onAddToCart }: { product: Product, onAddToCart: (product: Product) => void }) => {
    return (
        <Card className="cursor-pointer hover:border-primary transition-colors overflow-hidden" onClick={() => onAddToCart(product)}>
            <div className="relative aspect-square w-full bg-muted">
                <NextImage src={product.images[0]} alt={product.name} fill className="object-cover" />
                {product.stock <= 5 && (
                    <div className="absolute top-1 right-1 bg-destructive/80 text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">{product.stock} left</div>
                )}
            </div>
            <div className="p-2">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-sm font-bold">₵{(product.discountPrice ?? product.price).toFixed(2)}</p>
            </div>
        </Card>
    );
};

export function PosSystem() {
    const { seller, sellerProducts, sellerCustomers, addWalkInOrder, addCustomer } = useAuth();
    const { toast } = useToast();

    // POS State
    const [cart, setCart] = useState<Map<string, { product: Product; quantity: number }>>(new Map());
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card'>('cash');
    const [amountReceived, setAmountReceived] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // UI State
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [barcode, setBarcode] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);

    // Post-payment state
    const [lastOrder, setLastOrder] = useState<Order | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    
    // Auto-focus barcode input
    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!selectedCustomer) {
            const walkInCustomer = sellerCustomers.find(c => c.name === 'Walk-in Customer');
            if (walkInCustomer) {
                setSelectedCustomer(walkInCustomer);
            }
        }
    }, [sellerCustomers, selectedCustomer]);

    const products = useMemo(() => {
        return (sellerProducts.filter(p => p.status === 'active' && 'stock' in p) as Product[])
            .filter(p => categoryFilter === 'all' || p.categoryId === categoryFilter)
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sellerProducts, categoryFilter, searchTerm]);

    const total = useMemo(() => {
        return Array.from(cart.values()).reduce((acc, { product, quantity }) => {
            const price = product.discountPrice ?? product.price;
            return acc + price * quantity;
        }, 0);
    }, [cart]);
    
    const changeDue = useMemo(() => {
        if(paymentMethod === 'cash' && amountReceived > 0 && amountReceived >= total) {
            return amountReceived - total;
        }
        return 0;
    }, [amountReceived, total, paymentMethod]);

    const addToCart = (product: Product) => {
        if (product.stock === 0) {
            toast({ variant: 'destructive', title: 'Out of Stock' });
            return;
        }
        const existingItem = cart.get(product.id);
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                setCart(new Map(cart.set(product.id, { ...existingItem, quantity: existingItem.quantity + 1 })));
            } else {
                toast({ variant: 'destructive', title: 'Stock limit reached' });
            }
        } else {
            setCart(new Map(cart.set(product.id, { product, quantity: 1 })));
        }
    };
    
    const handleBarcodeScan = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && barcode) {
            event.preventDefault();
            const product = (sellerProducts as Product[]).find(p => p.barcode === barcode);
            if (product) {
                addToCart(product);
            } else {
                toast({ variant: 'destructive', title: 'Product Not Found' });
            }
            setBarcode('');
        }
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        const item = cart.get(productId);
        if (item) {
            if (newQuantity <= 0) {
                const newCart = new Map(cart);
                newCart.delete(productId);
                setCart(newCart);
            } else if (newQuantity <= item.product.stock) {
                setCart(new Map(cart.set(productId, { ...item, quantity: newQuantity })));
            }
        }
    };
    
    const resetSale = () => {
        setCart(new Map());
        const walkIn = sellerCustomers.find(c => c.name === 'Walk-in Customer');
        setSelectedCustomer(walkIn || null);
        setPaymentMethod('cash');
        setAmountReceived(0);
        setLastOrder(null);
    };

    const handleSubmit = async () => {
        if (cart.size === 0) {
            toast({ variant: 'destructive', title: 'Empty Cart' });
            return;
        }
        
        if (!selectedCustomer) {
            toast({ variant: 'destructive', title: 'Please select a customer.' });
            return;
        }

        setIsSubmitting(true);
        const orderItems: OrderItem[] = Array.from(cart.values()).map(({ product, quantity }) => ({
            productId: product.id,
            price: product.discountPrice ?? product.price,
            quantity
        }));
        
        try {
            const newOrderId = await addWalkInOrder(orderItems, total, selectedCustomer.id, paymentMethod);
            const finalOrder: Order = {
                id: newOrderId,
                buyerId: selectedCustomer.id,
                userId: selectedCustomer.userId,
                date: new Date().toISOString(),
                total,
                items: orderItems,
                status: 'fulfilled',
                paymentMethod,
            };
            setLastOrder(finalOrder);
            setIsReceiptOpen(true);
            toast({ title: 'Sale Completed!' });
            resetSale();
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete sale.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const allCategories = useMemo(() => {
        const productCategories = (sellerProducts as Product[]).map(p => p.categoryId);
        const uniqueCategoryIds = Array.from(new Set(productCategories));
        return uniqueCategoryIds.map(id => categories.find(c => c.id === id)).filter(Boolean);
    }, [sellerProducts]);

    return (
        <div className="h-full flex flex-col gap-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Today's POS Revenue</CardTitle><DollarSign className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₵1,250.00</div></CardContent></Card>
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Walk-in Customers</CardTitle><Users className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">42</div></CardContent></Card>
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Cash Collected</CardTitle><Wallet className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₵820.00</div></CardContent></Card>
                <Card><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">MoMo/Card Collected</CardTitle><Wallet className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₵430.00</div></CardContent></Card>
            </div>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Left Side: Current Order */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Current Order</CardTitle>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                             <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        <Users className="mr-2 size-4" />
                                        {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search customer..." />
                                        <CommandList><CommandEmpty>No customer found.</CommandEmpty>
                                        <CommandGroup>
                                            {sellerCustomers.map((customer) => (
                                                <CommandItem key={customer.id} onSelect={() => { setSelectedCustomer(customer); setIsCustomerPopoverOpen(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", customer.id === selectedCustomer?.id ? "opacity-100" : "opacity-0")} />
                                                    {customer.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup></CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <AddCustomerDialog onCustomerAdded={(c) => setSelectedCustomer(c)} />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden flex flex-col">
                       <ScrollArea className="flex-grow pr-3 -mr-3">
                           <div className="space-y-2">
                               {cart.size > 0 ? (
                                   Array.from(cart.values()).map(({ product, quantity }) => (
                                       <div key={product.id} className="flex items-center gap-2">
                                           <NextImage src={product.images[0]} width={40} height={40} alt={product.name} className="rounded-md object-cover" />
                                           <div className="flex-grow">
                                                <p className="text-sm font-medium truncate">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">₵{(product.discountPrice ?? product.price).toFixed(2)}</p>
                                           </div>
                                            <Input type="number" value={quantity} onChange={e => updateQuantity(product.id, parseInt(e.target.value))} className="h-8 w-16" />
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, 0)}><Trash2 className="size-4 text-destructive" /></Button>
                                       </div>
                                   ))
                               ) : (
                                   <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                                       <ShoppingCart className="size-10 mb-2" />
                                       <p className="font-semibold">Cart is empty</p>
                                       <p className="text-xs">Add products by clicking or scanning.</p>
                                   </div>
                               )}
                           </div>
                       </ScrollArea>
                    </CardContent>
                    <CardContent className="border-t">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Subtotal</span><span>₵{total.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Discount</span><span>- ₵0.00</span></div>
                            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₵{total.toFixed(2)}</span></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <Button variant={paymentMethod === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentMethod('cash')}>Cash</Button>
                            <Button variant={paymentMethod === 'mobile_money' ? 'default' : 'outline'} onClick={() => setPaymentMethod('mobile_money')}>MoMo</Button>
                            <Button variant={paymentMethod === 'card' ? 'default' : 'outline'} onClick={() => setPaymentMethod('card')}>Card</Button>
                        </div>
                        {paymentMethod === 'cash' && 
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <Input type="number" placeholder="Amount Received" value={amountReceived || ''} onChange={e => setAmountReceived(parseFloat(e.target.value) || 0)} />
                                <Input readOnly value={`Change: ₵${changeDue.toFixed(2)}`} />
                            </div>
                        }
                        <Button className="w-full mt-4" size="lg" disabled={isSubmitting || cart.size === 0} onClick={handleSubmit}>
                            {isSubmitting ? 'Processing...' : `Confirm Payment (₵${total.toFixed(2)})`}
                        </Button>
                    </CardContent>
                </Card>

                {/* Right Side: Product Grid */}
                <Card className="lg:col-span-2 flex flex-col">
                    <CardHeader className="flex-col md:flex-row items-center gap-4">
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            <Input ref={barcodeInputRef} placeholder="Scan barcode..." value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={handleBarcodeScan} />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[220px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {allCategories.map(c => c && <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-1">
                                {products.map(p => <PosProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            {lastOrder && seller && <ReceiptDialog isOpen={isReceiptOpen} onOpenChange={setIsReceiptOpen} order={lastOrder} seller={seller} />}
        </div>
    );
}
