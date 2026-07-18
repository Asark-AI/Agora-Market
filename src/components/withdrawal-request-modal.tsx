'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LiquidLoader } from '@/components/liquid-loader';
import { Landmark, Smartphone } from 'lucide-react';

interface WithdrawalRequestModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    balance: number;
}

const formSchema = z.object({
    amount: z.coerce.number().positive("Amount must be positive."),
    payoutMethodId: z.string().min(1, "Please select a payout method."),
});

type FormValues = z.infer<typeof formSchema>;

export function WithdrawalRequestModal({ isOpen, onOpenChange, balance }: WithdrawalRequestModalProps) {
    const { sellerPayoutMethods, requestWithdrawal } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: undefined,
            payoutMethodId: '',
        }
    });

    useEffect(() => {
        if (sellerPayoutMethods.length > 0 && isOpen) {
            const defaultMethodId = sellerPayoutMethods.find(m => m.isDefault)?.id || sellerPayoutMethods[0]?.id;
            if (defaultMethodId) {
                form.setValue('payoutMethodId', defaultMethodId);
            }
        }
    }, [isOpen, sellerPayoutMethods, form]);
    
    const handleClose = () => {
        onOpenChange(false);
        form.reset();
    };

    const onSubmit = async (data: FormValues) => {
        if (data.amount > balance) {
            form.setError("amount", { type: "manual", message: "Withdrawal amount cannot exceed your balance." });
            return;
        }

        setIsSubmitting(true);
        try {
            await requestWithdrawal(data.amount, data.payoutMethodId);
            toast({ title: 'Withdrawal Requested', description: 'Your request has been submitted for processing.' });
            handleClose();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to submit withdrawal request.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request a Withdrawal</DialogTitle>
                    <DialogDescription>
                        Transfer funds from your Agora balance to your payout account.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-6">
                    <div className="p-4 rounded-lg bg-secondary">
                        <p className="text-sm text-muted-foreground">Available Balance</p>
                        <p className="text-2xl font-bold">₵{balance.toFixed(2)}</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount to Withdraw (GHS)</FormLabel>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                placeholder="e.g., 500" 
                                                {...field}
                                                value={field.value ?? ''}
                                                className="pr-16" 
                                            />
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                                                onClick={() => form.setValue('amount', balance)}
                                            >
                                                Max
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="payoutMethodId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payout Method</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a payout method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {sellerPayoutMethods.map(method => (
                                                    <SelectItem key={method.id} value={method.id}>
                                                        <div className="flex items-center gap-2">
                                                          {method.type === 'bank' ? <Landmark className="size-4 text-muted-foreground" /> : <Smartphone className="size-4 text-muted-foreground" />}
                                                          <span>{`${method.type === 'bank' ? (method.bankName || 'Bank') : (method.mobileMoneyProvider || 'Mobile Money')} - ...${method.accountNumber.slice(-4)}`}</span>
                                                          {method.isDefault && <span className="text-xs bg-primary text-primary-foreground px-1.5 rounded-sm ml-auto">Default</span>}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <><LiquidLoader className="mr-2" />Submitting...</> : 'Submit Request'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
