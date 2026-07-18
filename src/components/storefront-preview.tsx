
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
    const { products: editorProducts, ...customizations } = useStorefrontEditor(state => state);
    const [view, setView] = useState<'desktop' | 'mobile'>('desktop');

    if (!customizations.isInitialized || !seller) {
        return <Skeleton className="w-full h-full" />;
    }

    return (
        <div className="h-full flex flex-col bg-muted">
            <div className="flex-shrink-0 bg-background p-2 border-b flex justify-center items-center gap-2">
                <Button variant={view === 'desktop' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('desktop')}>
                    <Monitor className="size-5" />
                </Button>
                <Button variant={view === 'mobile' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('mobile')}>
                    <Smartphone className="size-5" />
                </Button>
            </div>
            <div className="flex-grow p-4 flex items-center justify-center">
                <div className={cn(
                    "bg-background rounded-lg border overflow-hidden shadow-md transition-all duration-300 ease-in-out",
                    view === 'desktop' ? 'w-full h-full' : 'w-[375px] h-[667px] max-w-full max-h-full flex-shrink-0'
                )}>
                    <div className="w-full h-full overflow-y-auto">
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
