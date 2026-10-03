
import { LucideIcon, Mail, ShoppingCart, Gift, MessageCircle, Bot } from 'lucide-react';

export interface Automation {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    status: 'Active' | 'Inactive';
    category: 'Email' | 'SMS' | 'On-site';
}

const automations: Automation[] = [
    {
        id: "AUTO-001",
        title: "Welcome Email Series",
        description: "Automatically send a sequence of welcome emails to new subscribers.",
        icon: Mail,
        status: "Active",
        category: "Email",
    },
    {
        id: "AUTO-002",
        title: "Abandoned Cart Recovery",
        description: "Send reminders to customers who leave items in their cart without purchasing.",
        icon: ShoppingCart,
        status: "Active",
        category: "Email",
    },
    {
        id: "AUTO-003",
        title: "Customer Birthday Promo",
        description: "Surprise customers with a special discount or offer on their birthday.",
        icon: Gift,
        status: "Inactive",
        category: "Email",
    },
    {
        id: "AUTO-004",
        title: "SMS Order Updates",
        description: "Keep customers informed about their order status via SMS messages.",
        icon: MessageCircle,
        status: "Active",
        category: "SMS",
    },
    {
        id: "AUTO-005",
        title: "AI Product Recommendations",
        description: "Show personalized product recommendations to users on the homepage.",
        icon: Bot,
        status: "Inactive",
        category: "On-site",
    },
];

export const getAutomations = (): Promise<Automation[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(automations);
        }, 500); // Simulate network delay
    });
};
