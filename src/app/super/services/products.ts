
// This is a mock service that simulates fetching data from an API.
// In a real application, you would make actual API calls here.

export interface Product {
    id: string;
    name: string;
    seller: string;
    submitted: string;
    status: 'Approved' | 'Pending' | 'Declined';
    price: number;
    category: string;
    stock: number;
    image: {
      src: string;
      hint: string;
    };
}
  
const products: Product[] = [
    { id: "P001", name: "Handmade Leather Wallet", seller: "Crafty Creations", submitted: "2023-10-01", status: "Approved", price: 45.00, category: "Accessories", stock: 50, image: { src: "https://placehold.co/64x64.png", hint: "leather wallet" } },
    { id: "P002", name: "Wireless Bluetooth Headphones", seller: "GadgetGalaxy", submitted: "2023-10-05", status: "Approved", price: 89.99, category: "Electronics", stock: 5, image: { src: "https://placehold.co/64x64.png", hint: "headphones audio" } },
    { id: "P003", name: "Organic Cotton T-Shirt", seller: "Urban Threads", submitted: "2023-10-12", status: "Pending", price: 25.00, category: "Apparel", stock: 300, image: { src: "https://placehold.co/64x64.png", hint: "t-shirt clothing" } },
    { id: "P004", name: "The Last Adventure Novel", seller: "Book Nook", submitted: "2023-10-15", status: "Declined", price: 15.99, category: "Books", stock: 0, image: { src: "https://placehold.co/64x64.png", hint: "book cover" } },
    { id: "P005", name: "Ceramic Coffee Mug", seller: "Home Goods Inc.", submitted: "2023-10-20", status: "Pending", price: 19.50, category: "Homeware", stock: 8, image: { src: "https://placehold.co/64x64.png", hint: "coffee mug" } },
    { id: "P006", name: "Artisanal Dark Chocolate", seller: "Sweet Treats", submitted: "2023-10-22", status: "Approved", price: 9.99, category: "Food & Beverage", stock: 200, image: { src: "https://placehold.co/64x64.png", hint: "chocolate bar" } },
    { id: "P007", name: "Smart Fitness Tracker", seller: "GadgetGalaxy", submitted: "2023-10-24", status: "Approved", price: 120.00, category: "Electronics", stock: 80, image: { src: "https://placehold.co/64x64.png", hint: "fitness watch" } },
    { id: "P008", name: "Scented Soy Candle", seller: "Home Goods Inc.", submitted: "2023-10-25", status: "Pending", price: 22.50, category: "Homeware", stock: 60, image: { src: "https://placehold.co/64x64.png", hint: "candle decor" } },
];

// Simulate an API call to get products
export const getProducts = (): Promise<Product[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(products);
        }, 1200); // Simulate a network delay
    });
};
