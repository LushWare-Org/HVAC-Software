import React, { useState, useEffect } from "react";
import {
  X,
  Edit2,
  Save,
  FileText,
  Calendar,
  Mail,
} from "lucide-react";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any | null;
}

type TabType = "details" | "activity";

const INV_CSS: Record<string, string> = {
  sent: "badge-blue",
  paid: "badge-green",
  overdue: "badge-red",
  draft: "badge-neutral",
  partial: "badge-amber",
};

const inputView =
  "w-full px-3 py-2.5 rounded-lg border bg-gray-100 border-transparent text-gray-600 text-sm font-medium";
const inputEdit =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

export default function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
}: InvoiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (invoice) {
      setFormData({ ...invoice });
      setIsEditMode(false);
      setActiveTab("details");
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

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

  const statusCSS = INV_CSS[invoice.status] || "badge-neutral";

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "details", label: "Invoice Details", icon: <FileText size={14} /> },
    { id: "activity", label: "Activity", icon: <Calendar size={14} /> },
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
                {invoice.id}
              </span>
              <span
                className={`badge ${statusCSS} text-xs`}
                style={{ fontSize: 11 }}
              >
                <span style={{ background: "currentColor" }} />
                {invoice.status}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight">
              {invoice.customer}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              Job Reference: {invoice.jobRef}
            </p>
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
                    setFormData({ ...invoice });
                    setIsEditMode(false);
                  }}
                  className="flex items-center gap-1.5 text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            {activeTab === "details" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Customer
                    </label>
                    <input
                      type="text"
                      name="customer"
                      value={formData.customer}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Amount
                    </label>
                    <input
                      type="text"
                      name="amount"
                      value={`$${formData.amount?.toLocaleString()}`}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
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
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Issued Date
                    </label>
                    <input
                      type="date"
                      name="issued"
                      value={formData.issued}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="due"
                      value={formData.due}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Job Reference
                    </label>
                    <input
                      type="text"
                      name="jobRef"
                      value={formData.jobRef}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar size={14} />
                    No activity yet. This invoice was just created.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 rounded-b-xl shrink-0 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Mail size={14} className="inline mr-1" /> Send Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
