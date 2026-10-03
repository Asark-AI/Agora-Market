

export interface Expense {
    id: string;
    date: string;
    category: 'Infrastructure' | 'Gateway Fees' | 'Marketing' | 'Staff' | 'Support' | 'Legal';
    description: string;
    amount: number;
    receiptUrl?: string; // Optional URL for the receipt
}

const expenses: Expense[] = [
    { 
        id: 'EXP-001', 
        date: '2024-07-28', 
        category: 'Infrastructure', 
        description: 'Monthly AWS Server Costs', 
        amount: 2500.00,
        receiptUrl: '#' 
    },
    { 
        id: 'EXP-002', 
        date: '2024-07-25', 
        category: 'Marketing', 
        description: 'Facebook Ad Campaign - Summer Sale', 
        amount: 1200.50,
        receiptUrl: '#' 
    },
    { 
        id: 'EXP-003', 
        date: '2024-07-20', 
        category: 'Gateway Fees', 
        description: 'Stripe Processing Fees - July Week 3', 
        amount: 850.75,
        receiptUrl: '#' 
    },
    { 
        id: 'EXP-004', 
        date: '2024-07-15', 
        category: 'Staff', 
        description: 'Monthly Payroll - July', 
        amount: 35000.00,
        receiptUrl: '#' 
    },
    { 
        id: 'EXP-005', 
        date: '2024-07-10', 
        category: 'Support', 
        description: 'Zendesk Subscription - July', 
        amount: 450.00,
        receiptUrl: '#' 
    },
    { 
        id: 'EXP-006', 
        date: '2024-07-05', 
        category: 'Legal', 
        description: 'Legal Retainer - Q3 2024', 
        amount: 2500.00,
        receiptUrl: '#' 
    },
];

export const getExpenses = (): Promise<Expense[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(expenses);
        }, 500); // Simulate network delay
    });
};

    