

export interface User {
    id: string;
    name: string;
    email: string;
    status: 'Active' | 'Inactive' | 'Suspended' | 'Pending';
    dateJoined: string;
    lastOrderDate: string;
    totalSpent: number;
    avatar: {
        src: string;
        hint: string;
    };
    region: string;
    segment: 'New' | 'Returning' | 'VIP';
}

const users: User[] = [
    { 
        id: "USR-001", 
        name: "Adwoa Mensah", 
        email: "adwoa.m@example.com", 
        status: "Active",
        dateJoined: "2023-01-15",
        lastOrderDate: "2024-07-20",
        totalSpent: 1250.75,
        avatar: { src: "https://picsum.photos/seed/1/40/40", hint: "woman smiling" },
        region: "Greater Accra",
        segment: "VIP"
    },
    { 
        id: "USR-002", 
        name: "Bolanle Adeboye", 
        email: "bola.ade@example.com", 
        status: "Active",
        dateJoined: "2023-02-20",
        lastOrderDate: "2024-07-22",
        totalSpent: 850.50,
        avatar: { src: "https://picsum.photos/seed/2/40/40", hint: "man glasses" },
        region: "Ashanti",
        segment: "Returning"
    },
    { 
        id: "USR-003", 
        name: "Chiamaka Okoro", 
        email: "chiamaka.o@example.com", 
        status: "Inactive",
        dateJoined: "2023-03-10",
        lastOrderDate: "2023-11-05",
        totalSpent: 320.00,
        avatar: { src: "https://picsum.photos/seed/3/40/40", hint: "woman dark hair" },
        region: "Western",
        segment: "Returning"
    },
    { 
        id: "USR-004", 
        name: "Kwesi Arthur", 
        email: "kwesi.a@example.com", 
        status: "Suspended",
        dateJoined: "2022-11-05",
        lastOrderDate: "2024-01-10",
        totalSpent: 2400.00,
        avatar: { src: "https://picsum.photos/seed/4/40/40", hint: "man smiling" },
        region: "Eastern",
        segment: "VIP"
    },
    { 
        id: "USR-005", 
        name: "Efe Irele", 
        email: "efe.i@example.com", 
        status: "Active",
        dateJoined: "2023-04-01",
        lastOrderDate: "2024-07-18",
        totalSpent: 560.25,
        avatar: { src: "https://picsum.photos/seed/5/40/40", hint: "woman posing" },
        region: "Volta",
        segment: "Returning"
    },
     { 
        id: "USR-006", 
        name: "Musa Ibrahim", 
        email: "musa.i@example.com", 
        status: "Pending",
        dateJoined: "2024-07-10",
        lastOrderDate: "2024-07-15",
        totalSpent: 85.00,
        avatar: { src: "https://picsum.photos/seed/6/40/40", hint: "man thoughtful" },
        region: "Northern",
        segment: "New"
    },
];

// Simulate an API call to get users
export const getUsers = (): Promise<User[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(users);
        }, 700); // Simulate a network delay
    });
};
