
export interface Campaign {
    id: string;
    name: string;
    status: 'Active' | 'Planned' | 'Completed' | 'Paused';
    goal: 'Website Traffic' | 'Increase Sales' | 'Generate Leads' | 'Brand Awareness';
    budget: number;
    spent: number;
    revenue: number;
    startDate: string;
    endDate: string;
    performance: {
        ctr: number;
        conversions: number;
    };
}
  
const campaigns: Campaign[] = [
    { 
        id: "CAMP-001", 
        name: "Black Friday Blitz", 
        status: "Completed", 
        goal: "Increase Sales", 
        budget: 15000, 
        spent: 14800,
        revenue: 75000,
        startDate: "2023-11-20", 
        endDate: "2023-11-27", 
        performance: { ctr: 5.2, conversions: 1250 } 
    },
    { 
        id: "CAMP-002", 
        name: "New Year, New Gear", 
        status: "Active", 
        goal: "Website Traffic", 
        budget: 8000, 
        spent: 4500,
        revenue: 12000,
        startDate: "2024-01-01", 
        endDate: "2024-01-31", 
        performance: { ctr: 3.1, conversions: 450 } 
    },
    { 
        id: "CAMP-003", 
        name: "Spring Fashion Launch", 
        status: "Active", 
        goal: "Brand Awareness", 
        budget: 12000, 
        spent: 9200,
        revenue: 15000,
        startDate: "2024-03-01", 
        endDate: "2024-03-15", 
        performance: { ctr: 2.8, conversions: 150 } 
    },
    { 
        id: "CAMP-004", 
        name: "Summer Sizzler Sale", 
        status: "Planned", 
        goal: "Increase Sales", 
        budget: 20000, 
        spent: 0,
        revenue: 0,
        startDate: "2024-06-15", 
        endDate: "2024-06-30", 
        performance: { ctr: 0, conversions: 0 } 
    },
    { 
        id: "CAMP-005", 
        name: "Back to School", 
        status: "Paused", 
        goal: "Generate Leads", 
        budget: 7500, 
        spent: 3000,
        revenue: 4500,
        startDate: "2023-08-10", 
        endDate: "2023-09-10", 
        performance: { ctr: 2.0, conversions: 200 } 
    },
];

// Simulate an API call to get campaigns
export const getCampaigns = (): Promise<Campaign[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(campaigns);
        }, 800); // Simulate a network delay
    });
};
