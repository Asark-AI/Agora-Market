
export interface Order {
    id: string;
    customerId: string;
    date: string;
    status: 'Delivered' | 'Shipped' | 'Pending' | 'Cancelled';
    total: number;
    items: {
        productId: string;
        name: string;
        quantity: number;
        price: number;
    }[];
}

const orders: Order[] = [
    {
        id: "ORD-112",
        customerId: "USR-001",
        date: "2024-07-20",
        status: "Delivered",
        total: 150.25,
        items: [
            { productId: "P002", name: "Wireless Bluetooth Headphones", quantity: 1, price: 89.99 },
            { productId: "P005", name: "Ceramic Coffee Mug", quantity: 2, price: 19.50 },
        ]
    },
    {
        id: "ORD-113",
        customerId: "USR-002",
        date: "2024-07-22",
        status: "Delivered",
        total: 45.00,
        items: [{ productId: "P001", name: "Handmade Leather Wallet", quantity: 1, price: 45.00 }]
    },
     {
        id: "ORD-114",
        customerId: "USR-001",
        date: "2024-06-15",
        status: "Delivered",
        total: 25.00,
        items: [{ productId: "P003", name: "Organic Cotton T-Shirt", quantity: 1, price: 25.00 }]
    },
     {
        id: "ORD-115",
        customerId: "USR-005",
        date: "2024-07-18",
        status: "Shipped",
        total: 9.99,
        items: [{ productId: "P006", name: "Artisanal Dark Chocolate", quantity: 1, price: 9.99 }]
    },
];

export const getOrders = (): Promise<Order[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(orders);
        }, 300); // Simulate network delay
    });
};
