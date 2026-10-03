
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/super/components/ui/card';
import { Label } from '@/app/super/components/ui/label';
import { Input } from '@/app/super/components/ui/input';
import { Button } from '@/app/super/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/super/components/ui/select';
import { Textarea } from '@/app/super/components/ui/textarea';
import { Calendar as CalendarIcon, Upload } from 'lucide-react';
import { Calendar } from "@/app/super/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/super/components/ui/popover"
import { cn } from '@/app/super/lib/utils';
import { format } from 'date-fns';
import * as React from 'react';

export default function NewCampaignPage() {
    const router = useRouter();
    const [startDate, setStartDate] = React.useState<Date>();
    const [endDate, setEndDate] = React.useState<Date>();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would handle form submission here
        console.log('Campaign created');
        router.push('/super/app/dashboard/marketing/campaigns');
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Create New Campaign</h1>
                <p className="mt-2 text-muted-foreground">Set up a new marketing campaign for the Agora platform.</p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Campaign Details</CardTitle>
                                <CardDescription>Provide the core information for your campaign.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="campaign-name">Campaign Name</Label>
                                    <Input id="campaign-name" placeholder="e.g., Summer Sizzler Sale" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="campaign-goal">Campaign Goal</Label>
                                    <Select>
                                        <SelectTrigger id="campaign-goal">
                                            <SelectValue placeholder="Select a goal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="website-traffic">Website Traffic</SelectItem>
                                            <SelectItem value="increase-sales">Increase Sales</SelectItem>
                                            <SelectItem value="generate-leads">Generate Leads</SelectItem>
                                            <SelectItem value="brand-awareness">Brand Awareness</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="campaign-description">Description (Optional)</Label>
                                    <Textarea id="campaign-description" placeholder="Briefly describe the campaign." />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Promotional Assets</CardTitle>
                                <CardDescription>Upload graphics, videos, or other assets for the campaign.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-sm text-muted-foreground">Drag & drop files here or</p>
                                    <Button variant="outline" className="mt-2">
                                        Browse Files
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Budget & Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Total Budget (GHC)</Label>
                                    <Input id="budget" type="number" placeholder="5000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Timeline</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "justify-start text-left font-normal",
                                                    !startDate && "text-muted-foreground"
                                                )}
                                                >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate ? format(startDate, "PPP") : <span>Start date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                mode="single"
                                                selected={startDate}
                                                onSelect={setStartDate}
                                                initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "justify-start text-left font-normal",
                                                    !endDate && "text-muted-foreground"
                                                )}
                                                >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {endDate ? format(endDate, "PPP") : <span>End date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                mode="single"
                                                selected={endDate}
                                                onSelect={setEndDate}
                                                initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                         <Button type="submit" size="lg" className="w-full">Save Campaign</Button>
                         <Button variant="outline" size="lg" className="w-full" onClick={() => router.back()}>Cancel</Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
