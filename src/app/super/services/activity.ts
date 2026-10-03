
// In a real application, this data would come from a Firestore collection of activity logs.

export interface Activity {
    id: string;
    user: {
        name: string;
        role: 'Admin' | 'Manager' | 'Agent';
        avatar: {
            src: string;
            hint: string;
        }
    };
    action: {
        type: 'create' | 'update' | 'delete' | 'approve' | 'reject';
        description: string;
    };
    resource: {
        type: 'Product' | 'User' | 'Seller' | 'Order' | 'Campaign';
        id: string;
        name: string;
    };
    timestamp: string;
}

// Dummy data for development purposes.
const activities: Activity[] = [
    {
        id: 'ACT-001',
        user: { name: 'Aisha', role: 'Admin', avatar: { src: 'https://picsum.photos/seed/user1/40/40', hint: 'admin user' } },
        action: { type: 'approve', description: 'Approved a new seller account.' },
        resource: { type: 'Seller', id: 'S003', name: 'Urban Threads' },
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    },
    {
        id: 'ACT-002',
        user: { name: 'Jackson Lee', role: 'Manager', avatar: { src: 'https://picsum.photos/seed/user2/40/40', hint: 'manager user' } },
        action: { type: 'create', description: 'Launched a new marketing campaign.' },
        resource: { type: 'Campaign', id: 'CAMP-006', name: 'Holiday Special' },
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    },
    {
        id: 'ACT-003',
        user: { name: 'Olivia Martin', role: 'Agent', avatar: { src: 'https://picsum.photos/seed/user3/40/40', hint: 'agent support' } },
        action: { type: 'update', description: 'Updated an order status to "Shipped".' },
        resource: { type: 'Order', id: 'ORD-115', name: 'Order #ORD-115' },
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    },
    {
        id: 'ACT-004',
        user: { name: 'Aisha', role: 'Admin', avatar: { src: 'https://picsum.photos/seed/user1/40/40', hint: 'admin user' } },
        action: { type: 'reject', description: 'Rejected a product submission.' },
        resource: { type: 'Product', id: 'P004', name: 'The Last Adventure Novel' },
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    },
    {
        id: 'ACT-005',
        user: { name: 'William Kim', role: 'Agent', avatar: { src: 'https://picsum.photos/seed/user4/40/40', hint: 'agent support' } },
        action: { type: 'update', description: 'Suspended a user account.' },
        resource: { type: 'User', id: 'USR-004', name: 'Kwesi Arthur' },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
     {
        id: 'ACT-006',
        user: { name: 'Aisha', role: 'Admin', avatar: { src: 'https://picsum.photos/seed/user1/40/40', hint: 'admin user' } },
        action: { type: 'delete', description: 'Deleted a marketing campaign.' },
        resource: { type: 'Campaign', id: 'CAMP-005', name: 'Back to School' },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
];

/**
 * Simulates fetching activity logs from an API or Firestore.
 * This will be replaced with a real-time subscription in the final implementation.
 * @returns A promise that resolves with an array of activity logs.
 */
export const getActivities = (): Promise<Activity[]> => {
    return new Promise((resolve) => {
        // Simulate a network delay
        setTimeout(() => {
            resolve(activities);
        }, 500);
    });
};
