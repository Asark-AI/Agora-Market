
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LiquidLoader } from '@/components/liquid-loader';
import { Label } from '@/components/ui/label';
import { Landmark, Smartphone } from 'lucide-react';
import type { PayoutMethod } from '@/lib/types';

interface AddPayoutMethodModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const formSchema = z.object({
    type: z.enum(['bank', 'mobile_money']),
    accountName: z.string().min(2, "Account name is required."),
    accountNumber: z.string().min(10, "A valid account/phone number is required."),
    bankName: z.string().optional(),
    mobileMoneyProvider: z.enum(['MTN', 'Vodafone', 'AirtelTigo']).optional(),
}).superRefine((data, ctx) => {
    if (data.type === 'bank' && (!data.bankName || data.bankName.length < 2)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank name is required.", path: ["bankName"] });
    }
    if (data.type === 'mobile_money' && !data.mobileMoneyProvider) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mobile money provider is required.", path: ["mobileMoneyProvider"] });
    }
});

type FormValues = z.infer<typeof formSchema>;

export function AddPayoutMethodModal({ isOpen, onOpenChange }: AddPayoutMethodModalProps) {
    const { addPayoutMethod } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'mobile_money',
            accountName: '',
            accountNumber: '',
        }
    });

    const selectedType = form.watch('type');

    const handleClose = () => {
        onOpenChange(false);
        form.reset();
    };

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const payload: Omit<PayoutMethod, 'id' | 'isDefault'> = {
                type: data.type,
                accountName: data.accountName,
                accountNumber: data.accountNumber,
                bankName: data.type === 'bank' ? data.bankName : undefined,
                mobileMoneyProvider: data.type === 'mobile_money' ? data.mobileMoneyProvider : undefined,
            };
            await addPayoutMethod(payload);
            toast({ title: 'Payout Method Added', description: 'Your new payout method has been saved.' });
            handleClose();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to add payout method.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Payout Method</DialogTitle>
                    <DialogDescription>Enter the details for your new payout account.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Type</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                            <Label htmlFor="type-momo" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                                <RadioGroupItem value="mobile_money" id="type-momo" className="sr-only" />
                                                <Smartphone className="mb-3 h-6 w-6" />
                                                Mobile Money
                                            </Label>
                                            <Label htmlFor="type-bank" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                                <RadioGroupItem value="bank" id="type-bank" className="sr-only" />
                                                <Landmark className="mb-3 h-6 w-6" />
                                                Bank Account
                                            </Label>
                                        </RadioGroup>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        
                        {selectedType === 'mobile_money' && (
                             <FormField
                                control={form.control}
                                name="mobileMoneyProvider"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Provider</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                                        <SelectItem value="Vodafone">Vodafone Cash</SelectItem>
                                        <SelectItem value="AirtelTigo">AirtelTigo Money</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}

                        {selectedType === 'bank' && (
                             <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bank Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Ecobank Ghana" {...field} value={field.value ?? ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="accountName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account Holder Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Ama Serwaa" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{selectedType === 'bank' ? 'Account Number' : 'Phone Number'}</FormLabel>
                                <FormControl><Input type="tel" placeholder={selectedType === 'bank' ? "0123456789012" : "0241234567"} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><LiquidLoader className="mr-2" />Adding Method...</> : 'Add Payout Method'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
