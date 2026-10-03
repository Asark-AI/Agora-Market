
// This is a mock service that simulates fetching data from an API.
// In a real application, you would make actual API calls here.

export interface Seller {
    id: string;
    name: string;
    owner: string;
    email: string;
    status: 'Active' | 'Pending' | 'Suspended';
    joined: string;
    revenue: number;
    avatar: {
      src: string;
      hint: string;
    };
    plan: string;
    monthlyFee: number | null;
    expiry: string | null;
    businessType: 'E-commerce' | 'Repair & Maintenance' | 'Manufacturing on Demand' | 'Service Provider';
}

const sellers: Seller[] = [
  { id: "S001", name: "Crafty Creations", owner: "Alice Johnson", email: "alice@crafty.com", status: "Active", joined: "2023-01-15", revenue: 2500.00, avatar: { src: "https://placehold.co/40x40.png", hint: "crafts supplies" }, plan: "Premium", monthlyFee: 50.00, expiry: "2024-01-15", businessType: 'E-commerce' },
  { id: "S002", name: "GadgetGalaxy", owner: "Bob Williams", email: "bob@gg.com", status: "Active", joined: "2023-02-20", revenue: 12500.50, avatar: { src: "https://placehold.co/40x40.png", hint: "phone tablet" }, plan: "Premium", monthlyFee: 50.00, expiry: "2024-02-20", businessType: 'E-commerce' },
  { id: "S003", name: "Urban Threads", owner: "Charlie Brown", email: "charlie@urban.com", status: "Pending", joined: "2023-03-10", revenue: 1800.00, avatar: { src: "https://placehold.co/40x40.png", hint: "t-shirt fashion" }, plan: "Basic", monthlyFee: 10.00, expiry: "2023-11-10", businessType: 'Manufacturing on Demand' },
  { id: "S004", name: "Accra Tech Repairs", owner: "Diana Miller", email: "diana@accrarepair.com", status: "Suspended", joined: "2022-11-05", revenue: 350.75, avatar: { src: "https://placehold.co/40x40.png", hint: "tools workshop" }, plan: "Basic", monthlyFee: 10.00, expiry: "2023-12-05", businessType: 'Repair & Maintenance' },
  { id: "S005", name: "Home Goods Inc.", owner: "Eve Davis", email: "eve@homegoods.com", status: "Active", joined: "2023-04-01", revenue: 8750.00, avatar: { src: "https://placehold.co/40x40.png", hint: "decor furniture" }, plan: "Free", monthlyFee: null, expiry: null, businessType: 'E-commerce' },
  { id: "S006", name: "Sweet Treats", owner: "Frank Wright", email: "frank@sweets.com", status: "Active", joined: "2023-05-12", revenue: 1500.75, avatar: { src: "https://placehold.co/40x40.png", hint: "chocolate cake" }, plan: "Premium", monthlyFee: 50.00, expiry: "2024-05-12", businessType: 'E-commerce' },
  { id: "S007", name: "Book Nook", owner: "Grace Hall", email: "grace@booknook.com", status: "Active", joined: "2023-06-01", revenue: 950.25, avatar: { src: "https://placehold.co/40x40.png", hint: "book library" }, plan: "Free", monthlyFee: null, expiry: null, businessType: 'E-commerce' },
];
  

// Simulate an API call to get sellers
export const getSellers = (): Promise<Seller[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(sellers);
        }, 1000); // Simulate a 1-second network delay
    });
};
