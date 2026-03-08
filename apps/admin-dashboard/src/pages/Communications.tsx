import { useState } from 'react';
import {
    MessageSquare, Send, Phone, Mail, Bell, Plus, Search,
    Paperclip, Smile,
    Check,
    CheckCheck
} from 'lucide-react';

type Message = {
    id: string;
    customerId: string;
    direction: 'inbound' | 'outbound';
    content: string;
    timestamp: string;
    status?: 'read' | 'delivered';
};

const mockCustomers = [
    { id: '1', name: 'Sarah Williams', phone: '(555) 123-4567' },
    { id: '2', name: 'Robert Chen', phone: '(555) 234-5678' },
    { id: '3', name: 'Clifford Johnson', phone: '(555) 345-6789' },
    { id: '4', name: 'Maria Garcia', phone: '(555) 456-7890' },
    { id: '5', name: 'Tech Solutions', phone: '(555) 567-8901' }
];

const mockMessages: Message[] = [
    { id: 'm1', customerId: '1', direction: 'inbound', content: 'Is the technician going to be on time for the 2 PM appointment?', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), status: 'delivered' },
    { id: 'm2', customerId: '2', direction: 'inbound', content: 'Payment received. Thank you so much for the quick service!', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'read' },
    { id: 'm3', customerId: '3', direction: 'inbound', content: 'The AC is making a weird noise again after yesterdays repair…', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), status: 'delivered' },
    { id: 'm4', customerId: '2', direction: 'outbound', content: 'You are welcome! Let us know if you need anything else.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: 'read' },
    { id: 'm5', customerId: '4', direction: 'inbound', content: 'Can I reschedule to next Tuesday afternoon instead?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), status: 'read' },
    { id: 'm6', customerId: '4', direction: 'outbound', content: 'Sure, I have updated your appointment. See you then!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), status: 'read' },
    { id: 'm7', customerId: '5', direction: 'inbound', content: 'We need to schedule the quarterly maintenance for all 3 units.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), status: 'read' }
];

const mockNotifications = [
    { id: 'n1', type: 'info', title: 'New Message', message: 'Sarah Williams sent a new SMS message.', createdAt: new Date().toISOString(), read: false },
    { id: 'n2', type: 'success', title: 'Payment Received', message: 'Robert Chen paid invoice #INV-102.', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), read: false },
    { id: 'n3', type: 'warning', title: 'Pending Service', message: 'Clifford Johnson reported a returning issue.', createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), read: true },
    { id: 'n4', type: 'info', title: 'Automated Campaign', message: 'Winter Emergency HVAC Alert sent to 250 customers.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true }
];

export default function Communications() {
    const [activeTab, setActiveTab] = useState('messages');
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const customerMessages = mockMessages.reduce((acc, msg) => {
        if (!acc[msg.customerId]) {
            acc[msg.customerId] = [];
        }
        acc[msg.customerId].push(msg);
        return acc;
    }, {} as Record<string, Message[]>);

    Object.keys(customerMessages).forEach(custId => {
        customerMessages[custId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });

    const filteredCustomers = mockCustomers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedCustomerMessages = selectedCustomer
        ? customerMessages[selectedCustomer] || []
        : [];

    const selectedCustomerData = mockCustomers.find(c => c.id === selectedCustomer);

    const handleSendMessage = () => {
        if (!messageText.trim() || !selectedCustomer) return;
        setMessageText('');
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

    return (
        <div className="anim-fade-up">
            <div className="page-tabs">
                <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
                    <MessageSquare size={14} /> Messages
                </button>
                <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                    <Bell size={14} /> Notifications
                    {mockNotifications.filter(n => !n.read).length > 0 && (
                        <span className="tab-count">{mockNotifications.filter(n => !n.read).length}</span>
                    )}
                </button>
            </div>

            <div className="anim-fade-up delay-1">
                {activeTab === 'messages' && (
                    <div className="card h-[calc(100vh-170px)] overflow-hidden flex flex-row p-0 m-0">
                        {/* Customer List */}
                        <div className="w-[320px] border-r border-[var(--bd)] flex flex-col bg-[var(--bg-card)] shrink-0">
                            <div className="p-4 border-b border-[var(--bd)] shrink-0">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--t4)]" />
                                        <input
                                            placeholder="Search customers..."
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border border-[var(--bd)] rounded-[var(--r)] focus:border-[var(--blue)] outline-none text-[var(--t1)]"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button className="btn btn-primary btn-sm px-2" title="New Message">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                {filteredCustomers.map((customer) => {
                                    const msgs = customerMessages[customer.id] || [];
                                    const lastMessage = msgs[msgs.length - 1];
                                    const unreadCount = msgs.filter(m => m.direction === 'inbound' && m.status !== 'read').length;

                                    return (
                                        <div
                                            key={customer.id}
                                            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors border-l-[3px] ${selectedCustomer === customer.id ? 'bg-[var(--blue-glow)] border-[var(--blue)]' : 'border-transparent'
                                                }`}
                                            onClick={() => setSelectedCustomer(customer.id)}
                                        >
                                            <div className="w-[38px] h-[38px] rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center text-sm font-semibold shrink-0">
                                                {getInitials(customer.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <p className={`font-medium text-sm text-[var(--t1)] truncate ${selectedCustomer === customer.id ? 'font-semibold' : ''}`}>{customer.name}</p>
                                                    {lastMessage && (
                                                        <span className="text-xs text-[var(--t4)] whitespace-nowrap ml-2">
                                                            {new Date(lastMessage.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                {lastMessage && (
                                                    <p className="text-[13px] text-[var(--t3)] truncate">
                                                        {lastMessage.direction === 'outbound' && 'You: '}
                                                        {lastMessage.content}
                                                    </p>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <div className="bg-[var(--blue)] text-white text-[10px] font-bold px-[7px] py-[1px] rounded-full shrink-0">
                                                    {unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Message Area */}
                        <div className="flex-1 flex flex-col bg-[var(--bg-card)] min-w-0">
                            {selectedCustomer && selectedCustomerData ? (
                                <>
                                    <div className="p-4 border-b border-[var(--bd)] flex items-center justify-between shrink-0 h-[73px]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[38px] h-[38px] rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center text-sm font-semibold shrink-0">
                                                {getInitials(selectedCustomerData.name)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[var(--t1)] text-[15px]">{selectedCustomerData.name}</p>
                                                <p className="text-xs text-[var(--t3)] mt-px">{selectedCustomerData.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="topbar-icon-btn">
                                                <Phone size={16} />
                                            </button>
                                            <button className="topbar-icon-btn">
                                                <Mail size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-auto p-5 flex flex-col gap-5">
                                        {selectedCustomerMessages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[75%] p-[14px] rounded-2xl ${msg.direction === 'outbound'
                                                        ? 'bg-[var(--blue)] text-white rounded-tr-sm'
                                                        : 'bg-[var(--bg-card-2)] text-[var(--t1)] rounded-tl-sm'
                                                        }`}
                                                >
                                                    <p className="text-[14px] leading-relaxed">{msg.content}</p>
                                                    <div className={`flex items-center gap-1 mt-1.5 justify-end ${msg.direction === 'outbound' ? 'text-blue-100' : 'text-[var(--t4)]'
                                                        }`}>
                                                        <span className="text-[11px]">
                                                            {new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {msg.direction === 'outbound' && (
                                                            msg.status === 'read' ? (
                                                                <CheckCheck size={14} className="ml-0.5" />
                                                            ) : (
                                                                <Check size={14} className="ml-0.5" />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-4 border-t border-[var(--bd)] bg-[var(--bg-surface)] shrink-0">
                                        <div className="flex items-end gap-2 bg-[var(--bg-card)] border border-[var(--bd)] rounded-[var(--r)] p-1.5 focus-within:border-[var(--blue)] focus-within:ring-1 focus-within:ring-[var(--blue)] transition-all">
                                            <button className="topbar-icon-btn shrink-0 border-transparent hover:border-transparent hover:bg-transparent text-[var(--t4)] hover:text-[var(--t2)] mb-0.5">
                                                <Paperclip size={20} />
                                            </button>
                                            <textarea
                                                placeholder="Type your message..."
                                                className="flex-1 bg-transparent border-0 p-2 text-[14px] text-[var(--t1)] outline-none min-h-[40px] max-h-32 resize-none"
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                            />
                                            <button className="topbar-icon-btn shrink-0 border-transparent hover:border-transparent hover:bg-transparent text-[var(--t4)] hover:text-[var(--t2)] mb-0.5 mr-1">
                                                <Smile size={20} />
                                            </button>
                                            <button
                                                className="btn btn-primary shrink-0 h-[40px] w-[40px] p-0 flex items-center justify-center rounded-[var(--r-sm)] mb-0.5 transition-opacity"
                                                onClick={handleSendMessage}
                                                disabled={!messageText.trim()}
                                                style={{ opacity: !messageText.trim() ? 0.6 : 1, cursor: !messageText.trim() ? 'not-allowed' : 'pointer' }}
                                            >
                                                <Send size={18} className="translate-x-[1px]" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-[var(--t4)] bg-[var(--bg-surface)]">
                                    <div className="w-20 h-20 rounded-full bg-[var(--bg-card-2)] flex items-center justify-center mb-5 shadow-inner">
                                        <MessageSquare size={36} className="text-[var(--t3)]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--t1)] mb-1">Your Messages</h3>
                                    <p className="text-[14px]">Select a customer from the sidebar to view context.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="card p-0 overflow-hidden">
                        <div className="card-header border-b border-[var(--bd)] p-5">
                            <div>
                                <div className="card-title text-[16px]">Notifications Center</div>
                                <div className="card-subtitle mt-1">Activity alerts and automated events</div>
                            </div>
                            <button className="btn btn-secondary btn-sm h-[32px]">
                                <Check size={14} className="mr-1.5" /> Mark All Read
                            </button>
                        </div>
                        <div className="flex flex-col">
                            {mockNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-4 p-5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer border-b border-[var(--bd)] last:border-0 ${!notification.read ? 'bg-[var(--blue-glow)]' : ''
                                        }`}
                                >
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'success' ? 'bg-[var(--green-dim)] text-[var(--green)]' :
                                        notification.type === 'warning' ? 'bg-[var(--amber-dim)] text-[var(--amber)]' :
                                            notification.type === 'error' ? 'bg-[var(--red-dim)] text-[var(--red)]' :
                                                'bg-[var(--blue-dim)] text-[var(--blue)]'
                                        }`}>
                                        <Bell size={20} />
                                    </div>
                                    <div className="flex-1 mt-0.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className={`font-medium text-[15px] ${!notification.read ? 'text-[var(--t1)]' : 'text-[var(--t2)]'}`}>
                                                {notification.title}
                                            </p>
                                            <span className="text-xs font-medium text-[var(--t4)]">
                                                {new Date(notification.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-[14px] text-[var(--t3)] leading-relaxed">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--blue)] flex-shrink-0 mt-2 shadow-[0_0_0_4px_var(--blue-dim)]" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
