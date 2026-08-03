
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { LiquidLoader } from '@/components/liquid-loader';
import { SiteHeader } from '@/components/site-header';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function CheckoutPage() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, addOrderFromCart, seller } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const total = useMemo(() => {
    return items.reduce((acc, item) => {
        const price = (item.product as Product).discountPrice ?? (item.product as Product).price;
        return acc + price * item.quantity;
    }, 0);
  }, [items]);
  
  const sellerId = items.length > 0 ? items[0].product.sellerId : null;

  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
    tx_ref: Date.now().toString(),
    amount: total,
    currency: 'GHS',
    payment_options: 'card,mobilemoneyghana',
    customer: {
      email: user?.email || '',
      phone_number: user?.phone || '',
      name: user?.name || '',
    },
    customizations: {
      title: 'Agora Store Purchase',
      description: `Payment for ${items.length} item(s)`,
      logo: '/agora-logo.png',
    },
  };

  if (!isClient) {
    return (
        <div>
            <SiteHeader />
            <div className="container mx-auto max-w-4xl py-12 px-4">
                <Skeleton className="w-full h-96" />
            </div>
        </div>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <SiteHeader />
        <div className="container mx-auto max-w-md py-24 text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-bold">Your Cart is Empty</h1>
            <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
            <Button asChild className="mt-6">
                <Link href="/">Start Shopping</Link>
            </Button>
        </div>
      </>
    );
  }

  return (
    <>
        <SiteHeader />
        <div className="container mx-auto max-w-6xl py-12 px-4">
            <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary sm:inline-flex">
                    Checkout
                  </div>
                  <h1 className="mt-4 text-3xl font-bold font-headline">Shopping Cart</h1>
                </div>
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/store/${sellerId}`} aria-label="Back to store"><ArrowLeft /></Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_0.95fr] items-start">
                <div className="space-y-4">
                    {items.map(({ product, quantity }) => (
                        <Card key={product.id} className="flex flex-col gap-4 rounded-3xl border p-4 md:flex-row md:items-center md:justify-between md:p-5">
                            <div className="flex min-w-0 gap-4 md:items-center">
                                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-3xl bg-muted">
                                    <Image src={(product as Product).images[0]} alt={product.name} fill className="object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-semibold">{product.name}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">GH₵{((product as Product).discountPrice ?? (product as Product).price).toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-muted/50 p-3 md:p-2">
                                <Input 
                                    type="number" 
                                    className="w-20 text-center" 
                                    value={quantity} 
                                    onChange={(e) => updateQuantity(product.id, parseInt(e.target.value, 10))}
                                    min="1"
                                    max={(product as Product).stock}
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeFromCart(product.id)} aria-label="Remove item">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>GH₵{total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>Calculated at next step</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>GH₵{total.toFixed(2)}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" size="lg" disabled={isLoading} onClick={() => {
                                handlePayment({
                                    callback: onPaymentSuccess,
                                    onClose: () => console.log('Payment modal closed'),
                                });
                            }}>
                                {isLoading ? <LiquidLoader /> : 'Proceed to Payment'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    </>
  );
}
