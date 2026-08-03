
'use client';

import { useState, useEffect } from 'react';
import { useStorefrontEditor } from '@/hooks/use-storefront-editor';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { LiquidLoader } from '@/components/liquid-loader';
import { LayoutGrid, PlusCircle, Trash2, Link as LinkIcon, Bot } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product, ServiceProduct } from '@/lib/types';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
});

export function StorefrontSettingsTab() {
    const { seller, sellerProducts, updateSellerProfile, loading } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const {
        name, setName,
        logo, setLogo,
        banner, setBanner,
        layout, setLayout,
        showReviews, setShowReviews,
        showRatings, setShowRatings,
        showContactButton, setShowContactButton,
        showWishlist, setShowWishlist,
        showSocialShare, setShowSocialShare,
        showRelatedProducts, setShowRelatedProducts,
        themeColor, setThemeColor,
        font, setFont,
        aboutUs, setAboutUs,
        shippingPolicy, setShippingPolicy,
        returnPolicy, setReturnPolicy,
        faqs, setFaqs,
        socials, setSocials,
        seo, setSeo,
        aiAssistantConfig, setAiAssistantConfig,
        logoFile, setLogoFile,
        bannerFile, setBannerFile,
        products, setProducts,
        init, isInitialized
    } = useStorefrontEditor(state => state);

    useEffect(() => {
        if (seller && !isInitialized) {
            init({
                name: seller.name || '',
                logo: seller.logoUrl,
                banner: seller.storefrontBannerUrl,
                products: sellerProducts,
                layout: seller.customization?.layout || 'grid',
                showReviews: seller.customization?.features?.reviews ?? true,
                showRatings: seller.customization?.features?.ratings ?? true,
                showContactButton: seller.customization?.features?.contact ?? true,
                showWishlist: seller.customization?.features?.wishlist ?? false,
                showSocialShare: seller.customization?.features?.socialShare ?? false,
                showRelatedProducts: seller.customization?.features?.relatedProducts ?? false,
                themeColor: seller.customization?.themeColor || '#222222',
                font: seller.customization?.font || 'modern',
                aboutUs: seller.customization?.policies?.aboutUs || '',
                shippingPolicy: seller.customization?.policies?.shippingPolicy || '',
                returnPolicy: seller.customization?.policies?.returnPolicy || '',
                faqs: seller.customization?.policies?.faqs || [],
                socials: seller.customization?.socials || { facebook: '', instagram: '', twitter: '', tiktok: '' },
                seo: seller.customization?.seo || { title: '', description: '' },
                aiAssistantConfig: seller.aiAssistantConfig || { enabled: false, instructions: '', faqs: [] },
            });
        }
    }, [seller, sellerProducts, isInitialized, init]);

    const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const dataUri = await fileToDataUri(file);
            setLogo(dataUri);
        }
    };
    
    const handleBannerChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setBannerFile(file);
            const dataUri = await fileToDataUri(file);
            setBanner(dataUri);
        }
    };

    const handleSave = async () => {
        if (!seller) return;
        setIsSaving(true);
        try {
            await updateSellerProfile(
                seller.id,
                {
                    name,
                    aiAssistantConfig,
                    customization: {
                        ...(seller.customization || {}),
                        layout,
                        themeColor,
                        font,
                        socials,
                        seo,
                        features: {
                            ...(seller.customization?.features || {}),
                            reviews: showReviews,
                            ratings: showRatings,
                            contact: showContactButton,
                            wishlist: showWishlist,
                            socialShare: showSocialShare,
                            relatedProducts: showRelatedProducts,
                        },
                        policies: {
                            ...(seller.customization?.policies || {}),
                            aboutUs,
                            shippingPolicy,
                            returnPolicy,
                            faqs,
                        }
                    }
                },
                logoFile ?? undefined,
                bannerFile ?? undefined,
            );
            
            toast({
                title: "Customization Saved",
                description: "Your storefront settings have been updated.",
            });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to save customization settings." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const addFaq = () => setFaqs([...(faqs || []), { question: '', answer: '' }]);
    const removeFaq = (index: number) => setFaqs((faqs || []).filter((_, i) => i !== index));
    const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
        const newFaqs = [...(faqs || [])];
        newFaqs[index][field] = value;
        setFaqs(newFaqs);
    };
    
    const addAiFaq = () => {
        const newFaqs = [...(aiAssistantConfig.faqs || []), { question: '', answer: '' }];
        setAiAssistantConfig({ ...aiAssistantConfig, faqs: newFaqs });
    };
    const removeAiFaq = (index: number) => {
        const newFaqs = (aiAssistantConfig.faqs || []).filter((_, i) => i !== index);
        setAiAssistantConfig({ ...aiAssistantConfig, faqs: newFaqs });
    };
    const updateAiFaq = (index: number, field: 'question' | 'answer', value: string) => {
        const newFaqs = [...(aiAssistantConfig.faqs || [])];
        newFaqs[index][field] = value;
        setAiAssistantConfig({ ...aiAssistantConfig, faqs: newFaqs });
    };


    const handleSocialChange = (platform: keyof typeof socials, value: string) => {
        setSocials({ ...socials, [platform]: value });
    }
    
    const handleSeoChange = (field: keyof typeof seo, value: string) => {
        setSeo({ ...seo, [field]: value });
    }

    const handleAddSampleProduct = () => {
        if (!seller) return;
        const sampleProduct: Product = {
            id: `sample-${Date.now()}`,
            name: 'Sample T-Shirt',
            description: { english: 'A high-quality cotton t-shirt, perfect for everyday wear. Available in multiple colors.', french: '', spanish: '' },
            price: 120,
            images: ['https://picsum.photos/seed/product1/600/600'],
            videos: [],
            categoryId: 'fashion-mens-clothing',
            sellerId: seller.id,
            userId: seller.userId,
            regionId: seller.regionId,
            stock: 50,
            status: 'active',
            views: 0,
            favorites: 0,
            clicks: 0,
            clickHistory: [],
            specifications: [],
        };
        setProducts([...products, sampleProduct]);
    };
    
    const handleRemoveProduct = (productId: string) => {
        setProducts(products.filter(p => p.id !== productId));
    };
    
    if (loading || !seller || !isInitialized) {
        return (
             <div className="space-y-6 p-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col bg-background border-r">
             <header className="flex h-14 items-center justify-between border-b bg-background px-4">
                <h2 className="text-lg font-semibold">Storefront Editor</h2>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <LiquidLoader /> : 'Save'}
                </Button>
            </header>
            <ScrollArea className="flex-1">
                <Accordion type="multiple" defaultValue={['branding', 'appearance']} className="w-full">
                    
                    <AccordionItem value="branding">
                        <AccordionTrigger className="px-4">Branding</AccordionTrigger>
                        <AccordionContent className="px-4 pt-2 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="store-name">Store Name</Label>
                                <Input id="store-name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Store Logo</Label>
                                <div className="flex items-center gap-4">
                                    <div className="relative size-16 border rounded-md bg-secondary flex-shrink-0 overflow-hidden">
                                        <Image src={logo || '/agora-logo.png'} alt="Logo preview" fill className="object-contain rounded-md p-1" />
                                    </div>
                                    <Input type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleLogoChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Storefront Banner</Label>
                                <div className="flex items-center gap-4">
                                    <div className="relative h-16 w-32 border rounded-md bg-secondary flex-shrink-0">
                                        {banner && <Image src={banner} alt="Banner preview" fill className="object-cover rounded-md" />}
                                    </div>
                                    <Input type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleBannerChange} />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="appearance">
                        <AccordionTrigger className="px-4">Appearance</AccordionTrigger>
                        <AccordionContent className="px-4 pt-2 space-y-4">
                            <div className="space-y-2">
                                <Label>Primary Theme Color</Label>
                                <div className="relative">
                                    <Input type="text" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
                                    <Input type="color" className="absolute top-0 right-1 h-8 w-8 p-1" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Font Style</Label>
                                <Select onValueChange={(value) => setFont(value as any)} value={font}>
                                    <SelectTrigger><SelectValue placeholder="Select a font style" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="modern">Modern (Inter)</SelectItem>
                                        <SelectItem value="serif">Serif (Lora)</SelectItem>
                                        <SelectItem value="minimalist">Minimalist (Montserrat)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Product Layout</Label>
                                <RadioGroup onValueChange={(value) => setLayout(value as any)} value={layout} className="grid grid-cols-2 gap-4 pt-2">
                                    <Label htmlFor="layout-grid" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <RadioGroupItem value="grid" id="layout-grid" className="sr-only" />
                                        <LayoutGrid className="mb-3 h-6 w-6" />
                                        Grid View
                                    </Label>
                                    <Label htmlFor="layout-list" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <RadioGroupItem value="list" id="layout-list" className="sr-only" />
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list mb-3 h-6 w-6"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                                        List View
                                    </Label>
                                </RadioGroup>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="features">
                        <AccordionTrigger className="px-4">Features</AccordionTrigger>
                        <AccordionContent className="px-4 pt-2 space-y-2">
                            {[
                                {label: 'Customer Reviews', state: showReviews, setter: setShowReviews, desc: 'Show product reviews from customers.'},
                                {label: 'Product Ratings', state: showRatings, setter: setShowRatings, desc: 'Display star ratings on products.'},
                                {label: 'Contact Button', state: showContactButton, setter: setShowContactButton, desc: 'Show a "Contact Seller" button.'},
                                {label: 'Enable Wishlist', state: showWishlist, setter: setShowWishlist, desc: 'Allow customers to save items.'},
                                {label: 'Social Sharing', state: showSocialShare, setter: setShowSocialShare, desc: 'Allow sharing products on social media.'},
                                {label: 'Related Products', state: showRelatedProducts, setter: setShowRelatedProducts, desc: 'Show a section for related products.'},
                            ].map(item => (
                                <div key={item.label} className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">{item.label}</Label>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                    <Switch checked={item.state} onCheckedChange={item.setter} />
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="policies">
                        <AccordionTrigger className="px-4">Content & Policies</AccordionTrigger>
                        <AccordionContent className="px-4 pt-2 space-y-4">
                            <div className="space-y-2">
                                <Label>About Us</Label>
                                <Textarea placeholder="Tell your story..." value={aboutUs} onChange={(e) => setAboutUs(e.target.value)} rows={4} />
                            </div>
                            <div className="space-y-2">
                                <Label>Shipping Policy</Label>
                                <Textarea placeholder="Explain your shipping process..." value={shippingPolicy} onChange={(e) => setShippingPolicy(e.target.value)} rows={4} />
                            </div>
                            <div className="space-y-2">
                                <Label>Return Policy</Label>
                                <Textarea placeholder="Detail your return policy..." value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} rows={4} />
                            </div>
                            <div>
                                <Label className="text-base">FAQs</Label>
                                <div className="space-y-2 mt-2">
                                    {(faqs || []).map((faq, index) => (
                                        <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                                            <div className="flex-grow space-y-2">
                                                <Input placeholder="Question" value={faq.question} onChange={(e) => updateFaq(index, 'question', e.target.value)} />
                                                <Textarea placeholder="Answer" value={faq.answer} onChange={(e) => updateFaq(index, 'answer', e.target.value)} rows={2}/>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFaq(index)} className="shrink-0 mt-2">
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                                        <PlusCircle className="mr-2 size-4" /> Add FAQ
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="socials">
                        <AccordionTrigger className="px-4">Social & SEO</AccordionTrigger>
                        <AccordionContent className="px-4 pt-2 space-y-4">
                            <div className="space-y-2">
                                <Label>Facebook URL</Label>
                                <Input placeholder="https://facebook.com/your-page" value={socials.facebook} onChange={(e) => handleSocialChange('facebook', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>Instagram URL</Label>
                                <Input placeholder="https://instagram.com/your-profile" value={socials.instagram} onChange={(e) => handleSocialChange('instagram', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>X (Twitter) URL</Label>
                                <Input placeholder="https://twitter.com/your-handle" value={socials.twitter} onChange={(e) => handleSocialChange('twitter', e.target.value)} />
                            </div>
                             <Separator />
                             <div className="space-y-2">
                                <Label>SEO Meta Title</Label>
                                <Input placeholder="Your Awesome Store Name" value={seo.title} onChange={(e) => handleSeoChange('title', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>SEO Meta Description</Label>
                                <Textarea placeholder="Describe your store for search engines." value={seo.description} onChange={(e) => handleSeoChange('description', e.target.value)} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="preview-products">
                        <AccordionTrigger className="px-4">Preview Products</AccordionTrigger>
                        <AccordionContent className="px-4 pt-2 space-y-4">
                            <div className="space-y-1">
                                <Label>Store Products</Label>
                                <p className="text-xs text-muted-foreground">Manage the products shown in the live preview. This won't affect your actual product listings.</p>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {products.length > 0 ? products.map(product => (
                                    <div key={product.id} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Image 
                                                src={(product as Product).images?.[0] || (product as ServiceProduct).coverImageUrl || 'https://placehold.co/40x40.png'} 
                                                width={32} 
                                                height={32} 
                                                alt={product.name} 
                                                className="rounded-md object-cover flex-shrink-0"
                                            />
                                            <span className="text-sm font-medium truncate">{product.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveProduct(product.id)} className="flex-shrink-0">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No products to preview.</p>
                                )}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddSampleProduct} className="w-full">
                                <PlusCircle className="mr-2 size-4" /> Add Sample Product
                            </Button>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="ai-assistant">
                        <AccordionTrigger className="px-4">AI Assistant</AccordionTrigger>
                        <AccordionContent className="px-4 pt-2 space-y-4">
                            <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable AI Assistant</Label>
                                    <p className="text-xs text-muted-foreground">AI will respond to customer messages.</p>
                                </div>
                                <Switch 
                                    checked={aiAssistantConfig.enabled} 
                                    onCheckedChange={(checked) => setAiAssistantConfig({ ...aiAssistantConfig, enabled: checked })} 
                                />
                            </div>
                             <div className="space-y-2">
                                <Label>AI Instructions</Label>
                                <Textarea 
                                    placeholder="e.g., Be friendly and professional." 
                                    value={aiAssistantConfig.instructions}
                                    onChange={(e) => setAiAssistantConfig({ ...aiAssistantConfig, instructions: e.target.value })}
                                    rows={3} 
                                />
                            </div>
                            <div>
                                <Label className="text-base">AI FAQs</Label>
                                <div className="space-y-2 mt-2">
                                    {(aiAssistantConfig.faqs || []).map((faq, index) => (
                                        <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                                            <div className="flex-grow space-y-2">
                                                <Input placeholder="Question" value={faq.question} onChange={(e) => updateAiFaq(index, 'question', e.target.value)} />
                                                <Textarea placeholder="Answer" value={faq.answer} onChange={(e) => updateAiFaq(index, 'answer', e.target.value)} rows={2}/>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAiFaq(index)} className="shrink-0 mt-2">
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={addAiFaq}>
                                        <PlusCircle className="mr-2 size-4" /> Add AI FAQ
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </ScrollArea>
        </div>
    );
}
