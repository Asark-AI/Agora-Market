
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateProductDescription, GenerateProductDescriptionOutput } from '@/ai/flows/generate-product-description';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiquidLoader } from '@/components/liquid-loader';
import { UploadCloud, PenSquare, Sparkles } from 'lucide-react';
import NextImage from 'next/image';
import { Label } from './ui/label';

const textFormSchema = z.object({
  shortDescription: z.string().min(5, 'Please provide a short description of at least 5 characters.'),
  keywords: z.string().min(3, 'Please provide at least one keyword.'),
});
type TextFormValues = z.infer<typeof textFormSchema>;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const imageFormSchema = z.object({
    image: z.custom<FileList>()
        .refine(files => files && files.length > 0, "An image is required.")
        .refine(files => files?.[0]?.size <= MAX_IMAGE_SIZE, `Max file size is 5MB.`)
        .refine(files => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), ".jpg, .jpeg, .png and .webp files are accepted."),
});
type ImageFormValues = z.infer<typeof imageFormSchema>;


interface AiDescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (description: string) => void;
}

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
});

export function AiDescriptionModal({ open, onOpenChange, onInsert }: AiDescriptionModalProps) {
  const [generatedDescriptions, setGeneratedDescriptions] = useState<GenerateProductDescriptionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const textForm = useForm<TextFormValues>({ resolver: zodResolver(textFormSchema), defaultValues: { shortDescription: '', keywords: '' } });
  const imageForm = useForm<ImageFormValues>({ resolver: zodResolver(imageFormSchema), defaultValues: { image: undefined } });

  const imageFile = imageForm.watch('image');

  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      return () => {
        URL.revokeObjectURL(previewUrl);
      };
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);


  const onTextSubmit: SubmitHandler<TextFormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedDescriptions(null);
    try {
      const result = await generateProductDescription(data);
      setGeneratedDescriptions(result);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onImageSubmit: SubmitHandler<ImageFormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedDescriptions(null);
    const file = data.image[0];
    try {
        const photoDataUri = await fileToDataUri(file);
        const result = await generateProductDescription({ photoDataUri });
        setGeneratedDescriptions(result);
    } catch (error) {
        handleError(error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleError = (error: any) => {
      console.error('Error generating descriptions:', error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "There was a problem generating your descriptions.",
      });
  }

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after the dialog closes
    setTimeout(() => {
        setGeneratedDescriptions(null);
        setImagePreview(null);
        textForm.reset();
        imageForm.reset();
    }, 300);
  }

  const handleInsertAndClose = (description: string) => {
    onInsert(description);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles />
            AI Description Generator
          </DialogTitle>
          <DialogDescription>
            Generate a compelling product description using text or an image.
          </DialogDescription>
        </DialogHeader>
        
        {!generatedDescriptions ? (
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">From Text</TabsTrigger>
              <TabsTrigger value="image">From Image</TabsTrigger>
            </TabsList>
            <TabsContent value="text">
              <Form {...textForm}>
                <form onSubmit={textForm.handleSubmit(onTextSubmit)} className="space-y-4 pt-4">
                  <FormField control={textForm.control} name="shortDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl><Input placeholder="e.g., Handwoven Kente cloth scarf" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={textForm.control} name="keywords" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl><Input placeholder="e.g., kente, scarf, handmade, ghana" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <><LiquidLoader className="mr-2" />Generating...</> : 'Generate'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="image">
               <Form {...imageForm}>
                <form onSubmit={imageForm.handleSubmit(onImageSubmit)} className="space-y-4 pt-4">
                   <FormField
                      control={imageForm.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                              {imagePreview ? <NextImage src={imagePreview} alt="Preview" width={160} height={160} className="h-full w-auto object-contain p-2" /> : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                  <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 5MB)</p>
                                </div>
                              )}
                            </FormLabel>
                            <FormControl>
                                <Input 
                                    id="image-upload" 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => field.onChange(e.target.files)}
                                />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )}
                    />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <><LiquidLoader className="mr-2" />Generating...</> : 'Generate'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <Label>Generated Description</Label>
            <Textarea readOnly value={generatedDescriptions.englishDescription} rows={10} className="bg-secondary" />
             <DialogFooter className="sm:justify-between">
                <Button variant="outline" onClick={() => setGeneratedDescriptions(null)}>Generate Again</Button>
                <Button onClick={() => handleInsertAndClose(generatedDescriptions.englishDescription)}>Insert Description</Button>
             </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
