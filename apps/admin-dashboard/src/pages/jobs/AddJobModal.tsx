import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Wrench, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useCreateJob, useJobTypes } from "../../hooks/useJobs";
import { useCustomers } from "../../hooks/useCustomers";
import MapPicker from "../../components/MapPickerLazy";

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (job: any) => void;
  preselectedCustomer?: { id: string; name: string; address?: string };
}

type TabType = "basic" | "scheduling";

export default function AddJobModal({
  isOpen,
  onClose,
  onCreated,
  preselectedCustomer,
}: AddJobModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [error, setError]         = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [formData, setFormData]   = useState({
    title: "",
    description: "",
    priority: "NORMAL",
    jobTypeId: "",
    customerId: "",
    customerName: "",
    serviceAddress: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    lat: 6.9271,
    lng: 79.8612,
  });

  const createJob = useCreateJob();
  const jobTypesQuery = useJobTypes();
  const jobTypes = jobTypesQuery.data ?? [];
  const customersQuery = useCustomers({ page: 1, limit: 50, search: customerSearch || undefined });
  const customers = customersQuery.data?.data ?? [];

  // Pre-fill customer when opened from customer detail
  useEffect(() => {
    if (isOpen && preselectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerId: preselectedCustomer.id,
        customerName: preselectedCustomer.name,
        serviceAddress: preselectedCustomer.address || prev.serviceAddress,
      }));
    }
  }, [isOpen, preselectedCustomer]);

  // Lock the dashboard behind the modal — without this, wheel/trackpad input
  // over the backdrop scrolls the page underneath instead of staying put.
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isOpen]);

  // Escape closes — standard modal affordance
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setFormData(prev => ({ ...prev, customerId: '', customerName: '', serviceAddress: '' }));
      return;
    }
    const c = customers.find((c: any) => c.id === id);
    if (c) {
      const name = `${c.firstName} ${c.lastName}`.trim();
      const addr = [c.address, c.city, c.state, c.zipCode].filter(Boolean).join(', ');
      setFormData(prev => ({ ...prev, customerId: c.id, customerName: name, serviceAddress: addr || 'N/A' }));
    }
  };

  const handleSubmit = () => {
    setError('');

    if (!formData.title.trim()) {
      setError('Job title is required.');
      return;
    }
    if (!formData.customerId) {
      setError('Please select a customer.');
      return;
    }
    if (!formData.serviceAddress.trim()) {
      setError('Service address is required.');
      return;
    }

    // Build scheduledStart ISO string
    let scheduledStart: string | undefined;
    if (formData.date) {
      const dt = new Date(`${formData.date}T${formData.time || '09:00'}:00`);
      if (!isNaN(dt.getTime())) scheduledStart = dt.toISOString();
    }

    createJob.mutate(
      {
        title:              formData.title.trim(),
        description:        formData.description.trim() || undefined,
        priority:           formData.priority.toUpperCase() as any,
        jobTypeId:          formData.jobTypeId || undefined,
        customerId:         formData.customerId,
        customerName:       formData.customerName,
        serviceAddress:     formData.serviceAddress,
        scheduledStart,
        serviceLatitude:    formData.lat,
        serviceLongitude:   formData.lng,
      } as any,
      {
        onSuccess: (newJob) => {
          onCreated?.(newJob);
          onClose();
          setFormData({
            title: "",
            description: "",
            priority: "NORMAL",
            jobTypeId: "",
            customerId: "",
            customerName: "",
            serviceAddress: "",
            date: new Date().toISOString().split("T")[0],
            time: "09:00",
            lat: 6.9271,
            lng: 79.8612,
          });
          setActiveTab("basic");
          setError('');
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message;
          setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to create job. Please try again.'));
        },
      }
    );
  };

  const inputCls =
    "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm";

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "basic", label: "Job Details", icon: <Wrench size={14} /> },
    { id: "scheduling", label: "Schedule & Cost", icon: <Calendar size={14} /> },
  ];

  const isLoading = createJob.isPending;

  /** Step 1 validation before advancing to scheduling tab */
  const handleNextStep = () => {
    setError('');
    if (!formData.title.trim()) { setError('Job title is required.'); return; }
    if (!formData.customerId) { setError('Please select a customer.'); return; }
    if (!formData.serviceAddress.trim()) { setError('Service address is required.'); return; }
    setActiveTab('scheduling');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6 admin-modal-backdrop"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create New Job"
        className="bg-white rounded-xl max-w-2xl w-full flex flex-col shadow-2xl admin-modal-box overflow-hidden"
        style={{ height: "min(660px, calc(100vh - 48px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Create New Job</h2>
            <p className="text-blue-100 text-sm mt-0.5">
              Step {activeTab === "basic" ? "1" : "2"} of 2 — {activeTab === "basic" ? "Job Details" : "Schedule & Cost"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicators — visual only, not clickable */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          {tabs.map((t, idx) => {
            const isActive = activeTab === t.id;
            const isDone = t.id === "basic" && activeTab === "scheduling";
            return (
              <div
                key={t.id}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 select-none ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : isDone
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-400"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isActive ? "bg-blue-600 text-white" : isDone ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {isDone ? "✓" : idx + 1}
                </span>
                {t.icon}
                {t.label}
              </div>
            );
          })}
        </div>

        {/* min-h-0 is required so this flex child actually shrinks and
            scrolls instead of growing past the dialog's fixed height */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-8 space-y-5">

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {activeTab === "basic" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Customer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Search customers…"
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      disabled={isLoading}
                      className={`${inputCls} mb-1.5`}
                      style={{ marginBottom: 6 }}
                    />
                    <select
                      value={formData.customerId}
                      onChange={handleCustomerSelect}
                      disabled={isLoading}
                      className={inputCls}
                    >
                      <option value="">— Select Customer —</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}{c.email ? ` (${c.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Service Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="serviceAddress"
                      value={formData.serviceAddress}
                      onChange={handleChange}
                      placeholder="123 Main St, City, State"
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. HVAC Maintenance — John Doe"
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the job…"
                      disabled={isLoading}
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={inputCls}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Job Type
                    </label>
                    <select
                      name="jobTypeId"
                      value={formData.jobTypeId}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={inputCls}
                    >
                      <option value="">— Select Type —</option>
                      {jobTypes.map((jt: any) => (
                        <option key={jt.id} value={jt.id}>
                          {jt.name} ({jt.trade})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === "scheduling" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Scheduled Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                </div>
                <MapPicker
                  label="Service Location (GPS for Dispatch)"
                  lat={formData.lat}
                  lng={formData.lng}
                  onChange={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))}
                  height="240px"
                />
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-between gap-3 rounded-b-xl shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {activeTab === "scheduling" && (
              <button
                onClick={() => { setActiveTab("basic"); setError(""); }}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                ← Back
              </button>
            )}
            {activeTab === "basic" ? (
              <button
                onClick={handleNextStep}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer border-0"
              >
                Next: Schedule & Cost →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer border-0"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? "Creating..." : "Create Job"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
