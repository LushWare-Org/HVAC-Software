export const customerData = {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, New York, NY 10001',
    memberSince: '2023-06-15',
};

export const jobs = [
    {
        id: 'JOB-001',
        service: 'AC Repair',
        description: 'Air conditioning unit not cooling properly',
        date: '2024-01-15',
        status: 'completed',
        technician: 'Mike Johnson',
        cost: 180,
    },
    {
        id: 'JOB-002',
        service: 'Furnace Maintenance',
        description: 'Annual furnace inspection and cleaning',
        date: '2024-02-20',
        status: 'scheduled',
        technician: 'Sarah Williams',
        cost: 120,
    },
    {
        id: 'JOB-003',
        service: 'Thermostat Installation',
        description: 'Install smart thermostat Nest Gen 4',
        date: '2024-01-30',
        status: 'completed',
        technician: 'Mike Johnson',
        cost: 280,
    },
    {
        id: 'JOB-004',
        service: 'HVAC Filter Replacement',
        description: 'Replace all air filters in the system',
        date: '2024-03-05',
        status: 'pending',
        technician: 'Tom Baker',
        cost: 75,
    },
    {
        id: 'JOB-005',
        service: 'Duct Cleaning',
        description: 'Full duct cleaning and sanitization',
        date: '2024-03-12',
        status: 'scheduled',
        technician: 'Sarah Williams',
        cost: 350,
    },
];

export const invoices = [
    {
        id: 'INV-001',
        date: '2024-01-15',
        dueDate: '2024-02-15',
        amount: 180,
        status: 'paid',
        items: ['AC Repair Service'],
    },
    {
        id: 'INV-002',
        date: '2024-01-30',
        dueDate: '2024-03-01',
        amount: 280,
        status: 'pending',
        items: ['Smart Thermostat', 'Installation Labor'],
    },
    {
        id: 'INV-003',
        date: '2024-03-05',
        dueDate: '2024-04-05',
        amount: 75,
        status: 'overdue',
        items: ['HVAC Filter Replacement'],
    },
    {
        id: 'INV-004',
        date: '2024-03-12',
        dueDate: '2024-04-12',
        amount: 350,
        status: 'pending',
        items: ['Duct Cleaning', 'Sanitization Treatment'],
    },
];

export const appointments = [
    {
        id: 'APT-001',
        service: 'Furnace Maintenance',
        date: '2024-02-20',
        time: '10:00 AM',
        technician: 'Sarah Williams',
        status: 'confirmed',
    },
];
