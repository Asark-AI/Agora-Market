
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useStorefrontEditor } from '@/hooks/use-storefront-editor';
import { Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { StorefrontClientPage } from '@/app/store/[sellerId]/client-page';

export function StorefrontPreview() {
    const { seller } = useAuth();
    const { products: editorProducts, ...customizations } = useStorefrontEditor((state) => state);
    const [view, setView] = useState<'desktop' | 'mobile'>('mobile');

    if (!customizations.isInitialized || !seller) {
        return <Skeleton className="h-full w-full" />;
    }

    return (
        <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_55%)]">
            <div className="flex items-center justify-center gap-2 border-b border-border/70 bg-background/90 px-3 py-2 backdrop-blur">
                <Button variant={view === 'mobile' ? 'secondary' : 'ghost'} size="sm" className="rounded-full" onClick={() => setView('mobile')}>
                    <Smartphone className="mr-2 size-4" /> Mobile
                </Button>
                <Button variant={view === 'desktop' ? 'secondary' : 'ghost'} size="sm" className="rounded-full" onClick={() => setView('desktop')}>
                    <Monitor className="mr-2 size-4" /> Desktop
                </Button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto p-3 sm:p-4">
                <div className={cn(
                    'overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-[0_20px_60px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 ease-out',
                    view === 'desktop' ? 'h-full w-full max-w-5xl' : 'h-[700px] w-[360px] max-w-full max-h-full shrink-0'
                )}>
                    <div className="h-full w-full overflow-y-auto">
                        <StorefrontClientPage
                            isEditorPreview
                            seller={seller}
                            products={editorProducts}
                            customizations={customizations}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
