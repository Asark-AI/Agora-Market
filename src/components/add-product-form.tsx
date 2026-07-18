
'use client';

import { useForm, SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { categories } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { LiquidLoader } from '@/components/liquid-loader';
import { PlusCircle, Trash2, Sparkles, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AiDescriptionModal } from './ai-description-modal';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Label } from './ui/label';

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_VIDEO_SIZE_MB = 10;
const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];

// Zod Schema for Product Form
const productSpecificationSchema = z.object({
  name: z.string().min(1, 'Specification name cannot be empty.'),
  value: z.string().min(1, 'Specification value cannot be empty.'),
});

const fullProductFormSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters.'),
  categoryId: z.string({ required_error: 'Please select a category.' }),
  description: z.string().min(20, 'Please provide a description of at least 20 characters.'),
  price: z.string().refine(value => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
    message: 'Price must be a positive number.',
  }),
  costPrice: z.string().optional().or(z.literal('')),
  discountPrice: z.string().optional().or(z.literal('')),
  stock: z.string().refine(value => !isNaN(parseInt(value, 10)) && parseInt(value, 10) >= 0, {
    message: 'Stock must be a non-negative integer.',
  }),
  barcode: z.string().optional(),
  images: z.custom<FileList>().refine(files => files && files.length > 0, 'At least one image is required.'),
  videos: z.custom<FileList>().optional(),
  specifications: z.array(productSpecificationSchema).optional(),
  publishAction: z.enum(['draft', 'publish']),
});

type ProductFormValues = z.infer<typeof fullProductFormSchema>;

// Zod Schema for Service Form
const pricingPackageSchema = z.object({
    name: z.string().min(2, 'Package name is required.'),
    price: z.coerce.number().positive('Price must be positive.'),
    features: z.string().min(10, 'Please list at least one feature.')
});

const fullServiceFormSchema = z.object({
  name: z.string().min(3, 'Service title must be at least 3 characters.'),
  categoryId: z.string({ required_error: 'Please select a category.' }),
  description: z.string().min(20, 'Please provide a description of at least 20 characters.'),
  pricingType: z.enum(['flat', 'hourly', 'tiered']),
  flatFee: z.coerce.number().positive('Flat fee must be a positive number.').optional(),
  hourlyRate: z.coerce.number().positive('Hourly rate must be a positive number.').optional(),
  packages: z.array(pricingPackageSchema).optional(),
  discount: z.string().optional(),
  deliveryMethods: z.array(z.string()).min(1, 'Please select at least one delivery method.'),
  onlineDetails: z.string().optional(),
  inPersonDetails: z.string().optional(),
  duration: z.string().min(2, 'Please specify a duration.'),
  buyerRequirements: z.string().min(10, 'Please specify requirements.'),
  coverImage: z.custom<FileList>().refine(files => files && files.length === 1, 'A cover image is required.'),
  galleryImages: z.custom<FileList>().optional(),
  videoUrl: z.string().url('Please enter a valid URL.').or(z.literal('')).optional(),
  cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']),
  refundTerms: z.string().optional(),
  publishAction: z.enum(['draft', 'publish', 'schedule']),
  publishDate: z.date().optional(),
}).superRefine((data, ctx) => {
    if (data.pricingType === 'flat' && !data.flatFee) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please define a price for the selected pricing type.", path: ["flatFee"] });
    }
    if (data.pricingType === 'hourly' && !data.hourlyRate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please define a price for the selected pricing type.", path: ["hourlyRate"] });
    }
    if (data.pricingType === 'tiered' && (!data.packages || data.packages.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please add at least one pricing package.", path: ["packages"] });
    }
    if (data.deliveryMethods.includes('online') && !data.onlineDetails) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please provide details for online delivery.", path: ["onlineDetails"] });
    }
    if (data.deliveryMethods.includes('in-person') && !data.inPersonDetails) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please provide details for in-person delivery.", path: ["inPersonDetails"] });
    }
    if (data.publishAction === 'schedule' && !data.publishDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a date to schedule publishing.", path: ["publishDate"] });
    }
});
    
type ServiceFormValues = z.infer<typeof fullServiceFormSchema>;

function AddProductFormContent() {
    const { seller, addProduct } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(fullProductFormSchema),
        defaultValues: {
            name: '',
            categoryId: '',
            description: '',
            price: '',
            costPrice: '',
            discountPrice: '',
            stock: '',
            barcode: '',
            images: undefined,
            videos: undefined,
            specifications: [],
            publishAction: 'publish',
        },
    });

    const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({
        control: form.control,
        name: "specifications"
    });

    const totalSteps = 5;
    const stepFields: (keyof ProductFormValues)[][] = [
        ['name', 'categoryId', 'description'],
        ['price', 'costPrice', 'discountPrice', 'stock', 'barcode'],
        ['images', 'videos'],
        ['specifications'],
        ['publishAction'],
    ];

    const handleNextStep = async () => {
        const fieldsToValidate = stepFields[currentStep];
        const isValid = await form.trigger(fieldsToValidate as any);

        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
        } else {
            toast({
                variant: "destructive",
                title: "Incomplete Step",
                description: "Please fill all required fields before proceeding."
            });
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
        if (!seller) return;
        setIsLoading(true);
        
        try {
            const priceNum = parseFloat(data.price);
            const costPriceNum = data.costPrice ? parseFloat(data.costPrice) : undefined;
            const stockNum = parseInt(data.stock, 10);
            const discountPriceNum = data.discountPrice ? parseFloat(data.discountPrice) : undefined;
            
            const finalDiscountPrice = (discountPriceNum && discountPriceNum > 0) ? discountPriceNum : undefined;

            await addProduct({
                name: data.name,
                description: data.description,
                price: priceNum,
                costPrice: costPriceNum,
                discountPrice: finalDiscountPrice,
                categoryId: data.categoryId,
                regionId: seller.regionId,
                stock: stockNum,
                barcode: data.barcode,
                specifications: data.specifications,
                status: data.publishAction === 'publish' ? 'active' : 'draft'
            }, data.images, data.videos);

            toast({ title: "Product Added!", description: `${data.name} has been added to your store.` });
            router.push('/dashboard/products');

        } catch (error) {
            console.error("Error adding product:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to add product." });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!seller) return null;
    const relevantCategories = categories.filter(c => c.businessType === seller.businessType || c.businessType === 'store');
    
    const stepTitles = [
        "Product Details",
        "Pricing & Inventory",
        "Upload Media",
        "Specifications",
        "Publish Options"
    ];

    const stepComponents = [
        // Step 1: Product Details
        <>
            <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Handwoven Kente Cloth Scarf" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Controller
                name="categoryId"
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a product category" /></SelectTrigger></FormControl>
                            <SelectContent>{relevantCategories.map(category => (<SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between">
                            <FormLabel>Product Description</FormLabel>
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsAiModalOpen(true)}>
                                <Sparkles className="mr-2 size-4" /> Generate with AI
                            </Button>
                        </div>
                        <FormControl><Textarea placeholder="Describe the item, its materials, and what makes it special." {...field} rows={5} /></FormControl>
                        <FormDescription>This is the English description. French and Spanish versions will be auto-generated on save.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>,
        // Step 2: Pricing & Inventory
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                    name="price"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Selling Price (GHS)</FormLabel>
                            <FormControl><Input type="number" placeholder="150" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <Controller
                    name="costPrice"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cost Price (per item)</FormLabel>
                            <FormControl><Input type="number" placeholder="90" {...field} value={field.value ?? ''} /></FormControl>
                            <FormDescription>Your cost to acquire the product.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <Controller
                name="discountPrice"
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Discount Price (Optional)</FormLabel>
                        <FormControl><Input type="number" placeholder="120" {...field} value={field.value ?? ''} /></FormControl>
                        <FormDescription>Leave blank if there is no discount.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Controller
                name="stock"
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl><Input type="number" placeholder="50" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Controller
                name="barcode"
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Barcode (UPC, EAN, etc.)</FormLabel>
                        <FormControl><Input placeholder="e.g., 123456789012" {...field} value={field.value ?? ''} /></FormControl>
                        <FormDescription>Optional. Used for POS scanning.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>,
        // Step 3: Media
        <>
            <Controller
                name="images"
                control={form.control}
                render={({ field: { onChange } }) => (
                    <FormItem>
                        <FormLabel>Product Images (Required)</FormLabel>
                        <FormControl><Input type="file" multiple accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={(e) => onChange(e.target.files)} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Controller
                name="videos"
                control={form.control}
                render={({ field: { onChange } }) => (
                    <FormItem>
                        <FormLabel>Product Videos (Optional)</FormLabel>
                        <FormControl><Input type="file" multiple accept={ACCEPTED_VIDEO_TYPES.join(",")} onChange={(e) => onChange(e.target.files)} /></FormControl>
                        <FormDescription>Upload short videos showcasing your product.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>,
        // Step 4: Specifications
        <>
            <FormLabel>Product Specifications (Optional)</FormLabel>
            <FormDescription>Add details like material, weight, dimensions, etc.</FormDescription>
            <div className="space-y-2">
                {specFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2">
                        <FormField control={form.control} name={`specifications.${index}.name`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel className={index !== 0 ? 'sr-only' : ''}>Name</FormLabel><FormControl><Input placeholder="e.g., Color" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`specifications.${index}.value`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel className={index !== 0 ? 'sr-only' : ''}>Value</FormLabel><FormControl><Input placeholder="e.g., Red" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeSpec(index)}><Trash2 className="size-4" /></Button>
                    </div>
                ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendSpec({ name: '', value: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Specification</Button>
        </>,
        // Step 5: Publish
        <>
            <Controller
                name="publishAction"
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Publish Options</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                                <FormItem className="flex items-center space-x-3">
                                    <FormControl><RadioGroupItem value="draft" id="draft" /></FormControl>
                                    <Label htmlFor="draft">Save as Draft</Label>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3">
                                    <FormControl><RadioGroupItem value="publish" id="publish" /></FormControl>
                                    <Label htmlFor="publish">Publish Now</Label>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                    </FormItem>
                )}
            />
        </>
    ];

    return (
        <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <Progress value={((currentStep + 1) / totalSteps) * 100} className="w-full mb-4" />
                        <CardTitle className="font-headline text-xl">{stepTitles[currentStep]}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 min-h-[400px] py-6">{stepComponents[currentStep]}</CardContent>
                    <CardFooter className="flex justify-between">
                        {currentStep > 0 ? (
                            <Button type="button" variant="outline" onClick={prevStep}>
                            Back
                            </Button>
                        ) : <div />}
                        
                        {currentStep < totalSteps - 1 ? (
                            <Button type="button" onClick={handleNextStep}>
                            Next Step
                            </Button>
                        ) : (
                             <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <><LiquidLoader className="mr-2" />Submitting...</>
                                ) : (
                                    `Finish & ${form.getValues('publishAction') === 'publish' ? 'Publish' : 'Save Draft'}`
                                )}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Form>
            <AiDescriptionModal open={isAiModalOpen} onOpenChange={setIsAiModalOpen} onInsert={(desc) => { form.setValue('description', desc); setIsAiModalOpen(false); }} />
        </Card>
    );
}

function AddServiceFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const { seller } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(fullServiceFormSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      description: '',
      pricingType: 'flat',
      deliveryMethods: [],
      cancellationPolicy: 'moderate',
      publishAction: 'publish',
      flatFee: 0,
      hourlyRate: 0,
      packages: [],
      discount: '',
      onlineDetails: '',
      inPersonDetails: '',
      duration: '',
      buyerRequirements: '',
      coverImage: undefined,
      galleryImages: undefined,
      videoUrl: '',
      refundTerms: '',
      publishDate: undefined,
    },
  });

  const { fields: packageFields, append: appendPackage, remove: removePackage } = useFieldArray({
    control: form.control,
    name: "packages"
  });

  const totalSteps = 7;
  
  const stepFields: (keyof ServiceFormValues)[][] = [
    ['name', 'categoryId', 'description'],
    ['pricingType', 'flatFee', 'hourlyRate', 'packages', 'discount'],
    ['deliveryMethods', 'onlineDetails', 'inPersonDetails', 'duration'],
    ['buyerRequirements'],
    ['coverImage', 'galleryImages', 'videoUrl'],
    ['cancellationPolicy', 'refundTerms'],
    ['publishAction', 'publishDate'],
  ];
  
  const stepTitles = [
    "Service Details",
    "Pricing & Packages",
    "Service Delivery",
    "Requirements",
    "Media Gallery",
    "Policies",
    "Publish Options"
  ];

  const handleNextStep = async () => {
    const fieldsToValidate = stepFields[currentStep];
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
    } else {
        toast({
            variant: "destructive",
            title: "Incomplete Step",
            description: "Please fill all required fields before proceeding."
        });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };


  const onSubmit: SubmitHandler<ServiceFormValues> = async (data) => {
    setIsLoading(true);
    toast({
        title: "Submitting Service...",
        description: "Please wait while we set up your new service."
    });
    // In a real app, you would process the data, upload files, and save to the database.
    console.log(data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsLoading(false);
    toast({
      title: "Service Published!",
      description: `Your new service "${data.name}" is now live.`,
    });
    router.push('/dashboard/products');
  };
  
  if (!seller) return null;
  
  const relevantCategories = categories.filter(c => c.businessType === seller.businessType);
  const pricingType = form.watch('pricingType');
  const deliveryMethods = form.watch('deliveryMethods');

  const stepComponents = [
      // Step 1: Service Details
      <>
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Service Title</FormLabel><FormControl><Input placeholder="e.g., One-Hour Virtual Tutoring in Math" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a service category" /></SelectTrigger></FormControl><SelectContent>{relevantCategories.map(category => (<SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Explain what the service includes, requirements from the customer, and expected delivery time." {...field} rows={5} /></FormControl><FormMessage /></FormItem>)} />
      </>,
      // Step 2: Pricing & Packages
      <>
        <div className="space-y-6">
            <FormField control={form.control} name="pricingType" render={({ field }) => (<FormItem><FormLabel>Pricing Type</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormItem><FormControl><RadioGroupItem value="flat" id="flat" className="sr-only peer" /></FormControl><Label htmlFor="flat" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><DollarSign className="mb-3 h-6 w-6"/>Flat Fee</Label></FormItem><FormItem><FormControl><RadioGroupItem value="hourly" id="hourly" className="sr-only peer" /></FormControl><Label htmlFor="hourly" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><DollarSign className="mb-3 h-6 w-6"/>Hourly Rate</Label></FormItem><FormItem><FormControl><RadioGroupItem value="tiered" id="tiered" className="sr-only peer" /></FormControl><Label htmlFor="tiered" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><DollarSign className="mb-3 h-6 w-6"/>Tiered Packages</Label></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
            {pricingType === 'flat' && <FormField control={form.control} name="flatFee" render={({ field }) => (<FormItem><FormLabel>Flat Fee (GHS)</FormLabel><FormControl><Input type="number" placeholder="300" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? 0 : e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>)} />}
            {pricingType === 'hourly' && <FormField control={form.control} name="hourlyRate" render={({ field }) => (<FormItem><FormLabel>Hourly Rate (GHS)</FormLabel><FormControl><Input type="number" placeholder="100" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? 0 : e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>)} />}
            {pricingType === 'tiered' && <div className="space-y-4">{packageFields.map((field, index) => (<Card key={field.id}><CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative"><Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removePackage(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button><FormField control={form.control} name={`packages.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Package Name</FormLabel><FormControl><Input placeholder="e.g., Basic" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name={`packages.${index}.price`} render={({ field }) => (<FormItem><FormLabel>Price (GHS)</FormLabel><FormControl><Input type="number" placeholder="150" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name={`packages.${index}.features`} render={({ field }) => (<FormItem className="col-span-1 md:col-span-2"><FormLabel>Features</FormLabel><FormControl><Textarea placeholder="List features, one per line..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} /></CardContent></Card>))}<Button type="button" variant="outline" onClick={() => appendPackage({name: '', price: 0, features: ''})}><PlusCircle className="mr-2 h-4 w-4"/>Add Package</Button></div>}
            <FormField control={form.control} name="discount" render={({ field }) => (<FormItem><FormLabel>Discounts (Optional)</FormLabel><FormControl><Input placeholder="e.g., 10% off for first-time customers" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
        </div>
      </>,
      // Step 3: Service Delivery
      <>
        <FormField
            control={form.control}
            name="deliveryMethods"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Delivery Method</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                    {(['online', 'in-person'] as const).map((item) => (
                        <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        return checked
                                            ? field.onChange([...currentValues, item])
                                            : field.onChange(currentValues?.filter((value) => value !== item));
                                    }}
                                />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">{item}</FormLabel>
                        </FormItem>
                    ))}
                </div>
                <FormMessage />
            </FormItem>
        )} />

        {deliveryMethods?.includes('online') && <FormField control={form.control} name="onlineDetails" render={({ field }) => (<FormItem><FormLabel>Online Platforms</FormLabel><FormControl><Input placeholder="e.g., Zoom, Google Meet, WhatsApp" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />}
        {deliveryMethods?.includes('in-person') && <FormField control={form.control} name="inPersonDetails" render={({ field }) => (<FormItem><FormLabel>Location / Service Area</FormLabel><FormControl><Input placeholder="e.g., My office at 123 Main St, Accra or within Greater Accra" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />}
        
        <FormField control={form.control} name="duration" render={({ field }) => (<FormItem><FormLabel>Service Duration</FormLabel><FormControl><Input placeholder="e.g., 1 hour, 3 days, 2 sessions" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <Card><CardHeader><CardTitle>Availability Calendar</CardTitle><CardDescription>Set your working hours and block off time when you're unavailable. (Optional)</CardDescription></CardHeader><CardContent className="flex justify-center"><Button variant="outline">Setup Availability (Coming Soon)</Button></CardContent></Card>
      </>,
      // Step 4: Requirements
      <>
         <FormField control={form.control} name="buyerRequirements" render={({ field }) => (<FormItem><FormLabel>Requirements from Buyer</FormLabel><FormDescription>List what you need from the customer before you can start working.</FormDescription><FormControl><Textarea placeholder="e.g., I need your business name, preferred colors, and 2-3 sample logos you like." {...field} rows={6} /></FormControl><FormMessage /></FormItem>)} />
      </>,
      // Step 5: Media
      <>
          <FormField control={form.control} name="coverImage" render={({ field }) => (<FormItem><FormLabel>Service Cover Image</FormLabel><FormControl><Input type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="galleryImages" render={({ field }) => (<FormItem><FormLabel>Image Gallery (Optional, max 5)</FormLabel><FormControl><Input type="file" multiple accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="videoUrl" render={({ field }) => (<FormItem><FormLabel>Video Introduction (Optional)</FormLabel><FormControl><Input placeholder="e.g., https://youtube.com/watch?v=..." {...field} value={field.value ?? ''} /></FormControl><FormDescription>Enter a YouTube or Vimeo link.</FormDescription><FormMessage /></FormItem>)} />
      </>,
      // Step 6: Policies
      <>
         <FormField control={form.control} name="cancellationPolicy" render={({ field }) => (<FormItem><FormLabel>Cancellation Policy</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a cancellation policy" /></SelectTrigger></FormControl><SelectContent><SelectItem value="flexible">Flexible</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="strict">Strict</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
         <FormField control={form.control} name="refundTerms" render={({ field }) => (<FormItem><FormLabel>Refund Terms (Optional)</FormLabel><FormControl><Textarea placeholder="Explain your refund policy clearly." {...field} rows={4} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
      </>,
      // Step 7: Publish
      <>
        <FormField control={form.control} name="publishAction" render={({ field }) => (<FormItem><FormLabel>Publish Options</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2"><FormItem className="flex items-center space-x-3"><FormControl><RadioGroupItem value="draft" id="draft"/></FormControl><Label htmlFor="draft">Save as Draft</Label></FormItem><FormItem className="flex items-center space-x-3"><FormControl><RadioGroupItem value="publish" id="publish"/></FormControl><Label htmlFor="publish">Publish Now</Label></FormItem><FormItem className="flex items-center space-x-3"><FormControl><RadioGroupItem value="schedule" id="schedule"/></FormControl><Label htmlFor="schedule">Schedule for Later</Label></FormItem></RadioGroup></FormControl></FormItem>)} />
        {form.watch('publishAction') === 'schedule' && <FormField control={form.control} name="publishDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Publish Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />}
      </>
  ];

  return (
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <Progress value={((currentStep + 1) / totalSteps) * 100} className="w-full mb-4" />
                <CardTitle className="font-headline text-xl">{stepTitles[currentStep]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 min-h-[400px] py-6">
              {stepComponents[currentStep]}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                {currentStep > 0 && (
                    <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
                )}
              </div>
              <div>
                {currentStep < totalSteps - 1 ? (
                    <Button type="button" onClick={handleNextStep}>Next Step</Button>
                ) : (
                    <Button type="submit" disabled={isLoading}>
                    {isLoading ? <><LiquidLoader className="mr-2" />Submitting...</> : 'Finish & Publish Service'}
                    </Button>
                )}
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
  );
}


export function AddProductForm({ isStore, itemType }: { isStore: boolean, itemType: string }) {
  if (isStore) {
    return <AddProductFormContent />;
  }
  return <AddServiceFormContent />;
}
