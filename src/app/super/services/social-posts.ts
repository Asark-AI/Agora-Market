
export interface SocialPost {
    id: string;
    platform: 'Facebook' | 'Instagram' | 'TikTok' | 'X/Twitter';
    content: string;
    image?: {
        src: string;
        hint: string;
    };
    status: 'Published' | 'Scheduled' | 'Needs Approval' | 'Draft';
    scheduledDate: string;
    analytics: {
        likes: number;
        comments: number;
        shares: number;
    };
}

const posts: SocialPost[] = [
    {
        id: "POST-001",
        platform: "Instagram",
        content: "Our new Summer Collection just dropped! ☀️ Shop now and get 20% off with code SUMMER20. Link in bio! #summerfashion #newarrivals",
        image: { src: "https://picsum.photos/seed/social1/1080/1080", hint: "summer clothes fashion" },
        status: "Published",
        scheduledDate: new Date().toISOString(),
        analytics: { likes: 1204, comments: 88, shares: 45 }
    },
    {
        id: "POST-002",
        platform: "Facebook",
        content: "Get ready for the heat! Our Summer Sizzler Sale starts next week. Unbeatable deals on all your favorite items. Don't miss out!",
        image: { src: "https://picsum.photos/seed/social2/1200/628", hint: "beach sale discount" },
        status: "Scheduled",
        scheduledDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
        analytics: { likes: 0, comments: 0, shares: 0 }
    },
    {
        id: "POST-003",
        platform: "TikTok",
        content: "Unboxing our new product line! Wait for the last one... it's a game changer! 🤯 #unboxing #newproduct #tech",
        image: { src: "https://picsum.photos/seed/social3/1080/1920", hint: "unboxing video product" },
        status: "Needs Approval",
        scheduledDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        analytics: { likes: 0, comments: 0, shares: 0 }
    },
    {
        id: "POST-004",
        platform: "X/Twitter",
        content: "Quick poll: What's your favorite feature in our app? We're always looking to improve! #feedback #poll",
        status: "Draft",
        scheduledDate: new Date().toISOString(),
        analytics: { likes: 0, comments: 0, shares: 0 }
    },
    {
        id: "POST-005",
        platform: "Instagram",
        content: "Behind the scenes of our latest photoshoot! 📸 So much fun with the team. #bts #photoshoot #team",
        image: { src: "https://picsum.photos/seed/social4/1080/1350", hint: "behind scenes photoshoot" },
        status: "Scheduled",
        scheduledDate: new Date().toISOString(),
        analytics: { likes: 0, comments: 0, shares: 0 }
    },
];

// Simulate an API call to get social media posts
export const getSocialPosts = (): Promise<SocialPost[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(posts);
        }, 500); // Simulate network delay
    });
};
