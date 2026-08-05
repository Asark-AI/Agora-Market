
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

import { LiquidLoader } from '@/components/liquid-loader';
import { Store, Wrench, Briefcase, Factory, Check } from 'lucide-react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { regions, mobileGroupedCategories } from '@/lib/data';
import type { Seller, User, BusinessType } from '@/lib/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// File validation schema - keep as any with refine for browser FileList checks
const fileSchema = z
  .any()
  .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, {
    message: 'Max file size is 5MB.',
  })
  .refine(
    (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
    {
      message: '.jpg, .jpeg, .png and .webp files are accepted.',
    }
  )
  .optional();

const formSchema = z.object({
  businessName: z.string().min(2, { message: 'Business name must be at least 2 characters.' }),
  businessType: z.enum(['store', 'manufacturing', 'repairs', 'services'], {
    required_error: 'Please select a business type.',
  }),
  categoryIds: z.array(z.string()).min(1, 'Please select at least one category.'),
  logo: fileSchema,
  banner: fileSchema,
  bio: z.string().min(20, { message: 'Please provide a bio of at least 20 characters.' }),
  address: z.string().min(10, { message: 'Please provide a valid store address.' }),
  regionId: z.string({ required_error: 'Please select a region.' }),
  pickupInfo: z.string().optional(),
  googleMapsUrl: z
    .string()
    .url({ message: 'Please enter a valid Google Maps URL.' })
    .optional()
    .or(z.literal('')),
  idUpload: fileSchema,
  subscriptionPlan: z.enum(['basic', 'premium', 'enterprise'], {
    required_error: 'You need to select a subscription plan.',
  }),
});

// Use zod-inferred type but override file fields to FileList | undefined for stronger TS typing
type FormValues = z.infer<typeof formSchema> & {
  logo?: FileList | null;
  banner?: FileList | null;
  idUpload?: FileList | null;
};

interface SellerSignupFormProps {
  user: User;
}

const businessTypeIcons = {
  store: Store,
  manufacturing: Factory,
  repairs: Wrench,
  services: Briefcase,
};

const steps = [
  { id: 'business-type', name: 'Business Type' },
  { id: 'details', name: 'Details' },
  { id: 'profile', name: 'Profile' },
  { id: 'plan', name: 'Plan' },
];

export function SellerSignupForm({ user }: SellerSignupFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addSeller } = useAuth();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      businessName: '',
      bio: '',
      address: '',
      pickupInfo: '',
      googleMapsUrl: '',
      logo: undefined,
      banner: undefined,
      idUpload: undefined,
      categoryIds: [],
      subscriptionPlan: 'basic',
      businessType: 'store',
      regionId: '',
    },
  });

  const businessType = form.watch('businessType');
  const categoryIds = form.watch('categoryIds') || [];

  // Previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Filter categories by business type
  const filteredCategoryGroups = useMemo(() => {
    if (businessType) {
      return mobileGroupedCategories.filter((section) => section.businessType === businessType);
    }
    return [];
  }, [businessType]);

  // Reset selected categories when business type changes
  useEffect(() => {
    form.setValue('categoryIds', []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessType]);

  // Revoke preview URLs on unmount
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoPreview, bannerPreview]);

  const totalSteps = steps.length;

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];

    if (currentStep === 0) {
      fieldsToValidate = ['businessType'];
    } else if (currentStep === 1) {
      fieldsToValidate = ['businessName', 'categoryIds'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['bio', 'address', 'regionId'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    } else {
      toast({
        variant: 'destructive',
        title: 'Incomplete Information',
        description: 'Please fill out all required fields before proceeding.',
      });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // small helper to validate file client-side and set form field errors per-field, plus previews
  const validateAndSetFile = (name: keyof FormValues, files?: FileList | null) => {
    // Clear any previous manual errors for this field
    form.clearErrors(name as any);

    if (!files || files.length === 0) {
      form.setValue(name as any, undefined);
      // remove preview if clearing logo/banner
      if (name === 'logo' && logoPreview) {
        URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
      }
      if (name === 'banner' && bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
        setBannerPreview(null);
      }
      return;
    }

    const file = files[0];

    if (file.size > MAX_FILE_SIZE) {
      form.setError(name as any, { type: 'manual', message: 'Max file size is 5MB.' });
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      form.setError(name as any, { type: 'manual', message: 'Accepted types: .jpg, .png, .webp' });
      return;
    }

    // All good: set the FileList in the form and set a preview URL for image fields
    form.setValue(name as any, files);

    if (name === 'logo') {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    } else if (name === 'banner') {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      const url = URL.createObjectURL(file);
      setBannerPreview(url);
    } else if (name === 'idUpload') {
      // no preview for ID by default — but could be added similarly
    }
  };

  // allow removing selected file from UI & form
  const removeFile = (name: keyof FormValues) => {
    form.setValue(name as any, undefined);
    form.clearErrors(name as any);
    if (name === 'logo' && logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
    if (name === 'banner' && bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
      setBannerPreview(null);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // final check
    const isFormValid = await form.trigger();
    if (!isFormValid) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Form',
        description: 'Please fill out all required fields before creating the business.',
      });

      // find first step with an error and navigate to it
      const stepFields: (keyof FormValues)[][] = [
        ['businessType'],
        ['businessName', 'categoryIds'],
        ['bio', 'address', 'regionId'],
        ['subscriptionPlan'],
      ];
      for (let i = 0; i < stepFields.length; i++) {
        const hasError = stepFields[i].some((field) => Boolean(form.formState.errors[field]));
        if (hasError) {
          setCurrentStep(i);
          break;
        }
      }
      return;
    }

    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a store.' });
      return;
    }

    setIsLoading(true);

    const newSellerDataBase: Omit<Seller, 'id' | 'logoUrl' | 'storefrontBannerUrl'> = {
      userId: user.id,
      name: data.businessName,
      email: user.email,
      phone: user.phone || '',
      businessType: data.businessType,
      description: data.bio,
      regionId: data.regionId,
      productCategoryIds: data.businessType === 'store' ? data.categoryIds : [],
      repairCategoryIds: data.businessType === 'repairs' ? data.categoryIds : [],
      manufacturingCategoryIds: data.businessType === 'manufacturing' ? data.categoryIds : [],
      serviceCategoryIds: data.businessType === 'services' ? data.categoryIds : [],
      isVerifiedArtisan: false,
      shipsGlobally: false,
      deliveryOptions: ['buyer-pickup', 'seller-delivery'],
      paymentOptions: ['cash', 'mobile_money'],
      pickupLocation: data.address,
      googleMapsUrl: data.googleMapsUrl || '',
      trustScore: 60,
      followerCount: 0,
      subscriptionPlan: data.subscriptionPlan,
      status: 'active',
      customization: {
        layout: 'grid',
        features: {
          reviews: true,
          ratings: true,
          contact: true,
          contactMethods: ['email'],
          repairs: data.businessType === 'repairs',
          customOrders: data.businessType === 'manufacturing',
        },
        widgets: { sizeChart: data.categoryIds.some((id) => id.startsWith('fashion')) },
      },
      notifications: {
        emailOnOrder: true,
        emailOnMessage: true,
        smsOnOrder: false,
        emailOnRepairUpdate: true,
        smsOnRepairUpdate: false,
      },
      aiAssistantConfig: {
        enabled: false,
        instructions: 'You are a friendly and helpful assistant for my store. Keep your answers concise.',
        faqs: [
          { question: 'What are your store hours?', answer: 'We are open Monday to Friday, from 9 AM to 5 PM.' },
          { question: 'Where are you located?', answer: 'You can find our address on the store page.' },
        ],
      },
    };

    try {
      // Note: addSeller should handle file uploads. We pass the first file (if any).
      const logoFile = data.logo?.[0] ?? undefined;
      const bannerFile = data.banner?.[0] ?? undefined;
      await addSeller(newSellerDataBase, logoFile, bannerFile);
      toast({
        title: 'Store Created!',
        description: 'You have successfully created your seller account. Redirecting...',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to create seller:', error);
      toast({ variant: 'destructive', title: 'Creation Failed', description: 'Could not create your seller profile.' });
    } finally {
      setIsLoading(false);
    }
  };

  const stepDetails = [
    { title: 'Choose Your Business Type', description: "First, tell us what kind of business you're running." },
    { title: 'Business Details', description: "Let's get the specifics. What is your business called and what do you do?" },
    { title: 'Profile & Location', description: "Tell us more about your business and where you're located." },
    { title: 'Subscription Plan', description: 'Finally, choose a plan that fits your needs.' },
  ];

  const renderCategoryCheckboxes = () => {
    if (filteredCategoryGroups.length === 0) {
      return <p className="text-muted-foreground">Please select a business type first to see available categories.</p>;
    }

    return (
      <FormField
        control={form.control}
        name="categoryIds"
        render={({ field }) => {
          // field.value is the array of selected ids
          const value: string[] = field.value || [];
          const toggle = (id: string, checked: boolean) => {
            const next = checked ? [...value, id] : value.filter((v) => v !== id);
            field.onChange(next);
          };

          return (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">What do you do?</FormLabel>
                <FormDescription>Select all categories that apply to your business.</FormDescription>
              </div>

              <div className="space-y-6">
                {filteredCategoryGroups.map((section) => (
                  <div key={section.sectionTitle}>
                    {section.categories.map((group) => (
                      <div key={group.groupTitle} className="mb-4">
                        <h4 className="font-semibold mb-2">{group.groupTitle}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                          {group.links.map((item) => (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={value.includes(item.id)}
                                  onCheckedChange={(checked) => toggle(item.id, Boolean(checked))}
                                  aria-label={`Select ${item.name}`}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">{item.name}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  };

  const businessTypes: { id: BusinessType; name: string; description: string; icon: React.ElementType }[] = [
    { id: 'store', name: 'Retail Stores', description: 'Shop finished goods directly.', icon: Store },
    { id: 'manufacturing', name: 'Manufacturers', description: 'For bulk & custom orders.', icon: Factory },
    { id: 'repairs', name: 'Repair Shops', description: 'Get your items fixed by experts.', icon: Wrench },
    { id: 'services', name: 'Service Providers', description: 'Hire skilled professionals.', icon: Briefcase },
  ];

  return (
    <div className="space-y-8">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={cn('relative flex-1', { 'pr-8 sm:pr-20': stepIdx !== steps.length - 1 })}>
              {stepIdx < currentStep ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-primary" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(stepIdx)}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">{step.name}</span>
                  </button>
                </>
              ) : stepIdx === currentStep ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background" aria-current="step">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-background hover:border-gray-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" aria-hidden="true" />
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{stepDetails[currentStep].title}</CardTitle>
              <CardDescription>{stepDetails[currentStep].description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 min-h-[400px]">
              {currentStep === 0 && (
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {businessTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <Label
                                key={type.id}
                                htmlFor={type.id}
                                className="flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                                <Icon className="mb-3 size-8 text-muted-foreground" />
                                <span className="font-bold">{type.name}</span>
                                <span className="text-sm text-muted-foreground text-center mt-1">{type.description}</span>
                              </Label>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="pt-2 text-center" />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Adinkra Crafts" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {renderCategoryCheckboxes()}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Bio</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us about your business, your products, and your passion." {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo field with preview and per-field error */}
                    <FormField
                      control={form.control}
                      name="logo"
                      render={() => (
                        <FormItem>
                          <FormLabel>Business Logo (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-2">
                              <input
                                id="logo-input"
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                onChange={(e) => validateAndSetFile('logo', e.target.files)}
                                className="hidden"
                              />
                              <label htmlFor="logo-input" className="inline-block w-full">
                                <div className="border rounded px-3 py-2 text-sm text-muted-foreground flex items-center justify-between">
                                  <span>{logoPreview ? 'Change file' : 'Choose a file…'}</span>
                                  <span className="text-xs text-muted-foreground">{logoPreview ? 'Selected' : 'No file'}</span>
                                </div>
                              </label>

                              {logoPreview ? (
                                <div className="relative w-36 h-36 border rounded overflow-hidden">
                                  <img src={logoPreview} alt="Logo preview" className="object-cover w-full h-full" />
                                  <button
                                    type="button"
                                    onClick={() => removeFile('logo')}
                                    className="absolute top-1 right-1 bg-white/80 rounded px-2 py-1 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <div className="relative w-36 h-36 rounded overflow-hidden border bg-secondary">
                                  <NextImage
                                    src="/agora-logo.png"
                                    alt="Agora logo placeholder"
                                    fill
                                    className="object-contain p-4"
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Banner field with preview */}
                    <FormField
                      control={form.control}
                      name="banner"
                      render={() => (
                        <FormItem>
                          <FormLabel>Storefront Banner (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-2">
                              <input
                                id="banner-input"
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                onChange={(e) => validateAndSetFile('banner', e.target.files)}
                                className="hidden"
                              />
                              <label htmlFor="banner-input" className="inline-block w-full">
                                <div className="border rounded px-3 py-2 text-sm text-muted-foreground flex items-center justify-between">
                                  <span>{bannerPreview ? 'Change file' : 'Choose a file…'}</span>
                                  <span className="text-xs text-muted-foreground">{bannerPreview ? 'Selected' : 'No file'}</span>
                                </div>
                              </label>

                              {bannerPreview ? (
                                <div className="relative w-full h-28 border rounded overflow-hidden">
                                  <img src={bannerPreview} alt="Banner preview" className="object-cover w-full h-full" />
                                  <button
                                    type="button"
                                    onClick={() => removeFile('banner')}
                                    className="absolute top-1 right-1 bg-white/80 rounded px-2 py-1 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">Accepted: .jpg, .png, .webp — max 5MB</div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Address</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 123 Adinkra Lane, Kumasi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="regionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your business region" />
                            </SelectTrigger>
                            <SelectContent>
                              {regions.map((region) => (
                                <SelectItem key={region.id} value={region.id}>
                                  {region.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="subscriptionPlan"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Choose your Subscription Plan</FormLabel>
                        <FormControl>
                          <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-4">
                            <Label htmlFor="basic-plan" className="flex flex-col rounded-lg border p-4 cursor-pointer [&:has(:checked)]:border-primary">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                  <RadioGroupItem value="basic" id="basic-plan" />
                                  <span className="font-bold text-lg">Basic (Free)</span>
                                </div>
                              </div>
                              <div className="mt-2 pl-[34px] text-sm text-muted-foreground">
                                <p className="mb-2">Ideal for new sellers testing the platform.</p>
                              </div>
                            </Label>

                            <Label htmlFor="premium-plan" className="flex flex-col rounded-lg border p-4 cursor-pointer [&:has(:checked)]:border-primary">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                  <RadioGroupItem value="premium" id="premium-plan" />
                                  <span className="font-bold text-lg">Premium</span>
                                </div>
                              </div>
                              <div className="mt-2 pl-[34px] text-sm text-muted-foreground">
                                <p className="mb-2">For growing sellers who want more tools.</p>
                              </div>
                            </Label>

                            <Label htmlFor="enterprise-plan" className="flex flex-col rounded-lg border p-4 cursor-pointer [&:has(:checked)]:border-primary">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                  <RadioGroupItem value="enterprise" id="enterprise-plan" />
                                  <span className="font-bold text-lg">Enterprise</span>
                                </div>
                              </div>
                              <div className="mt-2 pl-[34px] text-sm text-muted-foreground">
                                <p className="mb-2">For large brands, exporters, and wholesalers.</p>
                              </div>
                            </Label>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
                  Back
                </Button>
              )}

              {currentStep < totalSteps - 1 ? (
                <Button type="button" onClick={handleNextStep} className={currentStep === 0 ? 'ml-auto' : ''} disabled={isLoading}>
                  Next Step
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading} className="ml-auto">
                  {isLoading ? (
                    <>
                      <LiquidLoader className="mr-2" />
                      Creating Business...
                    </>
                  ) : (
                    'Create Business & Continue'
                  )}
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
