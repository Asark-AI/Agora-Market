
export interface Message {
    id: string;
    sender: 'customer' | 'agent';
    content: string;
    timestamp: string;
}

export interface Chat {
    id: string;
    customer: {
        name: string;
        email: string;
        phone: string;
        avatar: string;
        status: string;
    };
    lastMessage: {
        content: string;
        timestamp: string;
    };
    unreadCount: number;
    channel: 'chat' | 'email' | 'phone';
    messages: Message[];
}

const chats: Chat[] = [
    {
        id: "CHAT-001",
        customer: {
            name: "Yaw Graham",
            email: "yaw.g@example.com",
            phone: "+233 24 123 4567",
            avatar: "https://placehold.co/40x40.png",
            status: "Online"
        },
        lastMessage: {
            content: "Okay, thank you for your help!",
            timestamp: "10:45 AM"
        },
        unreadCount: 0,
        channel: 'chat',
        messages: [
            { id: "msg-1", sender: 'customer', content: 'Hi, I have a question about my recent order.', timestamp: '10:40 AM' },
            { id: "msg-2", sender: 'agent', content: 'Hello Yaw, I can certainly help with that. What is your order number?', timestamp: '10:41 AM' },
            { id: "msg-3", sender: 'customer', content: 'It\'s #ORD-005.', timestamp: '10:42 AM' },
            { id: "msg-4", sender: 'agent', content: 'Thank you. I see the order has been fulfilled. What is your question?', timestamp: '10:44 AM' },
            { id: "msg-5", sender: 'customer', content: 'I just wanted to confirm the delivery date. It looks like it arrived today. Okay, thank you for your help!', timestamp: '10:45 AM' },
        ]
    },
    {
        id: "CHAT-002",
        customer: {
            name: "Femi Adebayo",
            email: "femi.a@example.com",
            phone: "+233 55 987 6543",
            avatar: "https://placehold.co/40x40.png",
            status: "Active 5m ago"
        },
        lastMessage: {
            content: "Can you help me with a return?",
            timestamp: "11:30 AM"
        },
        unreadCount: 2,
        channel: 'email',
        messages: [
            { id: "msg-1", sender: 'customer', content: 'Hello?', timestamp: '11:29 AM' },
            { id: "msg-2", sender: 'customer', content: 'Can you help me with a return?', timestamp: '11:30 AM' },
        ]
    },
    {
        id: "CHAT-003",
        customer: {
            name: "Kofi Mensah",
            email: "k.mensah@example.com",
            phone: "+233 20 555 1212",
            avatar: "https://placehold.co/40x40.png",
            status: "Active 2h ago"
        },
        lastMessage: {
            content: "What is your policy on exchanges?",
            timestamp: "Yesterday"
        },
        unreadCount: 0,
        channel: 'phone',
        messages: [
             { id: "msg-1", sender: 'customer', content: 'What is your policy on exchanges?', timestamp: 'Yesterday' },
        ]
    }
];

// Simulate an API call to get chats
export const getChats = (): Promise<Chat[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(chats);
        }, 500); // Simulate network delay
    });
};
