import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useCreateBooking } from "../../hooks/useCustomers";

interface AddAgreementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (agreement: any) => void;
    customerId?: string;
}

export default function AddAgreementModal({
    isOpen,
    onClose,
    onCreated,
    customerId,
}: AddAgreementModalProps) {
    const createBooking = useCreateBooking();
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        serviceType: "Maintenance",
        description: "",
        preferredDate: new Date().toISOString().split("T")[0],
        alternateDate: "",
        notes: "",
    });

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setError("");
        if (!formData.serviceType || !formData.preferredDate) {
            setError("Service type and preferred date are required.");
            return;
        }
        createBooking.mutate(
            {
                serviceType: formData.serviceType,
                preferredDate: formData.preferredDate,
                description: formData.description || undefined,
                alternateDate: formData.alternateDate || undefined,
                customerId: customerId || undefined,
                notes: formData.notes || undefined,
            },
            {
                onSuccess: (data: any) => {
                    onCreated(data);
                    onClose();
                    setFormData({
                        serviceType: "Maintenance",
                        description: "",
                        preferredDate: new Date().toISOString().split("T")[0],
                        alternateDate: "",
                        notes: "",
                    });
                },
                onError: (err: any) => {
                    setError(err?.response?.data?.message ?? "Failed to create booking.");
                },
            },
        );
    };

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all admin-modal-backdrop"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl admin-modal-box"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between shadow-lg">
                    <div className="text-white">
                        <h2 className="text-2xl font-bold">Add New Booking</h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Create a new service booking for this customer
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
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Service Type
                            </label>
                            <select
                                name="serviceType"
                                value={formData.serviceType}
                                onChange={handleChange}
                                disabled={createBooking.isPending}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                            >
                                <option value="Maintenance">Maintenance</option>
                                <option value="Repair">Repair</option>
                                <option value="Installation">Installation</option>
                                <option value="Inspection">Inspection</option>
                                <option value="Emergency">Emergency</option>
                                <option value="Consultation">Consultation</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the service needed..."
                                disabled={createBooking.isPending}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                                style={{ resize: "none" }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Preferred Date
                                </label>
                                <input
                                    type="date"
                                    name="preferredDate"
                                    value={formData.preferredDate}
                                    onChange={handleChange}
                                    disabled={createBooking.isPending}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Alternate Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    name="alternateDate"
                                    value={formData.alternateDate}
                                    onChange={handleChange}
                                    disabled={createBooking.isPending}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Notes (Optional)
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Any additional notes..."
                                disabled={createBooking.isPending}
                                rows={2}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                                style={{ resize: "none" }}
                            />
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={createBooking.isPending}
                        className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={createBooking.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer border-0"
                    >
                        {createBooking.isPending ? (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : null}
                        {createBooking.isPending ? "Creating..." : "Create Booking"}
                    </button>
                </div>
            </div>
        </div>
    );
}
