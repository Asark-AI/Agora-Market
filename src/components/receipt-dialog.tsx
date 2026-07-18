
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/app-logo';
import { format } from 'date-fns';
import type { Order, Seller } from '@/lib/types';
import { Printer } from 'lucide-react';

interface ReceiptDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    order: Order;
    seller: Seller;
}

export function ReceiptDialog({ isOpen, onOpenChange, order, seller }: ReceiptDialogProps) {
    const printReceipt = () => {
        window.open(`/dashboard/orders/${order.id}/receipt`, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Sale Complete</DialogTitle>
                </DialogHeader>
                <div className="text-center font-mono text-xs text-black bg-white p-4 rounded-md shadow-inner">
                    <div className="text-center mb-4">
                        <AppLogo className="mx-auto h-10 w-10" />
                        <h2 className="font-bold text-base">{seller.name}</h2>
                        <p>{seller.pickupLocation}</p>
                    </div>
                    <div className="text-left border-t border-dashed border-black pt-2">
                        <p>Order: #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p>Date: {format(new Date(order.date), 'dd/MM/yy HH:mm')}</p>
                    </div>
                     <div className="text-left border-t border-dashed border-black mt-2 pt-2">
                        {order.items.map((item, i) => (
                           <div key={i}>
                               <p>{item.quantity} x Item Name</p>
                               <div className="flex justify-between">
                                   <span>@ ₵{item.price.toFixed(2)}</span>
                                   <span>₵{(item.price * item.quantity).toFixed(2)}</span>
                               </div>
                           </div>
                        ))}
                    </div>
                    <div className="text-left font-bold border-t border-dashed border-black mt-2 pt-2">
                         <div className="flex justify-between">
                            <span>TOTAL</span>
                            <span>₵{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                    <p className="mt-4">Thank you!</p>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={printReceipt}><Printer className="mr-2 size-4" /> Print Full Receipt</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
