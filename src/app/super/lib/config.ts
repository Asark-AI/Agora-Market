// src/lib/config.ts

export const appConfig = {
  logo: {
    path: "M13.23,1.06a2.6,2.6,0,0,0-2.46,0L1.4,7.31A2.6,2.6,0,0,0,0,9.54v9.33a2.59,2.59,0,0,0,1.4,2.23l9.37,6.25a2.59,2.59,0,0,0,2.46,0l9.37-6.25A2.59,2.59,0,0,0,24,18.87V9.54a2.6,2.6,0,0,0-1.4-2.23Z"
  },
    siteName: "Agora",
};

export const pageContentConfig: Record<string, { title: string; content: string | Record<string, string> }> = {
    "home-page": {
        title: "Home Page",
        content: {
            heroImageUrl: "https://placehold.co/1200x600.png",
            promoBannerUrl: "https://placehold.co/1200x200.png",
        }
    },
    "about-us": {
        title: "About Us",
        content: "Welcome to Agora, your premier platform for e-commerce and services...",
    },
    "faq": {
        title: "Frequently Asked Questions",
        content: "Find answers to common questions about our platform, services, and policies.",
    },
    "privacy-policy": {
        title: "Privacy Policy",
        content: "Your privacy is important to us. This policy explains what information we collect and how we use it.",
    },
     "shipping-returns": {
        title: "Shipping & Returns Policy",
        content: "Information about our shipping process, delivery times, and our returns and exchange policy.",
    },
     "customer-service-guidelines": {
        title: "Customer Service Guidelines",
        content: "Our commitment to providing excellent customer service. This includes response time SLAs, and our process for handling complaints.",
    },
    "troubleshooting-guides": {
        title: "Troubleshooting Guides",
        content: "Find solutions to common technical issues and problems.",
    },
    "video-tutorials": {
        title: "Video Tutorials",
        content: "A collection of video tutorials to help you get the most out of our platform.",
    },
    "marketing-guides": {
        title: "Marketing Guides",
        content: "A collection of guides and best practices for marketing on our platform.",
    },
    "brand-guide": {
        title: "Brand Voice & Style Guide",
        content: "Guidelines for maintaining a consistent brand voice, tone, and visual style.",
    },
    "delayed-order": {
        title: "Template: Delayed Order",
        content: "Dear [Customer Name], we are writing to inform you that your order #[Order Number] has been delayed. We apologize for the inconvenience..."
    },
    "refund-confirmation": {
        title: "Template: Refund Confirmation",
        content: "Dear [Customer Name], your refund for order #[Order Number] has been processed. You should see the amount of [Amount] back in your account within 5-7 business days."
    },
    "out-of-stock": {
        title: "Template: Item Out of Stock",
        content: "Dear [Customer Name], unfortunately, the item [Item Name] from your order #[Order Number] is out of stock. We have issued a refund for this item."
    },
    "account-issue": {
        title: "Template: Account Issue",
        content: "Dear [Customer Name], we are having trouble with your account. Please contact support at your earliest convenience to resolve this issue."
    },
    "vip-outreach": {
        title: "Template: VIP Customer Outreach",
        content: "Dear [Customer Name], as one of our valued VIP customers, we'd like to offer you an exclusive 15% discount on your next purchase with code VIP15!"
    },
    "apology-code": {
        title: "Template: Apology Discount",
        content: "Dear [Customer Name], we are sorry for the issue you experienced. Please accept this 10% discount code, SORRY10, for your next purchase as a token of our apology."
    }
};
