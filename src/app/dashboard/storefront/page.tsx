'use client';

import { StorefrontEditorMobile } from '@/components/settings/storefront-editor-mobile';
import { StorefrontPreview } from '@/components/storefront-preview';
import { useIsMobile } from '@/hooks/use-mobile';

export default function StorefrontPage() {
    const isMobile = useIsMobile();

    return (
        <div className="-m-4 min-h-[calc(100vh-6rem)] bg-background sm:-m-6 lg:-m-8">
            {isMobile ? (
                <StorefrontEditorMobile />
            ) : (
                <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col lg:flex-row">
                    <div className="w-full border-b bg-background lg:w-[420px] lg:border-b-0 lg:border-r">
                        <StorefrontEditorMobile />
                    </div>
                    <div className="flex-1 bg-muted/30">
                        <StorefrontPreview />
                    </div>
                </div>
            )}
        </div>
    );
}
