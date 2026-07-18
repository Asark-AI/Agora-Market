
'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PageLoader } from '@/components/page-loader';
import { AppLogo } from '@/components/app-logo';
import { format } from 'date-fns';
import type { Product, ServiceProduct } from '@/lib/types';

export default function ReceiptPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const { seller, sellerOrders, sellerProducts, loading } = useAuth();
    const printTriggered = useRef(false);

    const order = sellerOrders.find(o => o.id === orderId);
    
    useEffect(() => {
        if (!loading && order && !printTriggered.current) {
            printTriggered.current = true;
            setTimeout(() => window.print(), 500); // Delay to allow rendering
        }
    }, [loading, order]);

    if (loading || !order || !seller) {
        return <PageLoader />;
    }

    const customer = { name: 'Walk-in Customer' }; // Hardcoding for now, as we don't have full customer object in order.

    const getItemName = (productId: string) => {
        const product = sellerProducts.find(p => p.id === productId);
        return product?.name || 'Unknown Item';
    };
    
    // Basic inline styles for thermal printers (often narrow)
    const styles = {
        wrapper: { maxWidth: '300px', margin: '0 auto', fontFamily: 'monospace', fontSize: '12px', color: '#000' },
        header: { textAlign: 'center' as 'center', marginBottom: '1rem' },
        section: { marginBottom: '1rem', borderTop: '1px dashed #000', paddingTop: '0.5rem' },
        itemRow: { display: 'flex', justifyContent: 'space-between' },
        totalRow: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' as 'bold', marginTop: '1rem' },
        footer: { textAlign: 'center' as 'center', marginTop: '1.5rem', fontSize: '10px' },
    };

    return (
        <div style={styles.wrapper}>
            <header style={styles.header}>
                <AppLogo className="mx-auto h-12 w-12" />
                <h1 style={{ fontSize: '16px', fontWeight: 'bold' }}>{seller.name}</h1>
                <p>{seller.pickupLocation}</p>
                <p>{seller.phone}</p>
            </header>

            <section style={styles.section}>
                <p>Order ID: {order.id.slice(0, 8).toUpperCase()}</p>
                <p>Date: {format(new Date(order.date), 'dd/MM/yyyy HH:mm')}</p>
                <p>Cashier: {seller.name}</p>
                <p>Customer: {customer.name}</p>
            </section>

            <section style={styles.section}>
                {order.items.map(item => (
                    <div key={item.productId} style={{ marginBottom: '0.5rem' }}>
                        <p>{getItemName(item.productId)}</p>
                        <div style={styles.itemRow}>
                            <span>{item.quantity} x ₵{item.price.toFixed(2)}</span>
                            <span>₵{(item.quantity * item.price).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </section>

            <section style={styles.section}>
                 <div style={styles.totalRow}>
                    <span>Total</span>
                    <span>₵{order.total.toFixed(2)}</span>
                </div>
            </section>

            <footer style={styles.footer}>
                <p>Thank you for your purchase!</p>
            </footer>
        </div>
    );
}
