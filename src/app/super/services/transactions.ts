

export interface Transaction {
    id: string;
    type: 'Sale' | 'Refund' | 'Commission' | 'Payout';
    status: 'Completed' | 'Pending' | 'Failed';
    date: string;
    amount: number;
    sellerId: string;
    orderId?: string;
}

const transactions: Transaction[] = [
    { id: 'TXN-001', type: 'Sale', status: 'Completed', date: '2024-07-28', amount: 150.25, sellerId: 'S001', orderId: 'ORD-112' },
    { id: 'TXN-002', type: 'Commission', status: 'Completed', date: '2024-07-28', amount: 22.54, sellerId: 'S001', orderId: 'ORD-112' },
    { id: 'TXN-003', type: 'Sale', status: 'Completed', date: '2024-07-28', amount: 45.00, sellerId: 'S002', orderId: 'ORD-113' },
    { id: 'TXN-004', type: 'Commission', status: 'Completed', date: '2024-07-28', amount: 6.75, sellerId: 'S002', orderId: 'ORD-113' },
    { id: 'TXN-005', type: 'Sale', status: 'Completed', date: '2024-07-27', amount: 9.99, sellerId: 'S006', orderId: 'ORD-115' },
    { id: 'TXN-006', type: 'Commission', status: 'Completed', date: '2024-07-27', amount: 1.50, sellerId: 'S006', orderId: 'ORD-115' },
    { id: 'TXN-007', type: 'Payout', status: 'Pending', date: '2024-07-26', amount: 2327.71, sellerId: 'S001' },
    { id: 'TXN-008', type: 'Payout', status: 'Completed', date: '2024-07-25', amount: 12493.75, sellerId: 'S002' },
    { id: 'TXN-009', type: 'Refund', status: 'Completed', date: '2024-07-24', amount: 25.00, sellerId: 'S003', orderId: 'ORD-110' },
    { id: 'TXN-010', type: 'Sale', status: 'Completed', date: '2024-07-23', amount: 120.00, sellerId: 'S002', orderId: 'ORD-114' },
    { id: 'TXN-011', type: 'Commission', status: 'Completed', date: '2024-07-23', amount: 18.00, sellerId: 'S002', orderId: 'ORD-114' },

];


export const getTransactions = (): Promise<Transaction[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(transactions);
        }, 800); // Simulate network delay
    });
};
