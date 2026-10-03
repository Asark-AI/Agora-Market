
export interface BlogPost {
    id: string;
    title: string;
    author: string;
    publishDate: string;
    status: 'Published' | 'Draft' | 'In Review';
    analytics: {
        views: number;
        avgTime: string; // e.g., "2m 30s"
    };
}

const posts: BlogPost[] = [
    {
        id: "BLOG-001",
        title: "5 Tips for Boosting Your E-commerce Sales in Ghana",
        author: "Aisha",
        publishDate: "2024-07-15",
        status: "Published",
        analytics: { views: 12800, avgTime: "4m 15s" }
    },
    {
        id: "BLOG-002",
        title: "Understanding Mobile Money for Online Shopping",
        author: "Jackson Lee",
        publishDate: "2024-07-02",
        status: "Published",
        analytics: { views: 8900, avgTime: "3m 30s" }
    },
    {
        id: "BLOG-003",
        title: "The Future of Social Commerce: A 2025 Outlook",
        author: "Aisha",
        publishDate: "",
        status: "In Review",
        analytics: { views: 0, avgTime: "0m 0s" }
    },
    {
        id: "BLOG-004",
        title: "Guide to Cross-Border Shipping in West Africa",
        author: "William Kim",
        publishDate: "",
        status: "Draft",
        analytics: { views: 0, avgTime: "0m 0s" }
    },
];


export const getBlogPosts = (): Promise<BlogPost[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(posts);
        }, 700); // Simulate network delay
    });
};
