

export interface StaffMember {
    id: string;
    name: string;
    email: string;
    department: 'Customer Service' | 'Marketing' | 'Finance';
    role: string;
    joinedDate: string;
    avatar: {
      src: string;
      hint: string;
    };
}
  
const staff: StaffMember[] = [
    { 
        id: "STAFF-001", 
        name: "Olivia Martin", 
        email: "olivia.m@example.com", 
        department: "Customer Service",
        role: "Support Agent", 
        joinedDate: "2023-05-10", 
        avatar: { src: "https://placehold.co/40x40.png", hint: "woman smiling" } 
    },
    { 
        id: "STAFF-002", 
        name: "Jackson Lee", 
        email: "jackson.l@example.com", 
        department: "Marketing",
        role: "Campaign Manager", 
        joinedDate: "2023-06-22", 
        avatar: { src: "https://placehold.co/40x40.png", hint: "man glasses" } 
    },
    { 
        id: "STAFF-003", 
        name: "Isabella Nguyen", 
        email: "isabella.n@example.com", 
        department: "Finance",
        role: "Accountant", 
        joinedDate: "2023-07-01", 
        avatar: { src: "https://placehold.co/40x40.png", hint: "woman dark hair" } 
    },
    { 
        id: "STAFF-004", 
        name: "William Kim", 
        email: "will.k@example.com", 
        department: "Customer Service",
        role: "Support Agent", 
        joinedDate: "2023-08-15", 
        avatar: { src: "https://placehold.co/40x40.png", hint: "man smiling" } 
    },
];

// Simulate an API call to get staff members
export const getStaff = (): Promise<StaffMember[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(staff);
        }, 600); // Simulate a network delay
    });
};

    