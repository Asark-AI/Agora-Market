
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Wallet, Landmark, ArrowDown, ArrowUp, MoreHorizontal, Check, Star, ShieldAlert } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LiquidLoader } from '@/components/liquid-loader';
import type { PayoutMethod, Transaction } from '@/lib/types';

const AddPayoutMethodModal = dynamic(() => import('@/components/add-payout-method-modal'), {
  ssr: false,
  loading: () => null,
});

const WithdrawalRequestModal = dynamic(() => import('@/components/withdrawal-request-modal'), {
  ssr: false,
  loading: () => null,
});


const plans = [
    {
        name: 'Basic',
        id: 'basic' as const,
        price: 'Free',
        priceValue: 0,
        description: 'Ideal for new sellers testing the platform.',
        features: [
            'Up to 10 product listings',
            'Basic seller dashboard',
            'Manual order management',
            'Email support'
        ],
        isPopular: false,
    },
    {
        name: 'Premium',
        id: 'premium' as const,
        price: '₵50',
        priceValue: 50,
        description: 'For growing sellers who want more tools.',
        features: [
            'Up to 100 product listings',
            'Advanced analytics with charts',
            'Customer reviews and ratings',
            'Discount & coupon creation',
            'Priority email + live chat support',
            'Lower transaction fees',
        ],
        isPopular: true,
    },
    {
        name: 'Enterprise',
        id: 'enterprise' as const,
        price: 'Contact Us',
        priceValue: null,
        description: 'For large brands, exporters, and wholesalers.',
        features: [
            'Unlimited product listings',
            'Multi-region/warehouse support',
            'International shipping tools',
            'Dedicated account manager',
            'Bulk product import/export',
            'API access for external systems',
            '24/7 priority support',
        ],
        isPopular: false,
    },
];

type PlanId = 'basic' | 'premium' | 'enterprise';

const statusVariant: Record<Transaction['status'], 'default' | 'secondary' | 'destructive'> = {
  Completed: 'default',
  Pending: 'secondary',
  Failed: 'destructive',
};

function AccessDeniedPrompt() {
    return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full mb-4">
                    <ShieldAlert className="size-10" />
                </div>
                <CardTitle className="text-2xl font-headline">Access Denied</CardTitle>
                <CardDescription>
                    You do not have the necessary permissions to view this page. Please contact the store owner.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>This section is restricted to users with the 'Owner' role.</p>
            </CardContent>
        </Card>
    )
}

export default function SubscriptionPage() {
    const { user, seller, updateSeller, loading, sellerPayoutMethods, removePayoutMethod, setDefaultPayoutMethod } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
    
    const planToUpgradeTo = plans.find(p => p.id === selectedPlan);

    const flutterwaveConfig = {
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
        tx_ref: (new Date()).getTime().toString(),
        amount: planToUpgradeTo?.priceValue || 0,
        currency: 'GHS',
        payment_options: 'card,mobilemoneyghana,ussd,banktransfer',
        customer: {
          email: user?.email || '',
          phone_number: user?.phone || '',
          name: user?.name || '',
        },
        customizations: {
          title: 'Agora Seller Subscription',
          description: `Payment for ${planToUpgradeTo?.name} Plan`,
          logo: '/agora-logo.png',
        },
    };
    
    const handleFlutterwavePayment = useFlutterwave(flutterwaveConfig);
    
    const completeUpgrade = async () => {
        if (!seller || !selectedPlan || selectedPlan === 'basic') return;
        
        setIsPaymentLoading(true);
        const now = new Date();
        const nextPaymentDate = addDays(now, 30);
        
        try {
            await updateSeller(seller.id, { 
                subscriptionPlan: selectedPlan,
                lastPaymentDate: now.toISOString(),
                nextPaymentDate: nextPaymentDate.toISOString(),
            });
            
            toast({
                title: 'Upgrade Successful!',
                description: `Your subscription has been upgraded to the ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan.`,
            });
    
            setIsPaymentModalOpen(false);
            setSelectedPlan(null);
        } catch (error) {
            console.error("Could not update plan", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update your subscription plan.' });
        } finally {
            setIsPaymentLoading(false);
        }
    };
    
    const onPaymentSuccess = (response: any) => {
        console.log(response);
        closePaymentModal();
        completeUpgrade();
    };

    const onPaymentClose = () => {
        setIsPaymentLoading(false);
        setSelectedPlan(null);
    };

    const handlePlanChange = async (planId: PlanId) => {
        if (!seller || planId === seller.subscriptionPlan) return;
        
        setSelectedPlan(planId);

        if (planId === 'premium') {
             handleFlutterwavePayment({
                callback: onPaymentSuccess,
                onClose: onPaymentClose,
            });
        } else if (planId === 'basic') {
            setIsPaymentLoading(true);
            try {
                await updateSeller(seller.id, { 
                    subscriptionPlan: planId,
                    lastPaymentDate: undefined,
                    nextPaymentDate: undefined
                });
                toast({
                    title: 'Plan Updated!',
                    description: 'Your subscription has been changed to the Basic plan.',
                });
            } catch (error) {
                console.error("Could not update plan", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not update your subscription plan.' });
            } finally {
                setIsPaymentLoading(false);
                setSelectedPlan(null);
            }
        } else {
            router.push('/about');
        }
    };

    const [transactions] = useState<Transaction[]>([
        { id: 'txn-1', date: '2024-07-28T10:00:00Z', description: 'Weekly Payout', amount: -4520.50, status: 'Completed' },
        { id: 'txn-2', date: '2024-07-25T14:30:00Z', description: 'Platform Fee - July', amount: -150.00, status: 'Completed' },
        { id: 'txn-3', date: '2024-07-21T10:00:00Z', description: 'Weekly Payout', amount: -3890.00, status: 'Completed' },
        { id: 'txn-4', date: '2024-07-20T09:00:00Z', description: 'Premium Subscription Fee', amount: -50.00, status: 'Completed' },
    ]);
    
    const balance = 585.50;

    if (loading) {
        return <LiquidLoader />;
    }

    if (!user || user.role !== 'Owner') {
        return <AccessDeniedPrompt />;
    }

    if (!seller) {
        return (
             <div className="space-y-6">
                 <Skeleton className="h-48 w-full" />
                 <Skeleton className="h-40 w-full" />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }
    
    const currentPlanDetails = plans.find(p => p.id === seller.subscriptionPlan);

    return (
        <>
            <div className="space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-headline">Billing &amp; Subscription</h1>
                    <p className="text-muted-foreground mt-1">Manage your subscription, payout methods, and view transaction history.</p>
                </div>
            
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Account Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">₵{balance.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">Available for withdrawal.</p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => setIsWithdrawalModalOpen(true)}>
                                <ArrowUp className="mr-2 size-5" />
                                Request Withdrawal
                            </Button>
                        </CardFooter>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>Your current subscription details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 border rounded-lg bg-secondary/50">
                                <div>
                                    <h3 className="text-lg font-bold capitalize">{seller.subscriptionPlan} Plan</h3>
                                    <p className="text-sm text-muted-foreground">{currentPlanDetails?.description}</p>
                                </div>
                                {seller.nextPaymentDate && (
                                    <div className="text-left sm:text-right">
                                        <p className="text-sm font-semibold">Next bill: ₵{currentPlanDetails?.priceValue}</p>
                                        <p className="text-xs text-muted-foreground">on {format(new Date(seller.nextPaymentDate), 'dd MMM, yyyy')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold font-headline">Upgrade or Manage Plan</h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
                        {plans.map((plan) => (
                            <Card key={plan.id} className={cn(
                                "flex flex-col h-full",
                                plan.isPopular && "border-primary border-2 shadow-lg",
                                seller.subscriptionPlan === plan.id && "bg-muted"
                            )}>
                                <CardHeader className="relative">
                                    {plan.isPopular && (
                                        <Badge className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                            <Star className="mr-2 size-3" /> Most Popular
                                        </Badge>
                                    )}
                                    <CardTitle className="font-headline text-center text-3xl">{plan.name}</CardTitle>
                                    <CardDescription className="text-center">{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <div className="text-center">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        {plan.id !== 'basic' && plan.id !== 'enterprise' && <span className="text-muted-foreground">/month</span>}
                                    </div>
                                    <ul className="space-y-3 text-sm">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <Check className="size-5 text-primary flex-shrink-0 mt-0.5" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    {seller.subscriptionPlan === plan.id ? (
                                        <Button disabled className="w-full">
                                            Current Plan
                                        </Button>
                                    ) : (
                                        plan.id === 'enterprise' ? (
                                            <Button asChild className="w-full" variant={plan.isPopular ? 'default' : 'outline'}>
                                                <Link href="/about">Contact Sales</Link>
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={() => handlePlanChange(plan.id)} 
                                                className="w-full" 
                                                variant={plan.isPopular ? 'default' : 'outline'} 
                                                disabled={isPaymentLoading}
                                            >
                                                {isPaymentLoading && selectedPlan === plan.id ? (
                                                    <LiquidLoader />
                                                ) : (
                                                    plan.id === 'premium' ? `Upgrade &amp; Pay ${plan.price}` : 'Change Plan'
                                                )}
                                            </Button>
                                        )
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Payout Methods</CardTitle>
                            <CardDescription>The accounts where we send your earnings.</CardDescription>
                        </div>
                        <Button onClick={() => setIsPayoutModalOpen(true)}>
                            <PlusCircle className="mr-2 size-5" />
                            Add Payout Method
                        </Button>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-4">
                            {sellerPayoutMethods.map(method => {
                                const details = method.type === 'bank'
                                    ? `${method.bankName} - **** **** **** ${method.accountNumber.slice(-4)}`
                                    : `${method.mobileMoneyProvider} Mobile Money - ${method.accountNumber.slice(0, 3)} *** **${method.accountNumber.slice(-2)}`;

                                return (
                                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            {method.type === 'bank' ? <Landmark className="size-8 text-muted-foreground" /> : <Wallet className="size-8 text-muted-foreground" />}
                                            <div>
                                                <p className="font-semibold">{details}</p>
                                                <p className="text-sm text-muted-foreground capitalize">{method.accountName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {method.isDefault && <Badge>Default</Badge>}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {!method.isDefault && <DropdownMenuItem onClick={() => setDefaultPayoutMethod(method.id)}>Set as Default</DropdownMenuItem>}
                                                    <DropdownMenuItem className="text-destructive" onClick={() => removePayoutMethod(method.id)}>Remove</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                       </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>A record of all payouts, fees, and charges on your account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? transactions.map(txn => (
                                    <TableRow key={txn.id}>
                                        <TableCell>{format(new Date(txn.date), 'dd MMM, yyyy')}</TableCell>
                                        <TableCell className="font-medium">{txn.description}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[txn.status]}>{txn.status}</Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-semibold flex items-center justify-end gap-1 ${txn.amount >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                            {txn.amount >= 0 ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
                                            ₵{Math.abs(txn.amount).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            No transactions yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={isPaymentModalOpen} onOpenChange={(open) => { if(!isPaymentLoading) setIsPaymentModalOpen(open); }}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Your Upgrade</DialogTitle>
                        <DialogDescription>
                            You are about to pay {planToUpgradeTo?.price} for the {planToUpgradeTo?.name} plan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Button
                            size="lg"
                            className="w-full p-6"
                            onClick={() => {
                                handleFlutterwavePayment({
                                    callback: onPaymentSuccess,
                                    onClose: onPaymentClose,
                                });
                            }}
                            disabled={!flutterwaveConfig.public_key || isPaymentLoading}
                        >
                            {isPaymentLoading ? <LiquidLoader /> : 'Proceed to Payment'}
                        </Button>
                         {!flutterwaveConfig.public_key && (
                            <p className="text-xs text-center text-destructive mt-2">Flutterwave public key is not configured.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <AddPayoutMethodModal isOpen={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen} />
            <WithdrawalRequestModal isOpen={isWithdrawalModalOpen} onOpenChange={setIsWithdrawalModalOpen} balance={balance} />
        </>
    );
}
