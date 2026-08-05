
'use client';

import NextImage from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { recordProductClick } from '@/ai/flows/record-product-click';
import { useCart } from '@/hooks/use-cart';
import { SiteHeader } from '@/components/site-header';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/app-logo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { AiChatWidget } from '@/components/ai-chat-widget';
import { InquiryForm } from '@/components/inquiry-form';
import { Star, Smartphone, Laptop, Tv, WashingMachine, Phone, Mail, ChevronRight, Rss, Factory, Award, Users, FileText, BadgeCheck } from 'lucide-react';

import type { Seller, Product, ServiceProduct, RepairRequest, FaqItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Inter, Lora, Montserrat } from 'next/font/google';


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const lora = Lora({ subsets: ['latin'], variable: '--font-serif' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-minimalist' });


const AuthModal = dynamic(() => import('@/components/auth-modal'), { ssr: false });

type StorefrontItem = Product | ServiceProduct | RepairRequest;

interface StorefrontClientProps {
    isEditorPreview?: boolean;
    seller: Seller;
    products: StorefrontItem[];
    customizations?: any;
}


// StarRating component (from original file)
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="size-5 fill-yellow-400 text-yellow-400" />
      ))}
      {halfStar && (
         <div className="relative">
            <Star key="half" className="size-5 text-yellow-400" />
            <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                <Star className="size-5 fill-yellow-400 text-yellow-400" />
            </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="size-5 text-gray-300" />
      ))}
    </div>
  );
}

// RepairStorefront component (from original file)
function RepairStorefront({ seller }: { seller: Seller }) {
    const faqs = [
        {
            question: "How long does a typical repair take?",
            answer: "Most common repairs, like screen replacements, are completed within 1-2 hours. More complex issues may take 1-3 business days. We provide a time estimate after diagnosing the issue."
        },
        {
            question: "Do you offer a warranty on repairs?",
            answer: "Yes, all our repairs come with a 90-day warranty covering the parts and labor for the original repair. This does not cover accidental damage after the repair."
        },
        {
            question: "Do I need an appointment?",
            answer: "Appointments are recommended to ensure the quickest service, but walk-ins are always welcome. You can book an appointment online to secure your spot."
        }
    ];

    return (
         <div className="bg-background">
            <section className="bg-secondary/50 py-20">
                <div className="container mx-auto max-w-5xl text-center">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Fast & Reliable Repairs</h1>
                    <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">Your trusted partner for fixing all your electronic devices.</p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Button size="lg" asChild><Link href={`/store/${seller.id}/request-repair`}>Book a Repair</Link></Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/track-repair">Track My Repair</Link>
                        </Button>
                    </div>
                </div>
            </section>
            
            <section className="py-16">
                <div className="container mx-auto max-w-5xl">
                    <h2 className="text-3xl font-bold text-center mb-10">What We Fix</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <Card><CardContent className="pt-6"><Smartphone className="size-12 mx-auto text-primary mb-2" /> <p className="font-semibold">Phones</p></CardContent></Card>
                        <Card><CardContent className="pt-6"><Laptop className="size-12 mx-auto text-primary mb-2" /> <p className="font-semibold">Laptops</p></CardContent></Card>
                        <Card><CardContent className="pt-6"><Tv className="size-12 mx-auto text-primary mb-2" /> <p className="font-semibold">TVs</p></CardContent></Card>
                        <Card><CardContent className="pt-6"><WashingMachine className="size-12 mx-auto text-primary mb-2" /> <p className="font-semibold">Appliances</p></CardContent></Card>
                    </div>
                </div>
            </section>

             <section className="bg-muted py-16">
                <div className="container mx-auto max-w-5xl">
                    <h2 className="text-3xl font-bold text-center mb-10">Featured Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card><CardHeader><CardTitle>Phone Screen Replacement</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Cracked screen? We can replace it with a high-quality new screen, making your phone look brand new.</p></CardContent><CardFooter><Button variant="link" className="p-0">Learn More <ChevronRight className="size-4 ml-1" /></Button></CardFooter></Card>
                        <Card><CardHeader><CardTitle>Battery Replacement</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Is your battery dying too quickly? We'll install a new one to restore your device's battery life.</p></CardContent><CardFooter><Button variant="link" className="p-0">Learn More <ChevronRight className="size-4 ml-1" /></Button></CardFooter></Card>
                        <Card><CardHeader><CardTitle>Water Damage Repair</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Accidents happen. Our experts can diagnose and repair water-damaged devices to save your data.</p></CardContent><CardFooter><Button variant="link" className="p-0">Learn More <ChevronRight className="size-4 ml-1" /></Button></CardFooter></Card>
                    </div>
                </div>
            </section>
            
            <section className="py-16">
                 <div className="container mx-auto max-w-4xl grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-4">Need Help? Contact Support</h2>
                        <p className="text-muted-foreground mb-6">Get in touch with us through any of the channels below.</p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Phone className="size-6 text-primary" />
                                <div>
                                    <h3 className="font-semibold">Call Us</h3>
                                    <p className="text-muted-foreground">{seller.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Mail className="size-6 text-primary" />
                                <div>
                                    <h3 className="font-semibold">Email Us</h3>
                                    <a href={`mailto:${seller.email}`} className="text-muted-foreground hover:underline">{seller.email}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, i) => (
                                <AccordionItem value={`item-${i}`} key={i}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>
        </div>
    )
}

// ManufacturingStorefront component (from original file)
function ManufacturingStorefront({ seller, products }: { seller: Seller; products: StorefrontItem[] }) {
  const [inquiryFormOpen, setInquiryFormOpen] = useState(false);

  return (
    <>
      <div className="bg-background">
        <header className="relative">
                        <div className="h-48 md:h-64 bg-muted">
                        <NextImage src={seller.storefrontBannerUrl || 'https://placehold.co/1200x300.png'} alt={`${seller.name} banner`} fill className="object-cover" data-ai-hint="store banner industrial" />
                    </div>
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-background p-2 rounded-full">
             <div className="relative size-24 md:size-32 rounded-full border-4 border-background overflow-hidden bg-muted flex items-center justify-center">
                 {seller.logoUrl ? (
                     <NextImage src={seller.logoUrl} alt={`${seller.name} logo`} fill className="object-cover" data-ai-hint="store logo" />
                 ) : (
                    <Factory className="size-16" />
                )}
            </div>
          </div>
        </header>

         <main className="container mx-auto max-w-5xl px-4 pt-24 pb-12 text-center">
            <h1 className="text-4xl font-bold font-headline">{seller.name}</h1>
            <div className="mt-3 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Award className="size-4" /> Verified Manufacturer</div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2"><Users className="size-4" /> {seller.followerCount || 0} Followers</div>
            </div>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{seller.description || `Welcome to ${seller.name}'s manufacturing hub.`}</p>
             <div className="mt-6 flex justify-center gap-4">
                 <Button size="lg" onClick={() => setInquiryFormOpen(true)}>
                    <FileText className="mr-2 size-5" /> Request a Quote
                 </Button>
            </div>
        </main>
        
        <section className="py-16 bg-muted/50">
            <div className="container mx-auto max-w-7xl px-4">
                <h2 className="text-2xl font-bold mb-6 text-center">Our Production Capabilities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {(products as Product[]).map(product => (
                        <Card key={product.id} className="overflow-hidden flex flex-col">
                            <CardHeader className="p-0">
                                <div className="relative aspect-square w-full bg-muted">
                                    <NextImage src={product.images?.[0] || 'https://placehold.co/300x300.png'} alt={product.name} fill className="object-cover" data-ai-hint="industrial product" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 flex-grow">
                                <h3 className="font-semibold truncate">{product.name}</h3>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button className="w-full" variant="outline" onClick={() => setInquiryFormOpen(true)}>Inquire</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
      </div>
      <InquiryForm seller={seller} open={inquiryFormOpen} onOpenChange={setInquiryFormOpen} />
    </>
  );
}


export function StorefrontClientPage({ isEditorPreview = false, seller: serverSeller, products: serverProducts, customizations }: StorefrontClientProps) {
    const { user, followSeller } = useAuth();
    const { addToCart } = useCart();
    const { toast } = useToast();
    
    const [data, setData] = useState<{ seller: Seller; products: StorefrontItem[] }>({ seller: serverSeller, products: serverProducts });
    const [loading, setLoading] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    useEffect(() => {
        if (isEditorPreview) {
            setData({
                seller: serverSeller!,
                products: serverProducts!,
            });
            setLoading(false);
        }
    }, [isEditorPreview, serverSeller, serverProducts]);

    useEffect(() => {
        if (isEditorPreview && customizations) {
            const styleId = 'storefront-preview-styles';
            let styleElement = document.getElementById(styleId);
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }
            
            const hexToHsl = (hex: string): string | null => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (!result) return null;
                let r = parseInt(result[1], 16) / 255;
                let g = parseInt(result[2], 16) / 255;
                let b = parseInt(result[3], 16) / 255;
                const max = Math.max(r, g, b), min = Math.min(r, g, b);
                let h=0, s=0, l=(max + min) / 2;
                if (max !== min) {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                        case g: h = (b - r) / d + 2; break;
                        case b: h = (r - g) / d + 4; break;
                    }
                    h /= 6;
                }
                return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
            }
            
            const primaryColorHsl = hexToHsl(customizations.themeColor);
            if(primaryColorHsl) {
                 styleElement.innerHTML = `:root { --primary: ${primaryColorHsl}; }`;
            }
        }
    }, [isEditorPreview, customizations?.themeColor]);
    
    const handleFollow = async () => {
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        if (!data?.seller) return;

        try {
            await followSeller(data.seller.id);
            toast({
                title: "Followed!",
                description: `You are now following ${data.seller.name}.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || "Could not follow the seller.",
            });
        }
    };
    
    const currentSeller = data?.seller;
    const currentProducts = data?.products;

    if (loading || !currentSeller || !currentProducts) {
        return (
            <div className="space-y-12">
                <header className="relative">
                    <Skeleton className="h-48 md:h-64 w-full" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                        <Skeleton className="size-24 md:size-32 rounded-full" />
                    </div>
                </header>
                <main className="container mx-auto max-w-5xl px-4 pt-24 pb-12 text-center">
                    <Skeleton className="h-10 w-1/2 mx-auto" />
                    <Skeleton className="h-5 w-1/3 mx-auto mt-4" />
                    <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
                    <div className="mt-6 flex justify-center gap-4">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </main>
            </div>
        );
    }
    
    if (currentSeller.businessType === 'repairs') {
        return <RepairStorefront seller={currentSeller} />;
    }
    
    if (currentSeller.businessType === 'manufacturing') {
        return <ManufacturingStorefront seller={currentSeller} products={currentProducts} />;
    }
    
    const sellerName = isEditorPreview ? customizations.name : currentSeller.name;
    const description = currentSeller.description || `Welcome to ${sellerName}'s store on Agora Seller App.`;
    const bannerUrl = isEditorPreview ? customizations.banner : currentSeller.storefrontBannerUrl;
    const logoUrl = isEditorPreview ? customizations.logo : currentSeller.logoUrl;
    
    const isProductBased = currentSeller.businessType === 'store';
    const title = isProductBased ? 'Our Products' : 'Our Services';
    const layout = isEditorPreview ? customizations.layout : (currentSeller.customization?.layout || 'grid');
    const showContactButton = isEditorPreview ? customizations.showContactButton : (currentSeller.customization?.features?.contact ?? true);
    const font = isEditorPreview ? customizations.font : (currentSeller.customization?.font || 'modern');
    const fontClass = font === 'serif' ? lora.variable : font === 'minimalist' ? montserrat.variable : inter.variable;

    const aboutUs = isEditorPreview ? customizations.aboutUs : currentSeller.customization?.policies?.aboutUs;
    const shippingPolicy = isEditorPreview ? customizations.shippingPolicy : currentSeller.customization?.policies?.shippingPolicy;
    const returnPolicy = isEditorPreview ? customizations.returnPolicy : currentSeller.customization?.policies?.returnPolicy;
    const faqs = isEditorPreview ? customizations.aiAssistantConfig.faqs : currentSeller.aiAssistantConfig?.faqs;

    const shouldShowPoliciesSection = aboutUs || shippingPolicy || returnPolicy || (faqs && faqs.length > 0);

    const ratingValue = (currentSeller.trustScore || 0) / 20;

    const previewSellerForAI = useMemo(() => {
        if (!isEditorPreview) return currentSeller;
        
        return {
            ...currentSeller,
            name: customizations.name,
            aiAssistantConfig: customizations.aiAssistantConfig,
            customization: {
                ...(currentSeller.customization || {}),
                policies: {
                    ...(currentSeller.customization?.policies || {}),
                    shippingPolicy: customizations.shippingPolicy,
                    returnPolicy: customizations.returnPolicy,
                }
            }
        } as Seller;
    }, [isEditorPreview, currentSeller, customizations]);

    return (
        <>
        <SiteHeader />
        <div className={cn("bg-background", fontClass, isEditorPreview && "font-sans")}>
            <header className="bg-secondary/30">
                <div className="relative h-48 md:h-64 bg-muted">
                        <NextImage 
                            src={bannerUrl || 'https://placehold.co/1200x300.png'} 
                            alt={`${sellerName} banner`} 
                            fill 
                            className="object-cover" 
                            data-ai-hint="store banner"
                        />
                    </div>
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="flex flex-col sm:flex-row items-center gap-6 -mt-16 relative z-10">
                        <div className="relative size-32 rounded-full border-4 border-background overflow-hidden bg-muted flex items-center justify-center shrink-0">
                            {logoUrl ? (
                                <NextImage src={logoUrl} alt={`${sellerName} logo`} fill className="object-cover" data-ai-hint="store logo" />
                            ) : (
                                <AppLogo className="size-16" />
                            )}
                        </div>
                        <div className="flex-grow flex flex-col sm:flex-row items-center justify-between gap-4 w-full text-center sm:text-left">
                            <div>
                                <h1 className="text-3xl font-bold font-headline">{sellerName}</h1>
                                <p className="mt-1 text-muted-foreground">{description}</p>
                                <div className="mt-2 flex items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <StarRating rating={ratingValue} />
                                        <span className="font-semibold text-foreground">{ratingValue.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="size-4" />
                                        <span className="font-semibold text-foreground">{currentSeller.followerCount || 0}</span>
                                        <span>Followers</span>
                                    </div>
                                    {currentSeller.isVerifiedArtisan && <div className="flex items-center gap-1.5 text-blue-600 font-semibold"><BadgeCheck className="size-4" /> Verified Seller</div>}
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                {showContactButton && <Button>Contact Seller</Button>}
                                <Button variant="outline" onClick={handleFollow}>
                                    <Rss className="mr-2 size-4" /> Follow
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto max-w-7xl px-4 py-12">
                 <h2 className="text-2xl font-bold mb-6">{title}</h2>
                 {currentProducts.length > 0 ? (
                    <div className={cn("grid gap-4", 
                        layout === 'grid' 
                        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" 
                        : "grid-cols-1"
                    )}>
                        {currentProducts.map(item => {
                           const product = item as Product;
                           const service = item as ServiceProduct;

                           const name = product.name;
                           const image = product.images?.[0] || service.coverImageUrl || 'https://placehold.co/300x300.png';
                           const price = product.price || service.flatFee;
                           const itemDescription = typeof product.description === 'string' ? product.description : product.description?.english || service.description;

                           const cardContent = (
                            <Card key={item.id} className="overflow-hidden flex flex-col group h-full">
                                <CardHeader className="p-0">
                                    <div className="relative aspect-square w-full bg-muted overflow-hidden">
                                        <NextImage 
                                            src={image} 
                                            alt={name} 
                                            fill 
                                            className="object-cover group-hover:scale-105 transition-transform duration-300" 
                                            data-ai-hint="product image"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-3 flex-grow flex flex-col">
                                    <h3 className="font-medium text-sm leading-tight line-clamp-2 h-[2.5em]">{name}</h3>
                                    {price && <p className="text-lg font-bold mt-1">GH₵{price.toFixed(2)}</p>}
                                    {isProductBased && (
                                        <>
                                            <p className="text-xs text-muted-foreground mt-1">MOQ: 10 pieces</p>
                                            <p className="text-xs text-muted-foreground">151 sold</p>
                                        </>
                                    )}
                                </CardContent>
                                <CardFooter className="p-2">
                                     <Button className="w-full" size="sm" onClick={(e) => { e.stopPropagation(); addToCart(item as Product); }}>
                                        Add to Cart
                                    </Button>
                                </CardFooter>
                            </Card>
                           );

                           if (layout === 'list') {
                               return (
                                <div key={item.id}>
                                    <Card className="overflow-hidden flex flex-col sm:flex-row group">
                                        <div className="relative aspect-video sm:aspect-square sm:w-1/4 bg-muted shrink-0 overflow-hidden">
                                            <NextImage 
                                                src={image} 
                                                alt={name} 
                                                fill 
                                                className="object-cover group-hover:scale-105 transition-transform duration-300" 
                                                data-ai-hint="product image"
                                            />
                                        </div>
                                        <div className="flex flex-col flex-grow">
                                            <CardHeader>
                                                <CardTitle>{name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <p className="text-sm text-muted-foreground line-clamp-3">{itemDescription}</p>
                                            </CardContent>
                                            <CardFooter className="justify-between items-center">
                                                {price && <p className="text-lg font-bold">₵{price.toFixed(2)}</p>}
                                                <Button className="ml-auto" onClick={(e) => { e.stopPropagation(); addToCart(item as Product); }}>
                                                    {isProductBased ? 'Add to Cart' : 'View Details'}
                                                </Button>
                                            </CardFooter>
                                        </div>
                                    </Card>
                                </div>
                               )
                           }

                            return (
                                <div key={item.id}>
                                    {cardContent}
                                </div>
                            )
                        })}
                    </div>
                 ) : (
                    <div className="text-center py-16 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">This seller has not added any {title.toLowerCase()} yet.</p>
                    </div>
                 )}
            </main>

            {shouldShowPoliciesSection && (
                <section className="bg-muted/50 py-16">
                    <div className="container mx-auto max-w-4xl space-y-12">
                        {aboutUs && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4 text-center">About {sellerName}</h2>
                                <div className="prose max-w-none text-center text-muted-foreground"><p>{aboutUs}</p></div>
                            </div>
                        )}
                        {shippingPolicy && (
                             <div>
                                <h2 className="text-2xl font-bold mb-4 text-center">Shipping Policy</h2>
                                <div className="prose max-w-none text-center text-muted-foreground"><p>{shippingPolicy}</p></div>
                            </div>
                        )}
                        {returnPolicy && (
                             <div>
                                <h2 className="text-2xl font-bold mb-4 text-center">Return Policy</h2>
                                <div className="prose max-w-none text-center text-muted-foreground"><p>{returnPolicy}</p></div>
                            </div>
                        )}
                        {faqs && faqs.length > 0 && (
                             <div>
                                <h2 className="text-2xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
                                <Accordion type="single" collapsible className="w-full">
                                    {faqs.map((faq: { question: string; answer: string }, i: number) => (
                                        <AccordionItem value={`item-${i}`} key={i}>
                                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                                            <AccordionContent>{faq.answer}</AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        )}
                    </div>
                </section>
            )}

        </div>
        <AiChatWidget seller={isEditorPreview ? previewSellerForAI : currentSeller} />
        {!isEditorPreview && <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultTab="login" />}
        </>
    );
}
