'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, FileText, ShoppingCart, Truck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LiquidLoader } from '@/components/liquid-loader';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseOrderModal } from '@/components/purchase-order-modal';

const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required.'),
  contactPerson: z.string().min(2, 'Contact person is required.'),
  phone: z.string().min(10, 'A valid phone number is required.'),
  email: z.string().email('Please enter a valid email.'),
});

type NewSupplierForm = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
    const { sellerSuppliers, addSupplier, loading } = useAuth();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPoModalOpen, setIsPoModalOpen] = useState(false);

    const form = useForm<NewSupplierForm>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: '',
            contactPerson: '',
            phone: '',
            email: '',
        }
    });

    const handleAddSupplier = (data: NewSupplierForm) => {
        setIsSubmitting(true);
        addSupplier(data);
        toast({ title: "Supplier Added", description: `${data.name} has been added to your suppliers list.` });
        setIsSubmitting(false);
        setIsDialogOpen(false);
        form.reset();
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Card>
                    <CardHeader className='flex-wrap gap-4 flex-row items-center justify-between'>
                        <div>
                            <CardTitle className="font-headline">Suppliers</CardTitle>
                            <CardDescription>Manage your list of suppliers and their contact information.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" onClick={() => setIsPoModalOpen(true)}>
                                <ShoppingCart className="mr-2 size-5" />
                                New Purchase Order
                            </Button>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2 size-5" />
                                    Add New Supplier
                                </Button>
                            </DialogTrigger>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Supplier Name</TableHead>
                                    <TableHead>Contact Person</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Purchase Orders</TableHead>
                                    <TableHead className="text-right">Total Spent</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sellerSuppliers.length > 0 ? sellerSuppliers.map(supplier => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell>{supplier.contactPerson}</TableCell>
                                        <TableCell>{supplier.phone}</TableCell>
                                        <TableCell>
                                            <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                                                {supplier.email}
                                            </a>
                                        </TableCell>
                                        <TableCell>{supplier.purchaseOrderCount || 0}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            ₵{supplier.totalSpent.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                                        View Purchase Orders
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">
                                            No suppliers added yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Supplier</DialogTitle>
                        <DialogDescription>
                            Enter the details for your new supplier. This information will be used for purchase orders.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAddSupplier)} className="space-y-4 pt-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Supplier/Business Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Kente Weavers Inc." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="contactPerson" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Person</FormLabel>
                                    <FormControl><Input placeholder="e.g., Mr. Yaw Mensah" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl><Input type="tel" placeholder="e.g., 0201234567" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl><Input type="email" placeholder="e.g., orders@kwinc.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <><LiquidLoader className="mr-2" />Adding...</> : 'Add Supplier'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <PurchaseOrderModal isOpen={isPoModalOpen} onOpenChange={setIsPoModalOpen} />
        </>
    );
}