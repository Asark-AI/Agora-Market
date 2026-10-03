
export interface EmailCampaign {
    id: string;
    name: string;
    status: 'Sent' | 'Draft' | 'Scheduled';
    sent: number;
    goal: number;
    openRate: number;
    clickRate: number;
}

export interface AudienceSegment {
    id: string;
    name: string;
    count: number;
}

export interface EmailTemplate {
    id: string;
    name: string;
    lastUpdated: string;
}

const campaigns: EmailCampaign[] = [
    { id: "EC-001", name: "Weekly Newsletter - July Week 2", status: "Sent", sent: 12500, goal: 12500, openRate: 24.5, clickRate: 3.1 },
    { id: "EC-002", name: "Summer Sale Announcement", status: "Sent", sent: 15000, goal: 15000, openRate: 18.2, clickRate: 4.5 },
    { id: "EC-003", name: "New Product Launch: Eco-friendly Bottle", status: "Scheduled", sent: 0, goal: 20000, openRate: 0, clickRate: 0 },
    { id: "EC-004", name: "Q3 Customer Survey", status: "Draft", sent: 0, goal: 18000, openRate: 0, clickRate: 0 },
];

const segments: AudienceSegment[] = [
    { id: "SEG-01", name: "All Subscribers", count: 21500 },
    { id: "SEG-02", name: "VIP Customers", count: 1200 },
    { id: "SEG-03", name: "New Customers (Last 30 Days)", count: 850 },
    { id: "SEG-04", name: "Inactive (6+ months)", count: 4300 },
];

const templates: EmailTemplate[] = [
    { id: "TPL-01", name: "Standard Newsletter", lastUpdated: "2024-07-01" },
    { id: "TPL-02", name: "Promotional Offer", lastUpdated: "2024-06-15" },
    { id: "TPL-03", name: "New Product Announcement", lastUpdated: "2024-05-20" },
];

export const getEmailCampaigns = (): Promise<EmailCampaign[]> => {
    return new Promise(resolve => setTimeout(() => resolve(campaigns), 600));
};

export const getAudienceSegments = (): Promise<AudienceSegment[]> => {
    return new Promise(resolve => setTimeout(() => resolve(segments), 400));
};

export const getEmailTemplates = (): Promise<EmailTemplate[]> => {
    return new Promise(resolve => setTimeout(() => resolve(templates), 500));
};
