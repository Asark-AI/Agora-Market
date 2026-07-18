'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Seller } from '@/lib/types';
import { estimateManufacturingCost } from '@/ai/flows/estimate-manufacturing-cost';
import { generateNda } from '@/ai/flows/generate-nda';
import { getSuggestedQuestions } from '@/ai/flows/get-suggested-questions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LiquidLoader } from '@/components/liquid-loader';
import { Sparkles, FileText, Upload, Lightbulb } from 'lucide-react';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';

interface InquiryFormProps {
  seller: Seller;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const step1Schema = z.object({
  productName: z.string().min(3, 'Product name is required.'),
  quantity: z.coerce.number().int().positive('Please enter a valid quantity.'),
  message: z.string().min(20, 'Message must be at least 20 characters.'),
  specifications: z.string().optional(),
  files: z.custom<FileList>().optional(),
});


export function InquiryForm({ seller, open, onOpenChange }: InquiryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [estimatedCost, setEstimatedCost] = useState<string | null>(null);
  const [ndaText, setNdaText] = useState<string | null>(null);

  const form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { productName: '', quantity: 100, message: '', specifications: '' },
  });

  const handleSuggestQuestions = async () => {
    const productName = form.getValues('productName');
    if (!productName) {
      form.trigger('productName');
      return;
    }
    setIsLoading(true);
    try {
      const { questions } = await getSuggestedQuestions({ productName });
      setSuggestedQuestions(questions);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate questions.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEstimateCost = async () => {
    const isStep1Valid = await form.trigger();
    if (!isStep1Valid) return;
    setIsLoading(true);
    try {
      const values = form.getValues();
      const result = await estimateManufacturingCost({
        productName: values.productName,
        quantity: values.quantity,
        specifications: values.specifications || 'Standard specifications',
      });
      setEstimatedCost(`~${result.estimatedCost.toLocaleString()} ${result.currency} (${result.disclaimer})`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not estimate cost.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNda = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const productName = form.getValues('productName');
    if (!productName) {
      form.trigger('productName');
      return;
    }
    setIsLoading(true);
    try {
      const result = await generateNda({
        disclosingParty: user.name,
        receivingParty: seller.name,
        projectName: productName,
      });
      setNdaText(result.ndaText);
      setCurrentStep(2); // Move to NDA step
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate NDA.' });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };
  
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const onSubmit = async (data: z.infer<typeof step1Schema>) => {
    // In a real app, this would also handle file uploads and submit to a backend
    console.log(data);
    toast({ title: 'Quote Requested', description: 'Your request has been sent to the manufacturer.' });
    onOpenChange(false);
  };
  
  const totalSteps = 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request a Quote from {seller.name}</DialogTitle>
          <DialogDescription>
            Provide details about your manufacturing needs to get a quote.
          </DialogDescription>
        </DialogHeader>
        <Progress value={((currentStep + 1) / totalSteps) * 100} className="mt-2" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {currentStep === 0 && (
              <div className="space-y-4 py-4">
                <FormField control={form.control} name="productName" render={({ field }) => (
                  <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Custom T-Shirts" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" placeholder="1000" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="specifications" render={({ field }) => (
                    <FormItem><FormLabel>Material/Specs</FormLabel><FormControl><Input placeholder="e.g., 100% Cotton, 180gsm" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                 <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea placeholder="Describe your requirements in detail..." {...field} rows={6} /></FormControl><FormMessage /></FormItem>
                  )} />

                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><Sparkles className="size-4 text-primary" /> AI Assistance</h4>
                     <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleSuggestQuestions} disabled={isLoading}><Lightbulb className="mr-2 size-4" /> Suggest Questions</Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleEstimateCost} disabled={isLoading}>{isLoading && !suggestedQuestions.length ? <LiquidLoader /> : <Sparkles className="mr-2 size-4" />} Estimate Cost</Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleGenerateNda} disabled={isLoading}><FileText className="mr-2 size-4" /> Generate NDA</Button>
                    </div>
                     {suggestedQuestions.length > 0 && (
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold">Suggested Questions:</p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          {suggestedQuestions.map((q, i) => <li key={i}>{q}</li>)}
                        </ul>
                      </div>
                    )}
                    {estimatedCost && <p className="text-sm text-muted-foreground"><span className='font-semibold'>Estimated Cost:</span> {estimatedCost}</p>}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {currentStep === 1 && (
                <div className="space-y-4 py-4">
                    <FormField control={form.control} name="files" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Upload Design Files (Optional)</FormLabel>
                             <FormControl>
                                <Input type="file" multiple onChange={e => field.onChange(e.target.files)} />
                            </FormControl>
                            <FormDescription>Upload technical drawings, mockups, or specification sheets.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            )}
            
            {currentStep === 2 && (
                <div className="space-y-4 py-4">
                    <h3 className="font-semibold">Generated Non-Disclosure Agreement</h3>
                    {ndaText ? (
                        <Textarea readOnly rows={15} value={ndaText} className="font-mono text-xs" />
                    ) : (
                        <p>NDA text was not generated.</p>
                    )}
                </div>
            )}

            <DialogFooter className="mt-4">
              {currentStep > 0 && <Button type="button" variant="ghost" onClick={prevStep}>Back</Button>}
              {currentStep < totalSteps - 2 && <Button type="button" onClick={nextStep}>Next</Button>}
              {currentStep === totalSteps - 2 && <Button type="submit">Send Inquiry</Button>}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
