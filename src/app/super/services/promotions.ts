

export interface Promotion {
    id: string;
    code: string;
    type: 'Percentage' | 'Fixed Amount';
    value: number;
    status: 'Active' | 'Expired' | 'Scheduled';
    redemptions: number;
    revenueGenerated: number;
    startDate: string;
    endDate: string;
}

const promotions: Promotion[] = [
    {
        id: "PROMO-001",
        code: "SUMMER20",
        type: "Percentage",
        value: 20,
        status: "Active",
        redemptions: 1250,
        revenueGenerated: 45000,
        startDate: "2024-06-01",
        endDate: "2024-08-31"
    },
    {
        id: "PROMO-002",
        code: "WELCOME10",
        type: "Fixed Amount",
        value: 10,
        status: "Active",
        redemptions: 3420,
        revenueGenerated: 180500,
        startDate: "2024-01-01",
        endDate: "2024-12-31"
    },
    {
        id: "PROMO-003",
        code: "FLASHFRIDAY",
        type: "Percentage",
        value: 30,
        status: "Expired",
        redemptions: 850,
        revenueGenerated: 22000,
        startDate: "2024-07-19",
        endDate: "2024-07-19"
    },
    {
        id: "PROMO-004",
        code: "BACK2SCHOOL",
        type: "Percentage",
        value: 15,
        status: "Scheduled",
        redemptions: 0,
        revenueGenerated: 0,
        startDate: "2024-08-15",
        endDate: "2024-09-15"
    },
];


export const getPromotions = (): Promise<Promotion[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(promotions);
        }, 500); // Simulate network delay
    });
};
