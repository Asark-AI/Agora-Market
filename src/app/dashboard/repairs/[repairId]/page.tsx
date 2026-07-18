
'use client';

import { useState, useEffect } from 'react';
import { useRouter, notFound } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { RepairRequest, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
    Clock, 
    Smartphone, 
    Wrench, 
    User, 
    Phone, 
    Mail, 
    MapPin, 
    Calendar, 
    AlertTriangle, 
    DollarSign,
    MessageSquare,
    Check,
    X,
    FileText,
    ListChecks,
    Upload,
    Paperclip,
    Send
} from 'lucide-react';
import Link from 'next/link';
import { usePageLoaderStore } from '@/hooks/use-page-loader';

const urgencyVariant: Record<RepairRequest['urgency'], 'default' | 'secondary' | 'destructive'> = {
    Normal: 'secondary',
    High: 'default',
    Emergency: 'destructive',
};

const repairStatuses: OrderStatus[] = [
    'pending', 
    'awaiting-quote', 
    'in-progress', 
    'awaiting-parts', 
    'ready-for-pickup', 
    'completed', 
    'cancelled'
];

const statusText: Record<OrderStatus, string> = {
    'in-progress': 'In Progress',
    'awaiting-quote': 'Awaiting Quote',
    'awaiting-parts': 'Awaiting Parts',
    'ready-for-pickup': 'Ready for Pickup',
    'fulfilled': 'Fulfilled',
    'delivered': 'Delivered',
    pending: 'New Request',
    cancelled: 'Cancelled',
    shipped: 'Shipped',
    upcoming: 'Upcoming',
    completed: 'Completed',
};

export default function RepairDetailsPage({ params }: { params: { repairId: string } }) {
    const { sellerRepairRequests, loading, updateRepairRequest } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [request, setRequest] = useState<RepairRequest | null>(null);
    const [status, setStatus] = useState<OrderStatus | ''>('');
    const [quote, setQuote] = useState<number | string>('');
    const { show: showLoader } = usePageLoaderStore();


    useEffect(() => {
        if (!loading) {
            const foundRequest = sellerRepairRequests.find(r => r.id === params.repairId);
            if (foundRequest) {
                setRequest(foundRequest);
                setStatus(foundRequest.status);
                setQuote(foundRequest.quote ?? '');
            } else {
                notFound();
            }
        }
    }, [params.repairId, sellerRepairRequests, loading, router]);
    
    const handleSaveChanges = () => {
        if (!request || !status) return;
        const numericQuote = typeof quote === 'string' ? parseFloat(quote) : quote;
        updateRepairRequest(request.id, { status, quote: isNaN(numericQuote) ? undefined : numericQuote });
        toast({
            title: 'Job Updated',
            description: `Repair ticket #${request.ticketNumber} has been updated.`,
        });
    };
    
    const handleDeclineJob = () => {
        if (!request) return;
        updateRepairRequest(request.id, { status: 'cancelled' });
        toast({
            title: 'Job Declined',
            description: `Repair ticket #${request.ticketNumber} has been declined.`,
            variant: 'destructive',
        });
    }

    if (loading || !request) {
        return (
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-48" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-96" />
                </div>
            </div>
        )
    }

    const isJobComplete = request.status === 'completed' || request.status === 'delivered';

    return (
        <div className="max-w-6xl mx-auto">
             <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <FileText className="size-8 text-primary" />
                        Repair Ticket #{request.ticketNumber}
                    </h1>
                    <p className="text-muted-foreground">Review details, provide a quote, and manage the job status.</p>
                </div>
                 <Button asChild variant="outline" onClick={showLoader}>
                    <Link href="/dashboard/repairs">
                        Back to All Requests
                    </Link>
                </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Smartphone /> Item & Issue Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-muted-foreground">Device Type</p><p className="font-semibold">{request.deviceType}</p></div>
                                <div><p className="text-muted-foreground">Brand & Model</p><p className="font-semibold">{request.brandModel}</p></div>
                                {request.serialNumber && <div><p className="text-muted-foreground">Serial Number</p><p className="font-semibold">{request.serialNumber}</p></div>}
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-2">Detailed Issue Description</h4>
                                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">{request.issueSummary}</p>
                            </div>
                            {request.photos && request.photos.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2">Photos from Customer</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                        {request.photos.map((photo, index) => (
                                            <a href={photo} target="_blank" rel="noreferrer" key={index}>
                                                <Image src={photo} alt={`Issue photo ${index + 1}`} width={100} height={100} className="rounded-md object-cover aspect-square border" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ListChecks /> Progress & Updates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                {(request.updates && request.updates.length > 0) ? (
                                    request.updates.map(update => (
                                        <div key={update.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center"><Check className="size-4" /></div>
                                                <div className="w-px h-full bg-border"></div>
                                            </div>
                                            <div>
                                                <p className="font-semibold">{update.update}</p>
                                                <p className="text-sm text-muted-foreground">{format(new Date(update.date), 'dd MMM yyyy, h:mm a')}</p>
                                                {update.photo && (
                                                    <a href={update.photo} target="_blank" rel="noreferrer">
                                                        <Image src={update.photo} alt="Progress update photo" width={150} height={100} className="mt-2 rounded-md border aspect-video object-cover" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No updates posted yet.</p>
                                )}
                            </div>
                             <Separator />
                             <div className="space-y-2">
                                <Label htmlFor="update-message">Post a new update for the customer</Label>
                                <Textarea id="update-message" placeholder="e.g., The replacement screen has arrived and we are beginning the repair." />
                                <div className="flex justify-between items-center">
                                    <Button variant="outline" size="sm">
                                        <Upload className="mr-2 size-4" /> Upload Photo
                                    </Button>
                                    <Button size="sm">
                                        <Send className="mr-2 size-4" /> Post Update
                                    </Button>
                                </div>
                             </div>
                        </CardContent>
                    </Card>

                    {isJobComplete && (
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FileText /> Invoice</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {request.invoiceUrl ? (
                                    <Button asChild variant="outline">
                                        <a href={request.invoiceUrl} target="_blank" rel="noreferrer">
                                            <Paperclip className="mr-2 size-4"/> View Attached Invoice
                                        </a>
                                    </Button>
                                ) : (
                                     <div className="space-y-2">
                                        <Label htmlFor="invoice-upload">Upload Final Invoice/Receipt</Label>
                                        <div className="flex gap-2">
                                            <Input id="invoice-upload" type="file" />
                                            <Button>
                                                <Upload className="mr-2 size-4" /> Attach Invoice
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                </div>

                <div className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wrench /> Job Management</CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="job-status">Job Status</Label>
                                <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                                    <SelectTrigger id="job-status">
                                        <SelectValue placeholder="Update status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {repairStatuses.map(s => (
                                            <SelectItem key={s} value={s} className="capitalize">{statusText[s]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quote-amount">Estimated Quote (GHS)</Label>
                                <Input id="quote-amount" type="number" placeholder="e.g., 250.00" value={quote ?? ''} onChange={(e) => setQuote(e.target.value)}/>
                            </div>
                             <div className="flex flex-wrap gap-2">
                                <Button onClick={handleSaveChanges}>
                                    <MessageSquare className="mr-2 size-4" /> Save & Notify Customer
                                </Button>
                                <Button variant="destructive" onClick={handleDeclineJob}>
                                    <X className="mr-2 size-4" /> Decline Job
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User /> Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Phone className="size-4 text-muted-foreground" />
                                <span className="font-medium">{request.customerContact}</span>
                            </div>
                            {request.customerEmail && (
                                <div className="flex items-center gap-2">
                                    <Mail className="size-4 text-muted-foreground" />
                                    <a href={`mailto:${request.customerEmail}`} className="text-primary hover:underline">{request.customerEmail}</a>
                                </div>
                            )}
                             <div className="flex items-start gap-2">
                                <MapPin className="size-4 text-muted-foreground mt-1" />
                                <div>
                                    <p className="font-medium">{request.locationType}</p>
                                    {request.locationType === 'On-site Visit' && <p className="text-muted-foreground">{request.address}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2"><Clock /> Scheduling</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="size-4 text-muted-foreground" />
                                <p>Urgency: <Badge variant={urgencyVariant[request.urgency]}>{request.urgency}</Badge></p>
                            </div>
                             <div className="flex items-center gap-2">
                                <Calendar className="size-4 text-muted-foreground" />
                                <p>Preferred Date: <span className="font-semibold">{request.preferredDate ? format(new Date(request.preferredDate), 'E, dd MMM yyyy @ h:mm a') : 'Not specified'}</span></p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

    
