'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/super/components/ui/card';
import { Button } from '@/app/super/components/ui/button';
import { CheckCircle, Circle, FileCode, Users, Settings, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const tourSteps = [
    { name: 'Connect a data source', completed: true, icon: FileCode, href: '#' },
    { name: 'Manage users and roles', completed: true, icon: Users, href: '/dashboard/users' },
    { name: 'Configure your settings', completed: false, icon: Settings, href: '/dashboard/settings' },
];

export function GettingStarted() {
    return (
        <Card className="bg-gradient-to-br from-primary/10 via-card to-card relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
             <CardHeader>
                <CardTitle className="text-3xl tracking-tight font-headline">Welcome to Agora</CardTitle>
                <CardDescription className="max-w-2xl">
                    Your control room for the Agora ecosystem. Here are a few steps to get you started.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {tourSteps.map(step => (
                        <Link href={step.href} key={step.name}>
                            <div className="flex items-center gap-4 p-4 rounded-lg border bg-background/50 hover:bg-background transition-colors cursor-pointer">
                                {step.completed ? (
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                ) : (
                                    <Circle className="h-6 w-6 text-muted-foreground/50" />
                                )}
                                <div>
                                    <p className="font-semibold">{step.name}</p>
                                    <p className="text-sm text-muted-foreground">Get started</p>
                                </div>
                                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
                            </div>
                        </Link>
                    ))}
                </div>
                 <Button variant="outline">Take a full tour</Button>
            </CardContent>
        </Card>
    );
}
