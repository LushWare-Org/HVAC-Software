/**
 * AddPersonModal
 *
 * For type="lead":
 *   - Email is REQUIRED
 *   - On submit: checks if email already has an account
 *       • If yes → red error "A customer account is already linked to this email"
 *       • If no  → POST /crm/auth/provision-lead (creates CRM user + Lead + sends welcome email)
 *   Shows a success banner with "Welcome email sent" after creation.
 *
 * For type="customer":
 *   - Unchanged: POST /crm/customers directly (no account provisioning)
 */

import React, { useState } from "react";
import { X, Loader2, AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useCreateCustomer, useCheckEmail, useProvisionLeadAccount } from "../../hooks/useCustomers";
import { useAuth } from "../../contexts/AuthContext";

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
    const { user } = useAuth();
    const [error, setError]     = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [formData, setFormData] = useState({
        name:            "",
        email:           "",
        phone:           "",
        customerType:    "RESIDENTIAL",
        source:          "WEBSITE",
        serviceInterest: "",
    });

    const createCustomer    = useCreateCustomer();
    const checkEmail        = useCheckEmail();
    const provisionLead     = useProvisionLeadAccount();

    const isLoading = type === 'lead'
        ? (checkEmail.isPending || provisionLead.isPending)
        : createCustomer.isPending;

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        if (!formData.name.trim()) {
            setError('Full name is required.');
            return;
        }

        const email = formData.email.trim();

        if (type === 'lead') {
            // Email is required for leads (needed to create the portal account)
            if (!email) {
                setError('Email address is required to create a customer portal account.');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setError('Please enter a valid email address.');
                return;
            }

            // Step 1: check if this email already has an account
            let emailCheck: { exists: boolean; role?: string; name?: string };
            try {
                emailCheck = await checkEmail.mutateAsync(email);
            } catch {
                setError('Could not verify email. Please try again.');
                return;
            }

            if (emailCheck.exists) {
                setError(
                    emailCheck.role === 'customer'
                        ? 'A customer account is already linked to this email address.'
                        : `An account already exists for this email (role: ${emailCheck.role ?? 'unknown'}).`,
                );
                return;
            }

            // Step 2: provision the account
            const parts     = formData.name.trim().split(/\s+/);
            const firstName = parts[0];
            const lastName  = parts.slice(1).join(' ') || '';

            try {
                const result = await provisionLead.mutateAsync({
                    companyId:       user!.companyId,
                    firstName,
                    lastName,
                    email,
                    phone:           formData.phone.trim() || undefined,
                    source:          formData.source || undefined,
                    serviceInterest: formData.serviceInterest.trim() || undefined,
                });
                setSuccess(`Account created! Welcome email with login instructions sent to ${email}.`);
                onCreated?.(result);
                // Don't immediately close — show success banner for 1.5 s then close
                setTimeout(resetAndClose, 1800);
            } catch (err: any) {
                const msg = err?.response?.data?.message ?? 'Failed to create account. Please try again.';
                setError(msg);
            }

        } else {
            // Customer path — unchanged
            const parts     = formData.name.trim().split(/\s+/);
            const firstName = parts[0];
            const lastName  = parts.slice(1).join(' ') || '';

            createCustomer.mutate(
                {
                    firstName,
                    lastName,
                    email:    email || undefined,
                    phone:    formData.phone.trim() || undefined,
                    type:     formData.customerType as any,
                    isActive: true,
                    tags:     [],
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
        setSuccess('');
        onClose();
    };

    const isLead = type === 'lead';

    // Button label / state
    const submitLabel = () => {
        if (checkEmail.isPending) return 'Checking email…';
        if (provisionLead.isPending) return 'Creating account & sending email…';
        if (createCustomer.isPending) return 'Saving…';
        return isLead ? 'Create Lead & Send Welcome Email' : 'Create Customer';
    };

    return (
        <div
            className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all admin-modal-backdrop"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl admin-modal-box"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between shadow-lg">
                    <div className="text-white">
                        <h2 className="text-2xl font-bold">
                            Add New {isLead ? "Lead" : "Customer"}
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            {isLead
                                ? "Creates a lead and provisions a customer portal account"
                                : "Quickly add a new customer to your database"}
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

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="flex items-start gap-2.5 p-3.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-500" />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Info banner for leads */}
                        {isLead && !error && !success && (
                            <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                                <Mail size={16} className="mt-0.5 shrink-0 text-blue-500" />
                                <span>
                                    A customer portal account will be created automatically and a welcome email
                                    with a temporary password will be sent to the lead's email address.
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
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
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 disabled:bg-gray-50"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Email Address {isLead && <span className="text-red-500">*</span>}
                                    {!isLead && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    disabled={isLoading}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 disabled:bg-gray-50"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Phone <span className="text-gray-400 text-xs ml-1">(optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="(555) 000-0000"
                                    disabled={isLoading}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 disabled:bg-gray-50"
                                />
                            </div>

                            {/* Customer type — only for customers */}
                            {!isLead && (
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

                            {/* Lead-specific fields */}
                            {isLead && (
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

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={resetAndClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !!success}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer border-0"
                    >
                        {isLoading && <Loader2 size={14} className="animate-spin" />}
                        {submitLabel()}
                    </button>
                </div>
            </div>
        </div>
    );
}
