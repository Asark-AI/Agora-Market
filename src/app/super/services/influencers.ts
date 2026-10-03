

export interface Influencer {
    id: string;
    name: string;
    channel: 'Instagram' | 'YouTube' | 'TikTok' | 'Blog';
    followers: number;
    status: 'Active' | 'Pending' | 'On Hold';
    commissionRate: number;
    totalSales: number;
    commission: number;
    avatar: {
        src: string;
        hint: string;
    };
}

const influencers: Influencer[] = [
    {
        id: "INF-001",
        name: "Krystal Beauty",
        channel: "Instagram",
        followers: 125000,
        status: "Active",
        commissionRate: 15,
        totalSales: 22500,
        commission: 3375,
        avatar: { src: "https://picsum.photos/seed/inf1/40/40", hint: "woman makeup beauty" }
    },
    {
        id: "INF-002",
        name: "Tech Bro Reviews",
        channel: "YouTube",
        followers: 85000,
        status: "Active",
        commissionRate: 10,
        totalSales: 45000,
        commission: 4500,
        avatar: { src: "https://picsum.photos/seed/inf2/40/40", hint: "man tech gadgets" }
    },
    {
        id: "INF-003",
        name: "Dancing Chef",
        channel: "TikTok",
        followers: 550000,
        status: "On Hold",
        commissionRate: 12,
        totalSales: 12000,
        commission: 1440,
        avatar: { src: "https://picsum.photos/seed/inf3/40/40", hint: "person cooking dancing" }
    },
    {
        id: "INF-004",
        name: "Eco Wanderer",
        channel: "Blog",
        followers: 32000,
        status: "Pending",
        commissionRate: 10,
        totalSales: 0,
        commission: 0,
        avatar: { src: "https://picsum.photos/seed/inf4/40/40", hint: "nature travel blog" }
    },
    {
        id: "INF-005",
        name: "Fit Life Fred",
        channel: "Instagram",
        followers: 210000,
        status: "Active",
        commissionRate: 20,
        totalSales: 31000,
        commission: 6200,
        avatar: { src: "https://picsum.photos/seed/inf5/40/40", hint: "man fitness workout" }
    },
];


export const getInfluencers = (): Promise<Influencer[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(influencers);
        }, 900); // Simulate network delay
    });
};
