
export interface Competitor {
    id: string;
    name: string;
    lastActivity: string; // e.g., "New Product Launch"
    pricing: 'Higher' | 'Lower' | 'Matches';
    promotions: string[]; // e.g., ["15% Off Sitewide", "FREEGIFT"]
    seoRank: number;
    instagramFollowers: number;
    tiktokFollowers: number;
    avatar: {
        src: string;
        hint: string;
    };
}

const competitors: Competitor[] = [
    {
        id: 'COMP-001',
        name: 'Kicks Ghana',
        lastActivity: 'New Sneaker Line',
        pricing: 'Lower',
        promotions: ['KICKS10'],
        seoRank: 5,
        instagramFollowers: 250000,
        tiktokFollowers: 180000,
        avatar: { src: 'https://picsum.photos/seed/comp1/40/40', hint: 'sneaker shoe logo' }
    },
    {
        id: 'COMP-002',
        name: 'Accra Style Co.',
        lastActivity: 'Summer Sale',
        pricing: 'Matches',
        promotions: ['SUMMER25'],
        seoRank: 8,
        instagramFollowers: 120000,
        tiktokFollowers: 95000,
        avatar: { src: 'https://picsum.photos/seed/comp2/40/40', hint: 'fashion clothing logo' }
    },
    {
        id: 'COMP-003',
        name: 'Gadget Hub GH',
        lastActivity: 'Price Drop on Phones',
        pricing: 'Lower',
        promotions: [],
        seoRank: 3,
        instagramFollowers: 80000,
        tiktokFollowers: 45000,
        avatar: { src: 'https://picsum.photos/seed/comp3/40/40', hint: 'gadget electronics logo' }
    },
    {
        id: 'COMP-004',
        name: 'BeautyBox',
        lastActivity: 'Influencer Collab',
        pricing: 'Higher',
        promotions: ['BBGLOW20'],
        seoRank: 12,
        instagramFollowers: 450000,
        tiktokFollowers: 600000,
        avatar: { src: 'https://picsum.photos/seed/comp4/40/40', hint: 'makeup cosmetics logo' }
    },
];

export const getCompetitors = (): Promise<Competitor[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(competitors);
        }, 600); // Simulate network delay
    });
};
