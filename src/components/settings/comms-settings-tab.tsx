
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { LiquidLoader } from '@/components/liquid-loader';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Bot } from 'lucide-react';
import Link from 'next/link';
import { usePageLoaderStore } from '@/hooks/use-page-loader';

const formSchema = z.object({
  contactButtonEnabled: z.boolean(),
  contactMethods: z.array(z.string()),
  whatsappNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CommsSettingsTab() {
    const { seller, updateSeller, loading } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const { show: showLoader } = usePageLoaderStore();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            contactButtonEnabled: true,
            contactMethods: [],
            whatsappNumber: '',
        }
    });

    useEffect(() => {
        if (seller) {
            form.reset({
                contactButtonEnabled: seller.customization?.features?.contact ?? true,
                contactMethods: seller.customization?.features?.contactMethods ?? ['email'],
                whatsappNumber: seller.whatsappNumber ?? ''
            });
        }
    }, [seller, form]);
    
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!seller) return;
        setIsSaving(true);
        
        try {
            await updateSeller(seller.id, {
                whatsappNumber: data.whatsappNumber,
                customization: {
                    ...(seller.customization || {}),
                    features: {
                        ...(seller.customization?.features || {}),
                        contact: data.contactButtonEnabled,
                        contactMethods: data.contactMethods as any[],
                    }
                }
            });
            toast({
                title: "Settings Saved",
                description: "Your communication settings have been updated.",
            });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to save settings." });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-32" />
            </div>
        );
    }
    
    const contactMethods = form.watch('contactMethods');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Communication Channels</CardTitle>
                        <CardDescription>Choose how buyers can contact you on your storefront page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="contactButtonEnabled" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Show Contact Button</FormLabel>
                                    <FormDescription>Display a "Contact Seller" button on your storefront.</FormDescription>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                        
                        <FormField
                            control={form.control}
                            name="contactMethods"
                            render={({ field }) => (
                                <FormItem className="space-y-4 p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <FormLabel className="text-base">Enabled Contact Methods</FormLabel>
                                        <FormDescription>Select the methods buyers can use to reach you.</FormDescription>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                        {(['email', 'phone', 'whatsapp', 'sms'] as const).map((item) => (
                                            <FormItem key={item} className="flex flex-row items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(item)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), item])
                                                                : field.onChange(field.value?.filter((value) => value !== item))
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal capitalize">{item}</FormLabel>
                                            </FormItem>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {contactMethods?.includes('whatsapp') && (
                            <FormField
                            control={form.control}
                            name="whatsappNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>WhatsApp Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., +233201866404" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormDescription>Required if you enable WhatsApp. Include country code.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Assistant</CardTitle>
                        <CardDescription>Configure your AI-powered assistant to answer customer questions automatically.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg bg-secondary/50">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 text-primary p-2 rounded-full">
                                    <Bot className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">AI Messaging Assistant</h3>
                                    <p className="text-sm text-muted-foreground">Automate responses and provide instant support.</p>
                                </div>
                            </div>
                            <Button asChild variant="outline" className="w-full sm:w-auto" onClick={showLoader}>
                                <Link href="/dashboard/messages">
                                    Configure <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving ? <><LiquidLoader className="mr-2"/>Saving...</> : 'Save Settings'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
