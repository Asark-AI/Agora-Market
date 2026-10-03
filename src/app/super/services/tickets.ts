

export interface SupportTicket {
    id: string;
    customer: {
        name: string;
        email: string;
    };
    subject: string;
    department: 'Sales' | 'Technical' | 'Billing';
    agent: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    lastUpdated: string;
    history: {
        action: string;
        date: string;
        agent: string;
        note?: string;
    }[];
}

const tickets: SupportTicket[] = [
    {
        id: "TKT-001",
        customer: { name: "Ama Serwaa", email: "ama.s@example.com" },
        subject: "Issue with my recent order",
        department: "Sales",
        agent: "Olivia Martin",
        priority: "High",
        status: "In Progress",
        lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        history: [
            { action: "Ticket Created", date: "2024-07-27T14:30:00Z", agent: "System" },
            { action: "Assigned to Olivia Martin", date: "2024-07-27T14:35:00Z", agent: "Admin" },
            { action: "Agent replied", date: "2024-07-28T10:00:00Z", agent: "Olivia Martin", note: "Asked for order number." }
        ]
    },
    {
        id: "TKT-002",
        customer: { name: "Kwame Mensah", email: "k.mensah@example.com" },
        subject: "Unable to log in to my account",
        department: "Technical",
        agent: "William Kim",
        priority: "Urgent",
        status: "Open",
        lastUpdated: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 26 hours ago (SLA breach)
        history: [{ action: "Ticket Created", date: "2024-07-28T11:20:00Z", agent: "System" }]
    },
    {
        id: "TKT-003",
        customer: { name: "Femi Adebayo", email: "femi.a@example.com" },
        subject: "Question about subscription billing",
        department: "Billing",
        agent: "Unassigned",
        priority: "Medium",
        status: "Open",
        lastUpdated: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago (SLA breach)
        history: [{ action: "Ticket Created", date: "2024-07-27T18:00:00Z", agent: "System" }]
    },
    {
        id: "TKT-004",
        customer: { name: "Esi Parker", email: "esi.p@example.com" },
        subject: "Product return request",
        department: "Sales",
        agent: "Olivia Martin",
        priority: "Low",
        status: "Resolved",
        lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        history: [
             { action: "Ticket Created", date: "2024-07-25T09:00:00Z", agent: "System" },
             { action: "Resolved", date: "2024-07-26T12:00:00Z", agent: "Olivia Martin", note: "Return processed successfully." },
        ]
    }
];

// Simulate an API call to get support tickets
export const getTickets = (): Promise<SupportTicket[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(tickets);
        }, 1000); // Simulate network delay
    });
};

    

    