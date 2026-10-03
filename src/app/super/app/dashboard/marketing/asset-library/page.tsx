
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/super/components/ui/card';
import { Input } from '@/app/super/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/super/components/ui/tabs';
import { getAssets, type Asset } from '@/app/super/services/assets';
import { Search, Upload, FileText, Video, Image as ImageIcon, Download, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/app/super/components/ui/button';
import { Skeleton } from '@/app/super/components/ui/skeleton';

const AssetIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'image': return <ImageIcon className="h-8 w-8 text-muted-foreground" />;
        case 'video': return <Video className="h-8 w-8 text-muted-foreground" />;
        case 'document': return <FileText className="h-8 w-8 text-muted-foreground" />;
        default: return <FileText className="h-8 w-8 text-muted-foreground" />;
    }
}

export default function AssetLibraryPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getAssets();
            setAssets(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredAssets = assets
        .filter(asset => activeTab === 'all' || asset.category.toLowerCase() === activeTab)
        .filter(asset => asset.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Creative Asset Library</h1>
                    <p className="mt-2 text-muted-foreground">Search, manage, and download all your marketing assets.</p>
                </div>
                <Button>
                    <Upload className="mr-2 h-4 w-4" /> Upload Asset
                </Button>
            </div>
            
            <Card>
                <CardContent className="p-4">
                    <div className="flex justify-between items-center gap-4">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search assets..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="images">Images</TabsTrigger>
                                <TabsTrigger value="videos">Videos</TabsTrigger>
                                <TabsTrigger value="logos">Logos</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {[...Array(12)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square w-full" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {filteredAssets.map(asset => (
                        <Card key={asset.id} className="group relative overflow-hidden">
                            <div className="aspect-square w-full bg-muted flex items-center justify-center">
                                {asset.type === 'image' || asset.type === 'logo' ? (
                                    <Image src={asset.thumbnailUrl.src} alt={asset.name} layout="fill" objectFit="cover" data-ai-hint={asset.thumbnailUrl.hint} />
                                ) : (
                                    <AssetIcon type={asset.type} />
                                )}
                            </div>
                            <div className="p-3 text-sm">
                                <p className="font-semibold truncate">{asset.name}</p>
                                <p className="text-muted-foreground capitalize">{asset.type}</p>
                            </div>
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon"><Download className="h-4 w-4"/></Button>
                                    <Button variant="outline" size="icon"><LinkIcon className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
             { !loading && filteredAssets.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <p className="text-lg font-semibold">No assets found</p>
                    <p>Try adjusting your search or filters.</p>
                </div>
             )}

        </div>
    );
}
