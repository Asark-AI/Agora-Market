'use client';

import { StorefrontSettingsTab } from '@/components/settings/storefront-settings-tab';
import { StorefrontPreview } from '@/components/storefront-preview';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export default function StorefrontPage() {
    return (
        <div className="-m-4 sm:-m-6 lg:-m-8 h-full">
            <ResizablePanelGroup direction="horizontal" className="w-full h-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="min-w-[350px]">
                    <StorefrontSettingsTab />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={75}>
                    <StorefrontPreview />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
