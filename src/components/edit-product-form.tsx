

'use client';

import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { categories } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product, Customer, ServiceProduct } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { LiquidLoader } from '@/components/liquid-loader';
import { PlusCircle, Trash2, Sparkles, MousePointerClick, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { AiDescriptionModal } from './ai-description-modal';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_VIDEO_SIZE_MB = 10;
const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];

const specificationSchema = z.object({
  name: z.string().min(1, 'Specification name cannot be empty.'),
  value: z.string().min(1, 'Specification value cannot be empty.'),
});

const formSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters.'),
  description: z.string().min(20, 'Please provide a description of at least 20 characters.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative.').optional().or(z.literal('')),
  discountPrice: z.coerce.number().min(0, 'Discount price cannot be negative.').optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0, 'Stock level cannot be negative.').optional(),
  barcode: z.string().optional(),
  categoryId: z.string({ required_error: 'Please select a category.' }),
  specifications: z.array(specificationSchema).optional(),
  newImages: z.custom<FileList>()
    .optional()
    .refine((files) => !files || files.length === 0 || Array.from(files).every((file) => file.size <= MAX_IMAGE_SIZE), `Max image file size is ${MAX_IMAGE_SIZE_MB}MB.`)
    .refine((files) => !files || files.length === 0 || Array.from(files).every((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)), "Only .jpg, .jpeg, .png and .webp files are accepted."),
  newVideos: z.custom<FileList>().optional()
    .refine((files) => !files || files.length === 0 || Array.from(files).every((file) => file.size <= MAX_VIDEO_SIZE), `Max video file size is ${MAX_VIDEO_SIZE_MB}MB.`)
    .refine((files) => !files || files.length === 0 || Array.from(files).every((file) => ACCEPTED_VIDEO_TYPES.includes(file.type)), "Only .mp4, .webm, and .ogg files are accepted."),
});

type FormValues = z.infer<typeof formSchema>;

interface EditProductFormProps {
    productId: string;
}

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
});

export function EditProductForm({ productId }: EditProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [item, setItem] = useState<Product | ServiceProduct | null>(null);
  const { sellerProducts, updateProduct, seller, sellerCustomers } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentVideos, setCurrentVideos] = useState<string[]>([]);
  
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    sellerCustomers.forEach(c => map.set(c.userId, c));
    return map;
  }, [sellerCustomers]);

  const clickers = useMemo(() => {
    if (!item?.clickHistory) return [];
    
    // De-duplicate by userId, keeping the most recent click
    const latestClicks = new Map<string, string>();
    item.clickHistory.forEach(click => {
        const existingTimestamp = latestClicks.get(click.userId);
        if (!existingTimestamp || new Date(click.timestamp) > new Date(existingTimestamp)) {
            latestClicks.set(click.userId, click.timestamp);
        }
    });

    const clickerDetails = Array.from(latestClicks.entries()).map(([userId, timestamp]) => {
      const customer = customerMap.get(userId);
      return {
        name: customer?.name || 'Unknown User',
        avatar: customer?.avatar || '',
        lastClicked: timestamp,
      };
    }).sort((a,b) => new Date(b.lastClicked).getTime() - new Date(a.lastClicked).getTime());
    
    return clickerDetails;

  }, [item, customerMap]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      costPrice: '',
      discountPrice: '',
      stock: 0,
      barcode: '',
      categoryId: '',
      specifications: [],
      newImages: undefined,
      newVideos: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "specifications"
  });

  useEffect(() => {
    const itemToEdit = sellerProducts.find(p => p.id === productId);
    if (itemToEdit) {
        setItem(itemToEdit);
        
        let description = '';
        let images: string[] = [];
        let price = 0;
        let costPrice: number | '' = '';

        if ('price' in itemToEdit) { // It's a Product
            description = typeof itemToEdit.description === 'string' ? itemToEdit.description : (itemToEdit.description?.english || '');
            images = itemToEdit.images || [];
            price = itemToEdit.price;
            costPrice = itemToEdit.costPrice || '';
        } else { // It's a ServiceProduct
            description = itemToEdit.description || '';
            images = itemToEdit.coverImageUrl ? [itemToEdit.coverImageUrl] : [];
            price = itemToEdit.flatFee || itemToEdit.hourlyRate || 0;
        }

        setCurrentImages(images);
        setCurrentVideos('videos' in itemToEdit ? itemToEdit.videos || [] : []);
        
        form.reset({
            ...itemToEdit,
            description,
            price,
            costPrice,
            discountPrice: 'discountPrice' in itemToEdit ? itemToEdit.discountPrice || '' : '',
            stock: 'stock' in itemToEdit ? itemToEdit.stock ?? 0 : 0,
            barcode: 'barcode' in itemToEdit ? itemToEdit.barcode ?? '' : '',
            specifications: itemToEdit.specifications || [],
        });
    } else {
        toast({ variant: 'destructive', title: 'Item not found' });
        router.push('/dashboard/products');
    }
  }, [productId, sellerProducts, router, toast, form]);

  const handleRemoveImage = (index: number) => {
    setCurrentImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index: number) => {
    setCurrentVideos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!item) {
        toast({ variant: 'destructive', title: 'Error', description: 'Product data is missing.' });
        return;
    }

    setIsLoading(true);
    
    let updatedImageUrls = [...currentImages];
    if (data.newImages && data.newImages.length > 0) {
      for (const file of Array.from(data.newImages)) {
        try {
          const dataUri = await fileToDataUri(file as File);
          updatedImageUrls.push(dataUri);
        } catch (error) {
          console.error("Could not convert file to data URI", error);
          toast({
            variant: 'destructive',
            title: 'Image Upload Error',
            description: `Could not process image: ${file.name}. Please try another file.`,
          });
          setIsLoading(false);
          return;
        }
      }
    }
    
    let updatedVideoUrls = [...currentVideos];
    if (data.newVideos && data.newVideos.length > 0) {
      for (const file of Array.from(data.newVideos)) {
        try {
          const dataUri = await fileToDataUri(file as File);
          updatedVideoUrls.push(dataUri);
        } catch (error) {
          console.error("Could not convert video file to data URI", error);
          toast({
            variant: 'destructive',
            title: 'Video Upload Error',
            description: `Could not process video: ${file.name}. Please try another file.`,
          });
          setIsLoading(false);
          return;
        }
      }
    }
    
    const originalDescription = 'description' in item && typeof item.description === 'object' ? item.description?.english : item.description;

    let descriptionObject: Product['description'] | ServiceProduct['description'] = item.description;

    if(data.description !== originalDescription) {
        const generated = await generateProductDescription({ shortDescription: data.name, keywords: data.description });
        descriptionObject = {
            english: generated.englishDescription,
            french: generated.englishDescription,
            spanish: generated.englishDescription,
        };
    }

    const payload: Partial<Product | ServiceProduct> = {
        name: data.name,
        description: descriptionObject,
        price: data.price,
        costPrice: (data.costPrice && Number(data.costPrice) > 0) ? Number(data.costPrice) : undefined,
        categoryId: data.categoryId,
        specifications: data.specifications,
        images: updatedImageUrls,
        videos: updatedVideoUrls,
        discountPrice: (data.discountPrice && Number(data.discountPrice) > 0) ? Number(data.discountPrice) : undefined,
    };
    
    if ('stock' in item) {
        (payload as Partial<Product>).stock = data.stock;
        (payload as Partial<Product>).barcode = data.barcode;
    }
    
    updateProduct(productId, payload);
      
    toast({
      title: "Item Updated!",
      description: "Your item has been successfully updated.",
    });
    router.push('/dashboard/products');

    setIsLoading(false);
  };
  
  const watchedPrice = form.watch('price');
  const watchedCostPrice = form.watch('costPrice');
  
  const profitMargin = useMemo(() => {
    const price = Number(watchedPrice);
    const cost = Number(watchedCostPrice);
    if (!price || !cost || price <= 0) return null;
    
    const profit = price - cost;
    const margin = (profit / price) * 100;
    
    return { profit, margin };
  }, [watchedPrice, watchedCostPrice]);

  if (!item || !seller) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
          </Card>
      );
  }

  const isStore = seller.businessType === 'store' || seller.businessType === 'manufacturing';
  const itemType = 'stock' in item ? 'product' : 'service';
  const relevantCategories = categories.filter(c => c.businessType === seller.businessType || (isStore && c.businessType === 'store'));


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Item Details</CardTitle>
                <CardDescription>Update your {itemType} information below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{itemType.charAt(0).toUpperCase() + itemType.slice(1)} Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Handwoven Kente Cloth Scarf" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>{itemType.charAt(0).toUpperCase() + itemType.slice(1)} Description</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsAiModalOpen(true)}>
                            <Sparkles className="mr-2 size-4" />
                            Generate with AI
                        </Button>
                    </div>
                    <FormControl>
                      <Textarea placeholder="Describe the item, its materials, and what makes it special." {...field} rows={4} />
                    </FormControl>
                    <FormDescription>This is the English description. French and Spanish versions will be auto-generated on save.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Selling Price (GHS ₵)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 45.00" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Price (GHS ₵)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 35.00"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>Leave blank for no discount.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isStore && (
                    <>
                     <FormField
                      control={form.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Price (per item)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 25.00" {...field} value={field.value ?? ''} />
                          </FormControl>
                           <FormDescription>Your cost to acquire the product.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="e.g., 50" {...field} value={field.value ?? 0} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barcode (UPC, EAN, etc.)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 123456789012" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormDescription>Optional. Used for POS scanning.</FormDescription>
                            <FormMessage />
                          </FormItem>
                      )}
                    />
                    </>
                  )}
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem className={!isStore ? 'col-span-2' : 'col-span-2 md:col-span-1'}>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select a ${itemType} category`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {relevantCategories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
            </CardContent>
        </Card>

        {isStore && (
            <Card>
                <CardHeader>
                    <CardTitle>Profitability</CardTitle>
                    <CardDescription>An overview of this product's profit margin.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col p-4 border rounded-lg">
                        <span className="text-sm text-muted-foreground">Selling Price</span>
                        <span className="text-xl font-semibold">₵{Number(watchedPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col p-4 border rounded-lg">
                        <span className="text-sm text-muted-foreground">Cost Price</span>
                        <span className="text-xl font-semibold">₵{Number(watchedCostPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col p-4 border rounded-lg">
                        <span className="text-sm text-muted-foreground">Profit Margin</span>
                        {profitMargin ? (
                            <div className={`flex items-center gap-1.5 text-xl font-semibold ${profitMargin.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {profitMargin.profit > 0 ? <TrendingUp className="size-5" /> : profitMargin.profit < 0 ? <TrendingDown className="size-5" /> : <Minus className="size-5" />}
                                <span>₵{profitMargin.profit.toFixed(2)} ({profitMargin.margin.toFixed(1)}%)</span>
                            </div>
                        ) : (
                            <span className="text-xl font-semibold text-muted-foreground">--</span>
                        )}
                    </div>
                </CardContent>
            </Card>
        )}
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">{itemType.charAt(0).toUpperCase() + itemType.slice(1)} Analytics</CardTitle>
                <CardDescription>See how customers are interacting with this {itemType}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-4 border rounded-lg">
                    <MousePointerClick className="size-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">Total {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Clicks</p>
                        <p className="text-2xl font-bold">{item.clicks ?? 0}</p>
                    </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Buyers Who Clicked This Item</h4>
                   <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Buyer</TableHead>
                            <TableHead className="text-right">Last Clicked</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clickers.length > 0 ? (
                            clickers.map((clicker, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8">
                                                <AvatarImage src={clicker.avatar} />
                                                <AvatarFallback>{clicker.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{clicker.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {format(new Date(clicker.lastClicked), "dd MMM, yyyy 'at' p")}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    No click data available yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle className="font-headline text-xl">{itemType.charAt(0).toUpperCase() + itemType.slice(1)} Specifications</CardTitle>
              <CardDescription>Optionally, add or edit key-value details for your {itemType} (e.g., Material: Cotton, Weight: 2kg).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                  <FormField
                  control={form.control}
                  name={`specifications.${index}.name`}
                  render={({ field }) => (
                      <FormItem className="flex-grow">
                      <FormLabel className={index !== 0 ? 'sr-only' : ''}>Name</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., Color" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name={`specifications.${index}.value`}
                  render={({ field }) => (
                      <FormItem className="flex-grow">
                      <FormLabel className={index !== 0 ? 'sr-only' : ''}>Value</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., Red" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="size-4" />
                  </Button>
              </div>
              ))}
              <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => append({ name: '', value: '' })}
              >
              <PlusCircle className="mr-2 size-4" />
              Add Specification
              </Button>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Manage Media</CardTitle>
                <CardDescription>Review, remove, or add new images and videos for your {itemType}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <FormLabel>Current Images ({currentImages.length})</FormLabel>
                    {currentImages.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                            {currentImages.map((img, index) => (
                                <div key={index} className="relative group">
                                    <Image src={img} alt={`Product image ${index + 1}`} width={100} height={100} className="rounded-md object-cover aspect-square" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemoveImage(index)}
                                    >
                                        <Trash2 className="size-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-2">No images have been uploaded.</p>
                    )}
                </div>
                
                <div>
                    <FormLabel>Current Videos ({currentVideos.length})</FormLabel>
                    {currentVideos.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                            {currentVideos.map((vid, index) => (
                                <div key={index} className="relative group">
                                    <video src={vid} className="rounded-md object-cover aspect-square bg-muted" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemoveVideo(index)}
                                    >
                                        <Trash2 className="size-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-2">No videos have been uploaded.</p>
                    )}
                </div>
                <Separator />
                <FormField
                  control={form.control}
                  name="newImages"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Add More Product Images (Optional)</FormLabel>
                      <FormControl>
                          <Input
                              type="file"
                              multiple
                              accept={ACCEPTED_IMAGE_TYPES.join(",")}
                              onChange={(event) => {
                                  field.onChange(event.target.files);
                                }
                              }
                          />
                      </FormControl>
                      <FormDescription>Upload new images to add them to the product. Existing images will be kept.</FormDescription>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                <FormField
                  control={form.control}
                  name="newVideos"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Add More Product Videos (Optional)</FormLabel>
                      <FormControl>
                          <Input
                              type="file"
                              multiple
                              accept={ACCEPTED_VIDEO_TYPES.join(",")}
                              onChange={(event) => {
                                  field.onChange(event.target.files);
                                }
                              }
                          />
                      </FormControl>
                      <FormDescription>Upload new videos to add them to the product. Max {MAX_VIDEO_SIZE_MB}MB. Existing videos will be kept.</FormDescription>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
            </CardContent>
        </Card>
          
        <CardFooter className="px-0">
          <Button type="submit" disabled={isLoading || !item} className="w-full">
            {isLoading ? (
              <>
                <LiquidLoader className="mr-2" />
                Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardFooter>
      </form>
       <AiDescriptionModal
        open={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
        onInsert={(desc) => {
            form.setValue('description', desc);
            setIsAiModalOpen(false);
        }}
      />
    </Form>
  );
}
