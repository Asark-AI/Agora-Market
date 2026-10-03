
export interface Asset {
    id: string;
    name: string;
    category: 'Images' | 'Videos' | 'Logos' | 'Documents';
    type: 'image' | 'video' | 'logo' | 'document';
    thumbnailUrl: {
        src: string;
        hint: string;
    };
    fileUrl: string;
    uploadedAt: string;
}

const assets: Asset[] = [
    {
        id: "ASSET-001",
        name: "Summer Sale Banner",
        category: "Images",
        type: "image",
        thumbnailUrl: { src: "https://picsum.photos/seed/asset1/400/400", hint: "sale banner summer" },
        fileUrl: "https://picsum.photos/seed/asset1/1920/1080",
        uploadedAt: "2024-07-10"
    },
    {
        id: "ASSET-002",
        name: "Company Logo - Primary",
        category: "Logos",
        type: "logo",
        thumbnailUrl: { src: "https://picsum.photos/seed/asset2/400/400", hint: "company logo orange" },
        fileUrl: "https://picsum.photos/seed/asset2/1000/1000",
        uploadedAt: "2024-01-05"
    },
    {
        id: "ASSET-003",
        name: "New Product Launch Video",
        category: "Videos",
        type: "video",
        thumbnailUrl: { src: "https://picsum.photos/seed/asset3/400/400", hint: "video play button" },
        fileUrl: "#",
        uploadedAt: "2024-06-20"
    },
    {
        id: "ASSET-004",
        name: "Brand Guidelines PDF",
        category: "Documents",
        type: "document",
        thumbnailUrl: { src: "https://picsum.photos/seed/asset4/400/400", hint: "document icon pdf" },
        fileUrl: "#",
        uploadedAt: "2024-02-01"
    },
    {
        id: "ASSET-005",
        name: "Product Shot - Headphones",
        category: "Images",
        type: "image",
        thumbnailUrl: { src: "https://picsum.photos/seed/asset5/400/400", hint: "headphones product shot" },
        fileUrl: "https://picsum.photos/seed/asset5/1200/1200",
        uploadedAt: "2024-07-15"
    },
    {
        id: "ASSET-006",
        name: "Q3 Marketing Report",
        category: "Documents",
        type: "document",
        thumbnailUrl: { src: "https://picsum.photos/seed/asset6/400/400", hint: "report chart document" },
        fileUrl: "#",
        uploadedAt: "2024-07-01"
    },
     {
        id: "ASSET-007",
        name: "Company Logo - White",
        category: "Logos",
        type: "logo",
        thumbnailUrl: { src: "https://picsum.photos/seed/asset7/400/400", hint: "company logo white" },
        fileUrl: "https://picsum.photos/seed/asset7/1000/1000",
        uploadedAt: "2024-01-05"
    },
    {
        id: "ASSET-008",
        name: "Customer Testimonial Video",
        category: "Videos",
        type: "video",
        thumbnailUrl: { src: "https://picsum.photos/seed/asset8/400/400", hint: "person talking testimonial" },
        fileUrl: "#",
        uploadedAt: "2024-05-30"
    },
];

export const getAssets = (): Promise<Asset[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(assets);
        }, 800); // Simulate network delay
    });
};
