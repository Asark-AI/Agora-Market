

export interface Payout {
    id: string;
    sellerId: string;
    sellerName: string;
    sellerAvatar: {
        src: string;
        hint: string;
    };
    amount: number;
    status: 'Paid' | 'Processing' | 'Pending' | 'Failed';
    requestedDate: string;
    processedDate?: string;
    payoutPeriod: string; // e.g. "July 2024"
    paymentMethod: 'Mobile Money' | 'Bank Transfer';
}

const payouts: Payout[] = [
    { 
        id: 'PAY-001', 
        sellerId: 'S002', 
        sellerName: 'GadgetGalaxy',
        sellerAvatar: { src: 'https://placehold.co/40x40.png', hint: 'phone tablet' },
        amount: 12493.75, 
        status: 'Paid', 
        requestedDate: '2024-07-24', 
        processedDate: '2024-07-25',
        payoutPeriod: 'July 2024',
        paymentMethod: 'Bank Transfer',
    },
    { 
        id: 'PAY-002', 
        sellerId: 'S001', 
        sellerName: 'Crafty Creations',
        sellerAvatar: { src: 'https://placehold.co/40x40.png', hint: 'crafts supplies' },
        amount: 2327.71, 
        status: 'Pending', 
        requestedDate: '2024-07-26',
        payoutPeriod: 'July 2024',
        paymentMethod: 'Mobile Money',
    },
    { 
        id: 'PAY-003', 
        sellerId: 'S005', 
        sellerName: 'Home Goods Inc.',
        sellerAvatar: { src: 'https://placehold.co/40x40.png', hint: 'decor furniture' },
        amount: 8750.00, 
        status: 'Pending', 
        requestedDate: '2024-07-27',
        payoutPeriod: 'July 2024',
        paymentMethod: 'Bank Transfer',
    },
    { 
        id: 'PAY-004', 
        sellerId: 'S006', 
        sellerName: 'Sweet Treats',
        sellerAvatar: { src: 'https://placehold.co/40x40.png', hint: 'chocolate cake' },
        amount: 1499.25, 
        status: 'Paid', 
        requestedDate: '2024-07-20', 
        processedDate: '2024-07-21',
        payoutPeriod: 'July 2024',
        paymentMethod: 'Mobile Money',
    },
    { 
        id: 'PAY-005', 
        sellerId: 'S004', 
        sellerName: 'Accra Tech Repairs',
        sellerAvatar: { src: 'https://placehold.co/40x40.png', hint: 'tools workshop' },
        amount: 350.75, 
        status: 'Failed', 
        requestedDate: '2024-07-22',
        payoutPeriod: 'July 2024',
        paymentMethod: 'Mobile Money',
    },
    { 
        id: 'PAY-006', 
        sellerId: 'S007', 
        sellerName: 'Book Nook',
        sellerAvatar: { src: 'https://placehold.co/40x40.png', hint: 'book library' },
        amount: 950.25, 
        status: 'Processing', 
        requestedDate: '2024-07-28',
        payoutPeriod: 'July 2024',
        paymentMethod: 'Bank Transfer',
    },
];


export const getPayouts = (): Promise<Payout[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(payouts);
        }, 600); // Simulate network delay
    });
};
