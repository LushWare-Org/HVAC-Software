import React, { useState } from "react";
import { X, Wrench, Calendar } from "lucide-react";
import { TECHNICIANS } from "./technicians";

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (job: any) => void;
}

type TabType = "basic" | "scheduling";

export default function AddJobModal({
  isOpen,
  onClose,
  onCreated,
}: AddJobModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [formData, setFormData] = useState({
    customer: "",
    address: "",
    service: "",
    description: "",
    type: "Maintenance",
    tech: "",
    priority: "normal",
    status: "scheduled",
    date: new Date().toISOString().split("T")[0],
    time: "09:00 AM",
    amount: "",
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setTimeout(() => {
      const newJob = {
        id: `JOB-${String(Date.now()).slice(-4)}`,
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        color: "#3B82F6",
      };
      onCreated?.(newJob);
      setIsLoading(false);
      onClose();
      setFormData({
        customer: "",
        address: "",
        service: "",
        description: "",
        type: "Maintenance",
        tech: "",
        priority: "normal",
        status: "scheduled",
        date: new Date().toISOString().split("T")[0],
        time: "09:00 AM",
        amount: "",
      });
      setActiveTab("basic");
    }, 500);
  };

  const inputCls =
    "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm";

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "basic", label: "Job Details", icon: <Wrench size={14} /> },
    {
      id: "scheduling",
      label: "Schedule & Cost",
      icon: <Calendar size={14} />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full flex flex-col shadow-2xl"
        style={{ height: 620 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Create New Job</h2>
            <p className="text-blue-100 text-sm mt-0.5">
              Schedule a new service job
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-6 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer bg-transparent ${
                activeTab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-5">
            {activeTab === "basic" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      name="customer"
                      value={formData.customer}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Service
                    </label>
                    <input
                      type="text"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      placeholder="e.g. HVAC Maintenance"
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. 1234 Oak Lane, Dallas TX"
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
                      Job Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={inputCls}
                    >
                      <option value="Maintenance">Maintenance</option>
                      <option value="Installation">Installation</option>
                      <option value="Repair">Repair</option>
                      <option value="Emergency">Emergency</option>
                    </select>
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
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
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
                      Technician
                    </label>
                    <select
                      name="tech"
                      value={formData.tech}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={inputCls}
                    >
                      <option value="">Select Technician</option>
                      {TECHNICIANS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
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
                      type="text"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      placeholder="e.g. 10:00 AM"
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={inputCls}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3 rounded-b-xl shrink-0">
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : null}
            {isLoading ? "Creating..." : "Create Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
