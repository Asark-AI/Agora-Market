
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/super/components/ui/card';
import { Input } from '@/app/super/components/ui/input';
import { pageContentConfig } from '@/app/super/lib/config';
import { Search } from 'lucide-react';
import Link from 'next/link';

const resourceKeys = [
    'marketing-guides',
    'brand-guide',
    'customer-service-guidelines',
    'video-tutorials',
    'troubleshooting-guides',
    'faq',
];

const resources = resourceKeys.map(key => ({
    id: key,
    ...pageContentConfig[key]
}));

export default function ResourcesPage() {

    return (
        <div className="space-y-8">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Training & Resources</h1>
                    <p className="mt-2 text-muted-foreground">Your central library for guides, SOPs, and brand materials.</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search resources..." className="pl-10 text-base py-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => (
                    <Link href="#" key={resource.id}>
                        <Card className="hover:border-primary transition-colors h-full">
                            <CardHeader>
                                <CardTitle>{resource.title}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {typeof resource.content === 'string' ? resource.content : 'A collection of resources.'}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
