
import type { LucideIcon } from "lucide-react";
import type { Unsubscribe, User as FirebaseUser } from "firebase/auth";

export type StatCard = {
  id: string;
  type: 'statCard';
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
};

export type SalesChart = {
  id: string;
  type: 'salesChart';
  title:string;
  data: {
    month: string;
    sales: number;
    revenue: number;
  }[];
};

export type RecentSales = {
  id:string;
  type: 'recentSales';
  title: string;
  data: {
    name: string;
    email: string;
    amount: string;
    avatar: string;
  }[];
};

export type Widget = StatCard | SalesChart | RecentSales;

export type BusinessType = 'store' | 'services' | 'manufacturing' | 'repairs';

export type BusinessConfig = {
  [key in BusinessType]: {
    name: string;
    widgets: Widget[];
  };
};

export type Specification = {
  name: string;
  value: string;
};

export type PricingPackage = {
  name: string; // e.g., Basic, Standard, Premium
  price: number;
  features: string;
};

export type ProductClick = {
  userId: string;
  timestamp: string;
};

export type ServiceProduct = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  sellerId: string;
  userId: string;
  regionId: string;
  status: 'active' | 'inactive' | 'draft' | 'scheduled';
  publishDate?: Date;
  
  // Service Specific Fields
  pricingType: 'flat' | 'hourly' | 'tiered';
  flatFee?: number;
  hourlyRate?: number;
  packages?: PricingPackage[];
  discount?: string;
  
  deliveryMethods: ('online' | 'in-person')[];
  deliveryOnlineDetails?: string; // e.g., Zoom, Google Meet
  deliveryInPersonDetails?: string; // e.g., Service area or address
  duration?: string; // e.g., 30 mins, 1 hour
  
  buyerRequirements?: string;
  
  coverImageUrl: string;
  galleryImageUrls?: string[];
  videoUrl?: string; // YouTube link or uploaded video url
  
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  refundTerms?: string;
  
  views: number;
  favorites: number;
  specifications?: Specification[];
  clicks?: number;
  clickHistory?: ProductClick[];
};

export type Product = {
  id: string;
  name: string;
  description: string | { english: string, french: string, spanish: string };
  price: number;
  costPrice?: number;
  discountPrice?: number;
  images: string[];
  videos: string[];
  categoryId: string;
  sellerId: string;
  userId: string; // For security rules
  regionId: string;
  stock: number;
  status: 'active' | 'inactive' | 'draft';
  barcode?: string;
  views: number;
  favorites: number;
  specifications?: Specification[];
  clicks?: number;
  clickHistory?: ProductClick[];
};

export type SellerNotifications = {
    emailOnOrder: boolean;
    emailOnMessage: boolean;
    smsOnOrder: boolean;
    emailOnRepairUpdate: boolean;
    smsOnRepairUpdate: boolean;
};

export type FaqItem = {
    question: string;
    answer: string;
};

export type Seller = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  businessType: BusinessType;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  regionId: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  notifications: Partial<SellerNotifications>;
  description?: string;
  productCategoryIds?: string[];
  serviceCategoryIds?: string[];
  manufacturingCategoryIds?: string[];
  repairCategoryIds?: string[];
  logoUrl?: string;
  storefrontBannerUrl?: string;
  isVerifiedArtisan?: boolean;
  shipsGlobally?: boolean;
  deliveryOptions?: ('buyer-pickup' | 'seller-delivery')[];
  paymentOptions?: ('cash' | 'card' | 'mobile_money')[];
  pickupLocation?: string;
  googleMapsUrl?: string;
  trustScore?: number;
  followerCount?: number;
  status: 'active' | 'draft';
  customization?: {
    layout?: 'grid' | 'list';
    themeColor?: string;
    font?: 'modern' | 'serif' | 'minimalist';
    socials?: {
        facebook: string;
        instagram: string;
        twitter: string;
        tiktok: string;
    },
    seo?: {
        title: string;
        description: string;
    },
    paymentGateway?: {
        provider?: 'flutterwave';
        publicKey?: string;
        secretKey?: string;
        testMode?: boolean;
    };
    features?: {
      reviews?: boolean;
      ratings?: boolean;
      contact?: boolean;
      contactMethods?: ('email' | 'phone' | 'whatsapp' | 'sms')[];
      repairs?: boolean;
      customOrders?: boolean;
      wishlist?: boolean;
      socialShare?: boolean;
      relatedProducts?: boolean;
    };
    widgets?: {
      sizeChart?: boolean;
    };
    policies?: {
        aboutUs?: string;
        shippingPolicy?: string;
        returnPolicy?: string;
        faqs?: FaqItem[];
    }
  };
  aiAssistantConfig?: {
    enabled: boolean;
    instructions: string;
    faqs: { question: string; answer: string }[];
  };
};

export type User = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'Owner' | 'Admin' | 'Manager' | 'Accountant' | 'Staff';
};

export type OrderStatus = 
  // General
  | 'pending' 
  | 'cancelled' 
  // Store
  | 'shipped' 
  | 'fulfilled'
  // Service
  | 'upcoming' 
  | 'completed' 
  // Repair
  | 'awaiting-quote'
  | 'in-progress'
  | 'awaiting-parts'
  | 'ready-for-pickup'
  | 'delivered';

export type OrderItem = { productId: string; quantity: number; price: number };

export type Order = {
    id: string;
    buyerId: string;
    userId: string; // For security rules
    date: string;
    total: number;
    status: OrderStatus;
    items: OrderItem[];
    paymentMethod?: 'cash' | 'mobile_money' | 'card' | 'other' | 'flutterwave';
    transactionId?: string;
};

export type RepairUpdate = {
    id: string;
    date: string;
    update: string;
    photo?: string;
};

export type RepairRequest = {
    id: string;
    ticketNumber: string;
    buyerId: string;
    userId: string; // For security rules
    customerName: string;
    customerContact: string;
    customerEmail?: string;
    preferredContactMethod?: 'Phone' | 'Email' | 'WhatsApp';
    deviceType: string;
    brandModel: string;
    serialNumber?: string;
    photos?: string[];
    issueSummary: string;
    urgency: 'Normal' | 'High' | 'Emergency';
    warrantyStatus?: 'In Warranty' | 'Out of Warranty' | 'Unknown';
    status: OrderStatus;
    preferredDate?: string;
    locationType: 'Shop Drop-off' | 'On-site Visit';
    address?: string;
    updates?: RepairUpdate[];
    invoiceUrl?: string;
    quote?: number;
    createdAt: any;
};

export type Customer = {
    id: string;
    userId: string; // For security rules
    name: string;
    email: string;
    phone: string;
    avatar: string;
    lastOrderDate: string;
    totalOrders: number;
    totalSpent: number;
    regionId: string;
};

export type Supplier = {
    id: string;
    userId: string; // For security rules
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    totalSpent: number;
    purchaseOrderCount?: number;
};

export type NewSupplier = Omit<Supplier, 'id' | 'totalSpent' | 'userId' | 'purchaseOrderCount'>;

export type PurchaseOrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    cost: number; // cost per item
};

export type PurchaseOrder = {
    id: string;
    supplierId: string;
    date: string; // ISO String
    totalCost: number;
    status: 'draft' | 'ordered' | 'received' | 'cancelled';
    items: PurchaseOrderItem[];
};

export type StockAdjustment = {
    id: string;
    productId: string;
    productName: string;
    date: string; // ISO String
    type: 'addition' | 'subtraction';
    quantity: number; // always positive
    reason: string;
    userId: string;
};

export type Category = {
  id: string;
  name: string;
  type: 'product' | 'service' | 'repair' | 'manufacturing';
  parent?: string;
};

export type Message = {
    id: string;
    customerId: string;
    text: string;
    timestamp: string; // ISO Date String
    senderId: string; // user.id or seller.id
    read: boolean;
};

export type Conversation = {
    id: string;
    customerId: string;
    customerName: string;
    customerAvatar: string;
    lastMessage: Message;
    messages: Message[];
    unreadCount: number;
};

export type CartItem = {
  product: Product | ServiceProduct;
  quantity: number;
};

export type Transaction = {
  id: string;
  date: string; // ISO String
  description: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
};

export type PayoutMethod = {
    id: string;
    type: 'bank' | 'mobile_money';
    accountName: string;
    accountNumber: string;
    bankName?: string;
    mobileMoneyProvider?: 'MTN' | 'Vodafone' | 'AirtelTigo';
    isDefault: boolean;
};

export type WithdrawalRequest = {
  id: string;
  sellerId: string;
  amount: number;
  payoutMethodId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string; // ISO string
  completedAt?: string; // ISO string
  transactionId?: string;
};

export interface AuthState {
  seller: Seller | null;
  user: User | null; // This will hold our custom user object
  firebaseUser: FirebaseUser | null; // This will hold the raw Firebase user
  sellerProducts: (Product | ServiceProduct)[];
  sellerOrders: Order[];
  sellerCustomers: Customer[];
  sellerSuppliers: Supplier[];
  sellerRepairRequests: RepairRequest[];
  sellerMessages: Message[];
  sellerPurchaseOrders: PurchaseOrder[];
  sellerStockAdjustments: StockAdjustment[];
  sellerPayoutMethods: PayoutMethod[];
  loading: boolean;
  initialized: boolean;
  
  // Auth methods
  signUp: (email: string, pass: string, name: string) => Promise<FirebaseUser>;
  logIn: (email: string, pass: string) => Promise<FirebaseUser>;
  signInWithGoogle: () => Promise<FirebaseUser>;
  logOut: () => Promise<void>;
  
  // Data methods
  setSeller: (seller: Seller | null) => void;
  addSeller: (sellerData: Omit<Seller, 'id'>, logoFile?: File, bannerFile?: File) => Promise<Seller>;
  addProduct: (product: Omit<Product, 'id' | 'sellerId' | 'userId' | 'views' | 'favorites' | 'images' | 'videos'>, imageFiles?: FileList, videoFiles?: FileList) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  updateSeller: (sellerId: string, updates: Partial<Seller>) => Promise<void>;
  updateSellerProfile: (sellerId: string, updates: Partial<Seller>, logoFile?: File, bannerFile?: File) => Promise<void>;
  addSupplier: (supplier: NewSupplier) => Promise<void>;
  deleteSeller: (sellerId: string) => Promise<void>;
  addRepairRequest: (sellerId: string, userId: string, requestData: any, photoFiles?: FileList) => Promise<void>;
  updateRepairRequest: (repairId: string, updates: Partial<RepairRequest>) => Promise<void>;
  addOrder: (sellerId: string, orderData: Omit<Order, 'id' | 'date' | 'status' | 'buyerId'>, customerDetails: { name: string, email: string, phone: string, regionId: string }) => Promise<void>;
  addWalkInOrder: (items: OrderItem[], total: number, customerId: string, paymentMethod: 'cash' | 'mobile_money' | 'card' | 'other') => Promise<string>;
  addOrderFromCart: (sellerId: string, items: CartItem[], total: number, transactionId: string) => Promise<void>;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => void;
  followSeller: (sellerId: string) => Promise<void>;
  sendMessage: (customerId: string, text: string) => Promise<void>;
  addStockAdjustment: (adjustment: Omit<StockAdjustment, 'id' | 'date' | 'userId'>) => Promise<void>;
  addPayoutMethod: (method: Omit<PayoutMethod, 'id' | 'isDefault'>) => Promise<void>;
  removePayoutMethod: (methodId: string) => Promise<void>;
  setDefaultPayoutMethod: (methodId: string) => Promise<void>;
  requestWithdrawal: (amount: number, methodId: string) => Promise<string>;
}
