import React, { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { useCreateLead } from "../../hooks/useCustomers";
import { useCreateCustomer } from "../../hooks/useCustomers";

interface AddPersonModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "customer" | "lead";
    onCreated?: (record: any) => void;
}

export default function AddPersonModal({
    isOpen,
    onClose,
    type,
    onCreated,
}: AddPersonModalProps) {
    const [error, setError]   = useState<string>('');
    const [formData, setFormData] = useState({
        name:         "",
        email:        "",
        phone:        "",
        customerType: "RESIDENTIAL",
        source:       "WEBSITE",
        serviceInterest: "",
    });

    const createLead     = useCreateLead();
    const createCustomer = useCreateCustomer();

    const isLoading = type === 'lead' ? createLead.isPending : createCustomer.isPending;

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        setError('');

        if (!formData.name.trim()) {
            setError('Full name is required.');
            return;
        }

        // Split "Full Name" into firstName / lastName
        const parts     = formData.name.trim().split(/\s+/);
        const firstName = parts[0];
        const lastName  = parts.slice(1).join(' ') || '';

        if (type === 'lead') {
            createLead.mutate(
                {
                    firstName,
                    lastName,
                    email:           formData.email.trim() || undefined,
                    phone:           formData.phone.trim() || undefined,
                    source:          formData.source || undefined,
                    serviceInterest: formData.serviceInterest.trim() || undefined,
                },
                {
                    onSuccess: (record) => {
                        onCreated?.(record);
                        resetAndClose();
                    },
                    onError: (err: any) => {
                        setError(err?.response?.data?.message ?? 'Failed to create lead. Please try again.');
                    },
                }
            );
        } else {
            createCustomer.mutate(
                {
                    firstName,
                    lastName,
                    email:  formData.email.trim() || undefined,
                    phone:  formData.phone.trim() || undefined,
                    type:   formData.customerType as any,
                    isActive: true,
                    tags:   [],
                },
                {
                    onSuccess: (record) => {
                        onCreated?.(record);
                        resetAndClose();
                    },
                    onError: (err: any) => {
                        setError(err?.response?.data?.message ?? 'Failed to create customer. Please try again.');
                    },
                }
            );
        }
    };

    const resetAndClose = () => {
        setFormData({
            name:            "",
            email:           "",
            phone:           "",
            customerType:    "RESIDENTIAL",
            source:          "WEBSITE",
            serviceInterest: "",
        });
        setError('');
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between shadow-lg">
                    <div className="text-white">
                        <h2 className="text-2xl font-bold">
                            Add New {type === "customer" ? "Customer" : "Lead"}
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Quickly add a new {type} to your database
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-8 space-y-6">

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    disabled={isLoading}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    disabled={isLoading}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="(555) 000-0000"
                                    disabled={isLoading}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                                />
                            </div>

                            {type === "customer" && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Customer Type
                                    </label>
                                    <select
                                        name="customerType"
                                        value={formData.customerType}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                                    >
                                        <option value="RESIDENTIAL">Residential</option>
                                        <option value="COMMERCIAL">Commercial</option>
                                        <option value="INDUSTRIAL">Industrial</option>
                                    </select>
                                </div>
                            )}

                            {type === "lead" && (
                                <>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Lead Source
                                        </label>
                                        <select
                                            name="source"
                                            value={formData.source}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                                        >
                                            <option value="WEBSITE">Website</option>
                                            <option value="WHATSAPP">WhatsApp</option>
                                            <option value="REFERRAL">Referral</option>
                                            <option value="ADS">Facebook / Google Ads</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Service Interest
                                        </label>
                                        <input
                                            type="text"
                                            name="serviceInterest"
                                            value={formData.serviceInterest}
                                            onChange={handleChange}
                                            placeholder="e.g. HVAC Installation, AC Repair"
                                            disabled={isLoading}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer border-0"
                    >
                        {isLoading && <Loader2 size={14} className="animate-spin" />}
                        {isLoading
                            ? "Saving..."
                            : `Create ${type === "customer" ? "Customer" : "Lead"}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
