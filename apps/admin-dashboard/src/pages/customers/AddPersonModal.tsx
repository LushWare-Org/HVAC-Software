import React, { useState } from "react";
import { X } from "lucide-react";

interface AddPersonModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "customer" | "lead";
}

export default function AddPersonModal({
    isOpen,
    onClose,
    type,
}: AddPersonModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        customerType: "Residential",
        source: "Website",
    });

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setTimeout(() => {
            console.log(`Saved new ${type}`, formData);
            setIsLoading(false);
            onClose();
            setFormData({
                name: "",
                email: "",
                phone: "",
                customerType: "Residential",
                source: "Website",
            });
        }, 500);
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Full Name
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
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                </select>
                            </div>

                            {type === "lead" && (
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
                                        <option value="Website">Website</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Ads">Facebook / Google Ads</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
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
                                {/* check this (me) */}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer border-0"
                    >
                        {isLoading ? (
                            <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        ) : null}
                        {isLoading
                            ? "Saving..."
                            : `Create ${type === "customer" ? "Customer" : "Lead"}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
