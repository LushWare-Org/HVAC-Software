import React, { useState, useEffect } from "react";
import {
  X,
  Edit2,
  Save,
  XCircle,
  Wrench,
  MapPin,
  User,
  Calendar,
  DollarSign,
  FileText,
  Clock,
} from "lucide-react";
import { TECHNICIANS } from "./technicians";

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any | null;
}

type TabType = "overview" | "details" | "notes";

const STATUS: Record<string, { label: string; css: string; color: string }> = {
  in_progress: { label: "In Progress", css: "badge-blue", color: "#3B82F6" },
  scheduled: { label: "Scheduled", css: "badge-violet", color: "#8B5CF6" },
  completed: { label: "Completed", css: "badge-green", color: "#10B981" },
  pending: { label: "Pending", css: "badge-amber", color: "#F59E0B" },
  invoiced: { label: "Invoiced", css: "badge-cyan", color: "#06B6D4" },
  cancelled: { label: "Cancelled", css: "badge-red", color: "#EF4444" },
};

const TYPE_COLOR: Record<string, string> = {
  Maintenance: "badge-blue",
  Installation: "badge-cyan",
  Repair: "badge-amber",
  Emergency: "badge-red",
};

const PRIORITY_CSS: Record<string, string> = {
  normal: "badge-neutral",
  high: "badge-amber",
  urgent: "badge-red",
};

const inputView =
  "w-full px-3 py-2.5 rounded-lg border bg-gray-100 border-transparent text-gray-600 text-sm font-medium";
const inputEdit =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

export default function JobDetailModal({
  isOpen,
  onClose,
  job,
}: JobDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [notes, setNotes] = useState(
    "No notes added yet. Click Edit to add notes for this job.",
  );

  useEffect(() => {
    if (job) {
      setFormData({ ...job });
      setIsEditMode(false);
      setActiveTab("overview");
    }
  }, [job]);

  if (!isOpen || !job) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditMode(false);
  };

  const status = STATUS[formData.status] ?? STATUS.pending;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Wrench size={14} /> },
    {
      id: "details",
      label: "Schedule & Billing",
      icon: <Calendar size={14} />,
    },
    { id: "notes", label: "Notes", icon: <FileText size={14} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full flex flex-col shadow-2xl"
        style={{ height: 680 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between shadow-lg">
          <div className="text-white flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-blue-200 text-sm font-semibold tracking-wider">
                {formData.id}
              </span>
              <span
                className={`badge ${status.css} text-xs`}
                style={{ fontSize: 11 }}
              >
                <span style={{ background: "currentColor" }} />
                {status.label}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight">
              {formData.service}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">{formData.customer}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-1.5 text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0"
              >
                <Edit2 size={13} /> Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0"
                >
                  <Save size={13} /> Save
                </button>
                <button
                  onClick={() => {
                    setFormData({ ...job });
                    setIsEditMode(false);
                  }}
                  className="flex items-center gap-1.5 text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0"
                >
                  <XCircle size={13} /> Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors p-1.5 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0 ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 cursor-pointer bg-transparent ${
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            {activeTab === "overview" && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`badge ${TYPE_COLOR[formData.type] ?? "badge-neutral"}`}
                  >
                    {formData.type}
                  </span>
                  <span
                    className={`badge ${PRIORITY_CSS[formData.priority] ?? "badge-neutral"}`}
                  >
                    {formData.priority} priority
                  </span>
                </div>

                {/* Customer & Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <User size={11} /> Customer
                    </label>
                    <input
                      name="customer"
                      value={formData.customer ?? ""}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={isEditMode ? inputEdit : inputView}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <User size={11} /> Technician
                    </label>
                    {isEditMode ? (
                      <select
                        name="tech"
                        value={formData.tech ?? ""}
                        onChange={handleChange}
                        className={inputEdit}
                      >
                        <option value="">Select Technician</option>
                        {TECHNICIANS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name="tech"
                        value={formData.tech ?? ""}
                        disabled
                        className={inputView}
                      />
                    )}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={11} /> Address
                    </label>
                    <input
                      name="address"
                      value={formData.address ?? ""}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={isEditMode ? inputEdit : inputView}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Wrench size={11} /> Service
                    </label>
                    <input
                      name="service"
                      value={formData.service ?? ""}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={isEditMode ? inputEdit : inputView}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description ?? ""}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      rows={3}
                      className={`${isEditMode ? inputEdit : inputView} resize-none`}
                    />
                  </div>
                </div>

                {isEditMode && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={inputEdit}
                      >
                        {Object.entries(STATUS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Job Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className={inputEdit}
                      >
                        {[
                          "Maintenance",
                          "Installation",
                          "Repair",
                          "Emergency",
                        ].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className={inputEdit}
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/*SCHEDULE & BILLING*/}
            {activeTab === "details" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={11} /> Scheduled Date
                    </label>
                    <input
                      name="date"
                      value={formData.date ?? ""}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={isEditMode ? inputEdit : inputView}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={11} /> Scheduled Time
                    </label>
                    <input
                      name="time"
                      value={formData.time ?? ""}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={isEditMode ? inputEdit : inputView}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign size={11} /> Job Amount ($)
                    </label>
                    <input
                      name="amount"
                      type={isEditMode ? "number" : "text"}
                      value={
                        isEditMode
                          ? formData.amount
                          : `$${Number(formData.amount ?? 0).toLocaleString()}`
                      }
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={isEditMode ? inputEdit : inputView}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mt-2">
                  <h4 className="text-sm font-semibold text-blue-700 mb-3">
                    Job Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Job ID", value: formData.id },
                      { label: "Customer", value: formData.customer },
                      { label: "Technician", value: formData.tech },
                      {
                        label: "Date",
                        value: `${formData.date} at ${formData.time}`,
                      },
                      {
                        label: "Amount",
                        value: `$${Number(formData.amount ?? 0).toLocaleString()}`,
                      },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-gray-500">{row.label}</span>
                        <span className="font-semibold text-gray-800">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Job Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!isEditMode}
                  rows={8}
                  placeholder="Add notes about this job…"
                  className={`${isEditMode ? inputEdit : inputView} resize-none`}
                />
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3">
          {isEditMode ? (
            <>
              <button
                onClick={() => {
                  setFormData({ ...job });
                  setIsEditMode(false);
                }}
                className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer border-0"
              >
                <Save size={14} /> Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
