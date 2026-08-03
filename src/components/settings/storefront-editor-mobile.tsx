'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useStorefrontEditor } from '@/hooks/use-storefront-editor';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { LiquidLoader } from '@/components/liquid-loader';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  CheckCircle2,
  FileText,
  LayoutGrid,
  Palette,
  Package,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import type { Product, ServiceProduct } from '@/lib/types';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

type SectionKey = 'branding' | 'appearance' | 'features' | 'content' | 'seo' | 'products' | 'ai';

type SectionMeta = {
  key: SectionKey;
  title: string;
  description: string;
  icon: typeof Palette;
  hint: string;
};

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => resolve(event.target?.result as string);
  reader.onerror = (error) => reject(error);
  reader.readAsDataURL(file);
});

export function StorefrontEditorMobile() {
  const { seller, sellerProducts, updateSellerProfile, loading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [showSectionSheet, setShowSectionSheet] = useState(false);

  const {
    name,
    setName,
    logo,
    setLogo,
    banner,
    setBanner,
    layout,
    setLayout,
    showReviews,
    setShowReviews,
    showRatings,
    setShowRatings,
    showContactButton,
    setShowContactButton,
    showWishlist,
    setShowWishlist,
    showSocialShare,
    setShowSocialShare,
    showRelatedProducts,
    setShowRelatedProducts,
    themeColor,
    setThemeColor,
    font,
    setFont,
    aboutUs,
    setAboutUs,
    shippingPolicy,
    setShippingPolicy,
    returnPolicy,
    setReturnPolicy,
    faqs,
    setFaqs,
    socials,
    setSocials,
    seo,
    setSeo,
    aiAssistantConfig,
    setAiAssistantConfig,
    logoFile,
    setLogoFile,
    bannerFile,
    setBannerFile,
    products,
    setProducts,
    init,
    isInitialized,
  } = useStorefrontEditor((state) => state);

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
        themeColor: seller.customization?.themeColor || '#1f2937',
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

  const sections: SectionMeta[] = useMemo(() => [
    { key: 'branding', title: 'Branding', description: 'Logo, name, banner', icon: Palette, hint: 'Create a stronger first impression' },
    { key: 'appearance', title: 'Appearance', description: 'Theme, fonts, layout', icon: Wand2, hint: 'Set a polished visual language' },
    { key: 'features', title: 'Features', description: 'Reviews, wishlist, contact', icon: BadgeCheck, hint: 'Create a storefront that converts' },
    { key: 'content', title: 'Content', description: 'About, shipping, returns', icon: FileText, hint: 'Build trust with clear policies' },
    { key: 'seo', title: 'SEO & Social', description: 'Meta tags and social links', icon: Search, hint: 'Improve visibility online' },
    { key: 'products', title: 'Products', description: 'Featured products and previews', icon: Package, hint: 'Highlight your best sellers' },
    { key: 'ai', title: 'AI Assistant', description: 'Smart support suggestions', icon: Bot, hint: 'Let AI guide your store' },
  ], []);

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const dataUri = await fileToDataUri(file);
      setLogo(dataUri);
    }
  };

  const handleBannerChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
    setSaveSuccess(false);
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
            },
          },
        },
        logoFile ?? undefined,
        bannerFile ?? undefined,
      );

      setSaveSuccess(true);
      toast({ title: 'Storefront saved', description: 'Your storefront updates are now live.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Unable to save', description: 'Please try again in a moment.' });
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setSaveSuccess(false), 2200);
    }
  };

  const addFaq = () => setFaqs([...(faqs || []), { question: '', answer: '' }]);
  const removeFaq = (index: number) => setFaqs((faqs || []).filter((_, i) => i !== index));
  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const nextFaqs = [...(faqs || [])];
    nextFaqs[index][field] = value;
    setFaqs(nextFaqs);
  };

  const addAiFaq = () => {
    const nextFaqs = [...(aiAssistantConfig.faqs || []), { question: '', answer: '' }];
    setAiAssistantConfig({ ...aiAssistantConfig, faqs: nextFaqs });
  };
  const removeAiFaq = (index: number) => {
    const nextFaqs = (aiAssistantConfig.faqs || []).filter((_, i) => i !== index);
    setAiAssistantConfig({ ...aiAssistantConfig, faqs: nextFaqs });
  };
  const updateAiFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const nextFaqs = [...(aiAssistantConfig.faqs || [])];
    nextFaqs[index][field] = value;
    setAiAssistantConfig({ ...aiAssistantConfig, faqs: nextFaqs });
  };

  const handleSocialChange = (platform: keyof typeof socials, value: string) => {
    setSocials({ ...socials, [platform]: value });
  };

  const handleSeoChange = (field: keyof typeof seo, value: string) => {
    setSeo({ ...seo, [field]: value });
  };

  const handleAddSampleProduct = () => {
    if (!seller) return;
    const sampleProduct: Product = {
      id: `sample-${Date.now()}`,
      name: 'Sample T-Shirt',
      description: { english: 'A high-quality cotton t-shirt, perfect for everyday wear.', french: '', spanish: '' },
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
    setProducts(products.filter((product) => product.id !== productId));
  };

  if (loading || !seller || !isInitialized) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const renderSectionEditor = () => {
    if (!activeSection) return null;

    const section = sections.find((entry) => entry.key === activeSection);
    if (!section) return null;

    const SectionIcon = section.icon;

    return (
      <div className="space-y-4 animate-[fadeIn_240ms_ease-out]">
        <div className="rounded-3xl border border-border/70 bg-muted/40 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-background p-2 text-primary shadow-sm">
              <SectionIcon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{section.title}</p>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
          </div>
        </div>

        {activeSection === 'branding' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">Store name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 rounded-2xl" placeholder="Your store name" />
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">Store logo</Label>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border bg-muted/60">
                  {logo ? <Image src={logo} alt="Logo preview" fill className="object-contain p-2" /> : <ShieldCheck className="size-6 text-muted-foreground" />}
                </div>
                <Input type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleLogoChange} className="flex-1" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">Store banner</Label>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-16 w-28 overflow-hidden rounded-2xl border bg-muted/60">
                  {banner ? <Image src={banner} alt="Banner preview" fill className="object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Banner</div>}
                </div>
                <Input type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleBannerChange} className="flex-1" />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">Primary color</Label>
              <div className="mt-2 flex items-center gap-3">
                <Input type="text" value={themeColor} onChange={(event) => setThemeColor(event.target.value)} className="h-11 rounded-2xl" />
                <Input type="color" value={themeColor} onChange={(event) => setThemeColor(event.target.value)} className="h-11 w-12 rounded-2xl border-0 bg-transparent p-0" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">Typography</Label>
              <Select onValueChange={(value) => setFont(value as 'modern' | 'serif' | 'minimalist')} value={font}>
                <SelectTrigger className="mt-2 h-11 rounded-2xl">
                  <SelectValue placeholder="Select a style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">Store layout</Label>
              <RadioGroup onValueChange={(value) => setLayout(value as 'grid' | 'list')} value={layout} className="mt-3 grid gap-3 sm:grid-cols-2">
                <Label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-border/70 p-4 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground">
                  <RadioGroupItem value="grid" className="sr-only" />
                  <LayoutGrid className="mb-2 size-5" />
                  Grid
                </Label>
                <Label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-border/70 p-4 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground">
                  <RadioGroupItem value="list" className="sr-only" />
                  <FileText className="mb-2 size-5" />
                  List
                </Label>
              </RadioGroup>
            </div>
          </div>
        )}

        {activeSection === 'features' && (
          <div className="space-y-3">
            {[
              { label: 'Customer reviews', description: 'Highlight social proof', state: showReviews, setter: setShowReviews },
              { label: 'Star ratings', description: 'Show ratings on products', state: showRatings, setter: setShowRatings },
              { label: 'Contact button', description: 'Make it easy to reach you', state: showContactButton, setter: setShowContactButton },
              { label: 'Wishlist', description: 'Let shoppers save favorites', state: showWishlist, setter: setShowWishlist },
              { label: 'Social sharing', description: 'Encourage word-of-mouth', state: showSocialShare, setter: setShowSocialShare },
              { label: 'Related products', description: 'Increase cross-sell chances', state: showRelatedProducts, setter: setShowRelatedProducts },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch checked={item.state} onCheckedChange={item.setter} />
              </div>
            ))}
          </div>
        )}

        {activeSection === 'content' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">About your store</Label>
              <Textarea value={aboutUs} onChange={(event) => setAboutUs(event.target.value)} rows={4} className="mt-2 rounded-2xl" placeholder="Tell your story and why shoppers should trust you." />
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">Shipping policy</Label>
              <Textarea value={shippingPolicy} onChange={(event) => setShippingPolicy(event.target.value)} rows={4} className="mt-2 rounded-2xl" placeholder="Share your shipping promise." />
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">Return policy</Label>
              <Textarea value={returnPolicy} onChange={(event) => setReturnPolicy(event.target.value)} rows={4} className="mt-2 rounded-2xl" placeholder="Explain returns and refunds." />
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">FAQs</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFaq} className="rounded-full">
                  <PlusCircle className="mr-2 size-4" /> Add
                </Button>
              </div>
              <div className="mt-3 space-y-3">
                {(faqs || []).map((faq, index) => (
                  <div key={`${faq.question}-${index}`} className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">FAQ {index + 1}</p>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeFaq(index)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                    <Input placeholder="Question" value={faq.question} onChange={(event) => updateFaq(index, 'question', event.target.value)} className="mt-2 h-11 rounded-2xl" />
                    <Textarea placeholder="Answer" value={faq.answer} onChange={(event) => updateFaq(index, 'answer', event.target.value)} rows={2} className="mt-2 rounded-2xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'seo' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">Social links</Label>
              <div className="mt-3 space-y-3">
                <Input placeholder="Facebook" value={socials.facebook} onChange={(event) => handleSocialChange('facebook', event.target.value)} className="h-11 rounded-2xl" />
                <Input placeholder="Instagram" value={socials.instagram} onChange={(event) => handleSocialChange('instagram', event.target.value)} className="h-11 rounded-2xl" />
                <Input placeholder="X / Twitter" value={socials.twitter} onChange={(event) => handleSocialChange('twitter', event.target.value)} className="h-11 rounded-2xl" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <Label className="text-sm font-semibold">SEO details</Label>
              <div className="mt-3 space-y-3">
                <Input placeholder="Meta title" value={seo.title} onChange={(event) => handleSeoChange('title', event.target.value)} className="h-11 rounded-2xl" />
                <Textarea placeholder="Meta description" value={seo.description} onChange={(event) => handleSeoChange('description', event.target.value)} rows={4} className="rounded-2xl" />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'products' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Featured products</p>
                  <p className="text-sm text-muted-foreground">Preview the products that will appear in your storefront.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSampleProduct} className="rounded-full">
                  <PlusCircle className="mr-2 size-4" /> Add
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {products.length > 0 ? products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-xl border bg-background">
                        <Image src={(product as Product).images?.[0] || (product as ServiceProduct).coverImageUrl || 'https://placehold.co/40x40.png'} alt={product.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Live preview</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveProduct(product.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                )) : <p className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">No featured products yet.</p>}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'ai' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">AI storefront assistant</p>
                  <p className="text-sm text-muted-foreground">Recommend better copy and product highlights.</p>
                </div>
                <Switch checked={aiAssistantConfig.enabled} onCheckedChange={(checked) => setAiAssistantConfig({ ...aiAssistantConfig, enabled: checked })} />
              </div>
              <Textarea value={aiAssistantConfig.instructions} onChange={(event) => setAiAssistantConfig({ ...aiAssistantConfig, instructions: event.target.value })} rows={3} className="mt-3 rounded-2xl" placeholder="Tell the assistant how to support your store." />
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Suggested Q&A</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAiFaq} className="rounded-full">
                  <PlusCircle className="mr-2 size-4" /> Add
                </Button>
              </div>
              <div className="mt-3 space-y-3">
                {(aiAssistantConfig.faqs || []).map((faq, index) => (
                  <div key={`${faq.question}-${index}`} className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">Prompt {index + 1}</p>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeAiFaq(index)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                    <Input placeholder="Question" value={faq.question} onChange={(event) => updateAiFaq(index, 'question', event.target.value)} className="mt-2 h-11 rounded-2xl" />
                    <Textarea placeholder="Answer" value={faq.answer} onChange={(event) => updateAiFaq(index, 'answer', event.target.value)} rows={2} className="mt-2 rounded-2xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            {activeSection ? (
              <Button type="button" variant="ghost" size="icon" onClick={() => setActiveSection(null)} className="h-9 w-9 rounded-full">
                <ArrowLeft className="size-4" />
              </Button>
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{activeSection ? sections.find((entry) => entry.key === activeSection)?.title : 'Storefront editor'}</p>
              <p className="text-xs text-muted-foreground">{activeSection ? 'Edit in place' : 'Mobile-first storefront builder'}</p>
            </div>
          </div>
          <Button type="button" onClick={handleSave} disabled={isSaving} className={`rounded-full px-4 transition ${saveSuccess ? 'bg-emerald-600 text-white hover:bg-emerald-600' : ''}`}>
            {isSaving ? <LiquidLoader /> : saveSuccess ? <><CheckCircle2 className="mr-2 size-4" /> Published</> : <><CheckCircle2 className="mr-2 size-4" /> Save</>}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 pb-24 pt-3 sm:px-4">
        {activeSection ? (
          renderSectionEditor()
        ) : (
          <div className="space-y-3 animate-[fadeIn_240ms_ease-out]">
            <div className="rounded-[24px] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-muted/50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="size-4" /> Mobile storefront studio
              </div>
              <h3 className="mt-2 text-lg font-semibold">Build your store from a phone in minutes.</h3>
              <p className="mt-1 text-sm text-muted-foreground">Tap a section to refine branding, features, content, SEO, and products without leaving the app.</p>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Suggested next move</p>
                  <p className="text-sm text-muted-foreground">Your banner could improve conversions. Add a stronger offer line and featured products.</p>
                </div>
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Wand2 className="size-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button key={section.key} type="button" onClick={() => setActiveSection(section.key)} className="flex w-full items-start justify-between rounded-[22px] border border-border/70 bg-background p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-muted/70 p-2 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{section.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                        <p className="mt-1 text-xs text-primary/80">{section.hint}</p>
                      </div>
                    </div>
                    <div className="rounded-full bg-muted/70 p-2 text-muted-foreground">
                      <ArrowLeft className="size-4 rotate-180" />
                    </div>
                  </button>
                );
              })}
            </div>

            {isMobile ? (
              <div className="rounded-[24px] border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Touch-first editing</p>
                <p className="mt-1">Each section opens into a focused full-screen page so you can adjust details comfortably on a phone.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border/70 bg-background/95 px-3 py-3 backdrop-blur sm:px-4">
        <div className="flex items-center justify-between gap-2 rounded-full border border-border/70 bg-muted/40 p-1.5">
          <Button type="button" variant="ghost" className="flex-1 rounded-full" onClick={() => setShowSectionSheet(true)}>
            {activeSection ? 'Sections' : 'Open sections'}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving} className="flex-1 rounded-full">
            {isSaving ? <LiquidLoader /> : saveSuccess ? 'Published' : 'Publish changes'}
          </Button>
        </div>
      </div>

      {showSectionSheet ? (
        <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm" onClick={() => setShowSectionSheet(false)}>
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-border/70 bg-background p-4 shadow-[0_-20px_60px_-20px_rgba(15,23,42,0.3)]" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-muted" />
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold">Jump to a section</p>
                <p className="text-sm text-muted-foreground">Choose a place to edit next.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setShowSectionSheet(false)}>Close</Button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button key={section.key} type="button" onClick={() => { setActiveSection(section.key); setShowSectionSheet(false); }} className="flex w-full items-center gap-3 rounded-[20px] border border-border/70 bg-background p-3 text-left shadow-sm transition hover:border-primary/40">
                    <div className="rounded-2xl bg-muted/70 p-2 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
