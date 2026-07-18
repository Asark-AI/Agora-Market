
'use client';

import { useEffect, useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Seller } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UploadCloud, Car } from 'lucide-react';
import { AppLogo } from '@/components/app-logo';
import { appConfig } from '@/lib/config';
import { LiquidLoader } from '@/components/liquid-loader';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/auth-modal'), { ssr: false });

const MAX_IMAGES = 3;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileSchema = z.custom<FileList>()
  .optional()
  .refine(files => !files || files.length <= MAX_IMAGES, `You can upload a maximum of ${MAX_IMAGES} images.`)
  .refine(files => !files || Array.from(files).every(file => file.size <= MAX_FILE_SIZE), `Each file must be less than ${MAX_FILE_SIZE_MB}MB.`)
  .refine(files => !files || Array.from(files).every(file => ACCEPTED_IMAGE_TYPES.includes(file.type)), 'Only .jpg, .jpeg, .png and .webp files are accepted.');

const formSchema = z.object({
    deviceType: z.string().min(1, 'Please select a device type.'),
    brand: z.string().min(2, 'Brand is required.'),
    model: z.string().min(1, 'Model is required.'),
    serialNumber: z.string().optional(),
    photos: fileSchema,
    issueSummary: z.string().min(20, 'Please describe the issue in at least 20 characters.'),
    urgency: z.enum(['Normal', 'Urgent', 'Critical']),
    warrantyStatus: z.enum(['In Warranty', 'Out of Warranty', 'Unknown']),
    servicePreference: z.enum(['Shop Drop-off', 'Pick-up']),
    address: z.string().optional(),
    customerName: z.string().min(2, 'Your name is required.'),
    customerContact: z.string().min(10, 'A valid phone number is required.'),
    alternativeContact: z.string().optional(),
    preferredContactMethod: z.enum(['Phone', 'Email', 'WhatsApp']),
}).superRefine((data, ctx) => {
    if (data.servicePreference === 'Pick-up' && (!data.address || data.address.length < 10)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'A valid address is required for the pick-up service.',
            path: ['address'],
        });
    }
});


type RepairFormValues = z.infer<typeof formSchema>;

const deviceTypes = ["Smartphone", "Laptop", "Tablet", "Desktop PC", "Television", "Washing Machine", "Air Conditioner", "Microwave", "Other"];

async function getSeller(sellerId: string): Promise<Seller | null> {
    try {
        if (!db) {
            return null;
        }

        const docRef = doc(db, 'sellers', sellerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().businessType === 'repairs') {
            return { id: docSnap.id, ...docSnap.data() } as Seller;
        }
        return null;
    } catch (error) {
        console.error("Error fetching seller:", error);
        return null;
    }
}

export default function RequestRepairPage({ params }: { params: { sellerId: string } }) {
    const { user, addRepairRequest } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [seller, setSeller] = useState<Seller | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const form = useForm<RepairFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            deviceType: '',
            brand: '',
            model: '',
            serialNumber: '',
            issueSummary: '',
            urgency: 'Normal',
            warrantyStatus: 'Unknown',
            servicePreference: 'Shop Drop-off',
            customerName: '',
            customerContact: '',
            alternativeContact: '',
            preferredContactMethod: 'Phone',
            address: '',
        },
    });

    useEffect(() => {
        const fetchSeller = async () => {
            const sellerData = await getSeller(params.sellerId);
            if (sellerData) {
                setSeller(sellerData);
            } else {
                notFound();
            }
            setLoading(false);
        };
        fetchSeller();
    }, [params.sellerId]);
    
    useEffect(() => {
        if (user) {
            form.reset({
                ...form.getValues(),
                customerName: user.name || '',
                customerContact: user.phone || '',
                alternativeContact: user.email || '',
            });
        }
    }, [user, form]);
    
    const onSubmit: SubmitHandler<RepairFormValues> = async (data) => {
        if (!seller) {
             toast({ variant: 'destructive', title: 'Error', description: 'Seller not found. Cannot submit request.' });
             return;
        }
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        
        setSubmitting(true);
        
        try {
            await addRepairRequest(seller.id, user.id, data, data.photos);
            toast({
                title: "Request Submitted!",
                description: "Your repair request has been sent. The seller will contact you shortly."
            });
            router.push(`/store/${seller.id}`);
        } catch (error) {
            console.error("Failed to submit repair request:", error);
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not save your repair request. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto max-w-2xl py-12 px-4 space-y-6">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (!seller) return null;
    
    return (
        <>
            <div className="bg-muted min-h-screen">
                <div className="container mx-auto max-w-3xl py-12 px-4">
                    <div className="flex flex-col items-center text-center mb-8">
                        <AppLogo className="h-16 w-16 text-primary mb-4" />
                        <h1 className="text-3xl font-bold font-headline">Repair Request for {seller.name}</h1>
                        <p className="text-muted-foreground mt-2">
                            Please provide details about the item you need repaired.
                        </p>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>1. Item & Issue Details</CardTitle>
                                    <CardDescription>Describe the item that needs repair and the problem it has.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField control={form.control} name="deviceType" render={({ field }) => (<FormItem><FormLabel>Device Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select the type of device" /></SelectTrigger></FormControl><SelectContent>{deviceTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="e.g., Samsung" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g., Galaxy S21" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={form.control} name="serialNumber" render={({ field }) => (<FormItem><FormLabel>Serial Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., SN0123456789" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="issueSummary" render={({ field }) => (<FormItem><FormLabel>Describe the Issue</FormLabel><FormControl><Textarea placeholder="Describe the problem you are experiencing in detail." {...field} rows={5} /></FormControl><FormMessage /></FormItem>)} />

                                    <FormField control={form.control} name="photos" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Upload Photos of the issue</FormLabel>
                                            <FormControl>
                                                <Input type="file" multiple accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={e => field.onChange(e.target.files)} />
                                            </FormControl>
                                            <FormDescription>Up to {MAX_IMAGES} images, {MAX_FILE_SIZE_MB}MB each</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="urgency" render={({ field }) => (<FormItem><FormLabel>Urgency Level</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4 pt-2"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Normal" id="urgency-normal" /></FormControl><Label htmlFor="urgency-normal" className="font-normal">Normal</Label></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Urgent" id="urgency-urgent" /></FormControl><Label htmlFor="urgency-urgent" className="font-normal">Urgent</Label></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Critical" id="urgency-critical" /></FormControl><Label htmlFor="urgency-critical" className="font-normal">Critical</Label></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="warrantyStatus" render={({ field }) => (<FormItem><FormLabel>Warranty Status</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4 pt-2"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="In Warranty" id="warranty-in" /></FormControl><Label htmlFor="warranty-in" className="font-normal">In Warranty</Label></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Out of Warranty" id="warranty-out" /></FormControl><Label htmlFor="warranty-out" className="font-normal">Out of Warranty</Label></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Unknown" id="warranty-unknown" /></FormControl><Label htmlFor="warranty-unknown" className="font-normal">Unknown</Label></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </CardContent>
                            </Card>
                            
                             <Card>
                                <CardHeader><CardTitle>2. Service Preference</CardTitle><CardDescription>How would you like to get your item to the repairer?</CardDescription></CardHeader>
                                <CardContent>
                                     <FormField control={form.control} name="servicePreference" render={({ field }) => (<FormItem><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Label htmlFor="drop-off" className="flex flex-col p-4 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="Shop Drop-off" id="drop-off" className="sr-only" /><span className="font-semibold">Bring to Repair Shop</span><span className="text-sm text-muted-foreground mt-1">I will bring the item to the repairer's location.</span></Label><Label htmlFor="on-site" className="flex flex-col p-4 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="Pick-up" id="on-site" className="sr-only" /><span className="font-semibold flex items-center gap-2">Request Pick-up <Car className="size-4" /></span><span className="text-sm text-muted-foreground mt-1">The repairer should come to my location.</span></Label></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                    {form.watch('servicePreference') === 'Pick-up' && <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="mt-4"><FormLabel>Your Full Address for Pick-up</FormLabel><FormControl><Input placeholder="Please provide your house number, street, and town" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>3. Contact Information</CardTitle><CardDescription>How the seller can reach you.</CardDescription></CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Your Name</FormLabel><FormControl><Input placeholder="New User" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="customerContact" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="e.g., 0241234567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="alternativeContact" render={({ field }) => (<FormItem><FormLabel>Alternative Email / WhatsApp (Optional)</FormLabel><FormControl><Input placeholder="e.g., secondary@email.com or WhatsApp number" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="preferredContactMethod" render={({ field }) => (<FormItem><FormLabel>Preferred Contact Method</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4 pt-2"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Phone" id="contact-phone"/></FormControl><Label htmlFor="contact-phone" className="font-normal">Phone</Label></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Email" id="contact-email"/></FormControl><Label htmlFor="contact-email" className="font-normal">Email</Label></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="WhatsApp" id="contact-whatsapp"/></FormControl><Label htmlFor="contact-whatsapp" className="font-normal">WhatsApp</Label></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                </CardContent>
                            </Card>
                            
                            <div className="flex justify-end">
                                <Button type="submit" size="lg" disabled={submitting}>
                                    {submitting ? <><LiquidLoader className="mr-2"/> Submitting...</> : "Submit Repair Request"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
            <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultTab="login" />
        </>
    );
}
