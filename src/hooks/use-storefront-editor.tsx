
'use client';

import { create } from 'zustand';
import type { Seller, Product, ServiceProduct } from '@/lib/types';
import { createContext, useContext, useRef, type ReactNode } from 'react';

type FaqItem = { question: string; answer: string };
type Socials = { facebook: string; instagram: string; twitter: string; tiktok: string; };
type Seo = { title: string; description: string; };
type AiAssistantConfig = {
    enabled: boolean;
    instructions: string;
    faqs: { question: string; answer: string }[];
};

export interface StorefrontEditorState {
    name: string;
    logo: string | null;
    banner: string | null;
    logoFile: File | null;
    bannerFile: File | null;
    products: (Product | ServiceProduct)[];
    layout: 'grid' | 'list';
    showReviews: boolean;
    showRatings: boolean;
    showContactButton: boolean;
    showWishlist: boolean;
    showSocialShare: boolean;
    showRelatedProducts: boolean;
    themeColor: string;
    font: 'modern' | 'serif' | 'minimalist';
    aboutUs: string;
    shippingPolicy: string;
    returnPolicy: string;
    faqs: FaqItem[];
    socials: Socials;
    seo: Seo;
    aiAssistantConfig: AiAssistantConfig,
    isInitialized: boolean;

    setName: (name: string) => void;
    setLogo: (logo: string | null) => void;
    setBanner: (banner: string | null) => void;
    setLogoFile: (file: File | null) => void;
    setBannerFile: (file: File | null) => void;
    setProducts: (products: (Product | ServiceProduct)[]) => void;
    setLayout: (layout: 'grid' | 'list') => void;
    setShowReviews: (show: boolean) => void;
    setShowRatings: (show: boolean) => void;
    setShowContactButton: (show: boolean) => void;
    setShowWishlist: (show: boolean) => void;
    setShowSocialShare: (show: boolean) => void;
    setShowRelatedProducts: (show: boolean) => void;
    setThemeColor: (color: string) => void;
    setFont: (font: 'modern' | 'serif' | 'minimalist') => void;
    setAboutUs: (text: string) => void;
    setShippingPolicy: (text: string) => void;
    setReturnPolicy: (text: string) => void;
    setFaqs: (faqs: FaqItem[]) => void;
    setSocials: (socials: Socials) => void;
    setSeo: (seo: Seo) => void;
    setAiAssistantConfig: (config: AiAssistantConfig) => void;
    init: (initialState: Partial<StorefrontEditorState>) => void;
}

const createStorefrontEditorStore = () => create<StorefrontEditorState>((set) => ({
    name: 'My Store',
    logo: null,
    banner: null,
    logoFile: null,
    bannerFile: null,
    products: [],
    layout: 'grid',
    showReviews: true,
    showRatings: true,
    showContactButton: true,
    showWishlist: false,
    showSocialShare: false,
    showRelatedProducts: false,
    themeColor: '#222222',
    font: 'modern',
    aboutUs: '',
    shippingPolicy: '',
    returnPolicy: '',
    faqs: [],
    socials: { facebook: '', instagram: '', twitter: '', tiktok: '' },
    seo: { title: '', description: '' },
    aiAssistantConfig: {
        enabled: false,
        instructions: '',
        faqs: []
    },
    isInitialized: false,

    setName: (name) => set({ name }),
    setLogo: (logo) => set({ logo }),
    setBanner: (banner) => set({ banner }),
    setLogoFile: (file) => set({ logoFile: file }),
    setBannerFile: (file) => set({ bannerFile: file }),
    setProducts: (products) => set({ products }),
    setLayout: (layout) => set({ layout }),
    setShowReviews: (show) => set({ showReviews: show }),
    setShowRatings: (show) => set({ showRatings: show }),
    setShowContactButton: (show) => set({ showContactButton: show }),
    setShowWishlist: (show) => set({ showWishlist: show }),
    setShowSocialShare: (show) => set({ showSocialShare: show }),
    setShowRelatedProducts: (show) => set({ showRelatedProducts: show }),
    setThemeColor: (color) => set({ themeColor: color }),
    setFont: (font) => set({ font }),
    setAboutUs: (text) => set({ aboutUs: text }),
    setShippingPolicy: (text) => set({ shippingPolicy: text }),
    setReturnPolicy: (text) => set({ returnPolicy: text }),
    setFaqs: (faqs) => set({ faqs }),
    setSocials: (socials) => set({ socials }),
    setSeo: (seo) => set({ seo }),
    setAiAssistantConfig: (config) => set({ aiAssistantConfig: config }),
    init: (initialState) => set({ ...initialState, isInitialized: true }),
}));

const StorefrontEditorContext = createContext<ReturnType<typeof createStorefrontEditorStore> | null>(null);

export const StorefrontEditorProvider = ({ children }: { children: ReactNode }) => {
    const storeRef = useRef<ReturnType<typeof createStorefrontEditorStore>>();
    if (!storeRef.current) {
        storeRef.current = createStorefrontEditorStore();
    }
    return (
        <StorefrontEditorContext.Provider value={storeRef.current}>
            {children}
        </StorefrontEditorContext.Provider>
    );
};

export function useStorefrontEditor<T>(selector: (state: StorefrontEditorState) => T): T {
    const store = useContext(StorefrontEditorContext);
    if (!store) {
        throw new Error('useStorefrontEditor must be used within a StorefrontEditorProvider');
    }
    return store(selector);
};
