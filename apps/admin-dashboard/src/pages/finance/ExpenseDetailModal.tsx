import React, { useState, useEffect } from "react";
import {
  X,
  Edit2,
  Save,
  DollarSign,
  Calendar,
  Briefcase,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useUpdateExpense, decimalToNumber } from "../../hooks/useFinance";
import { useToast } from "../../contexts/ToastContext";

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any | null;
}

type TabType = "details" | "activity";

const EXP_CSS: Record<string, string> = {
  PAID: "badge-green",
  PENDING: "badge-amber",
  APPROVED: "badge-blue",
  REJECTED: "badge-red",
  paid: "badge-green",
  pending: "badge-amber",
  approved: "badge-blue",
  rejected: "badge-red",
};

const inputView =
  "w-full px-3 py-2.5 rounded-lg border bg-gray-100 border-transparent text-gray-600 text-sm font-medium";
const inputEdit =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

export default function ExpenseDetailModal({
  isOpen,
  onClose,
  expense,
}: ExpenseDetailModalProps) {
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateExpense = useUpdateExpense();

  useEffect(() => {
    if (expense) {
      setFormData({
        ...expense,
        amount: decimalToNumber(expense.amount),
        date: expense.date ? expense.date.split("T")[0] : "",
      });
      setIsEditMode(false);
      setActiveTab("details");
      setSaveSuccess(false);
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateExpense.mutate(
      {
        id: expense.id,
        data: {
          category: formData.category,
          vendor: formData.vendor || undefined,
          amount: String(formData.amount),
          date: formData.date,
          description: formData.description || undefined,
          status: formData.status,
        },
      },
      {
        onSuccess: () => {
          setIsEditMode(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
          showSuccess("Expense updated successfully.", "Expense Saved");
        },
        onError: (err: any) => {
          showError(err?.response?.data?.message ?? "Failed to update expense.");
        },
      },
    );
  };

  const statusCSS = EXP_CSS[expense.status] || "badge-neutral";

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "details", label: "Expense Details", icon: <DollarSign size={14} /> },
    { id: "activity", label: "Activity", icon: <Calendar size={14} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 admin-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full flex flex-col shadow-2xl admin-modal-box"
        style={{ height: 680 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-700 px-8 py-5 flex items-center justify-between shadow-lg">
          <div className="text-white flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-amber-200 text-sm font-semibold tracking-wider">
                {expense.id}
              </span>
              <span
                className={`badge ${statusCSS} text-xs`}
                style={{ fontSize: 11 }}
              >
                <span style={{ background: "currentColor" }} />
                {expense.status}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight">
              {expense.category}
            </h2>
            <p className="text-amber-100 text-sm mt-0.5">{expense.vendor}</p>
          </div>
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-green-200 text-sm font-medium">
                <CheckCircle size={14} /> Saved
              </span>
            )}
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-1.5 text-amber-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0"
              >
                <Edit2 size={13} /> Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={updateExpense.isPending}
                  className="flex items-center gap-1.5 text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 disabled:opacity-60"
                >
                  {updateExpense.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                </button>
                <button
                  onClick={() => {
                    setFormData({ ...expense, amount: decimalToNumber(expense.amount), date: expense.date?.split("T")[0] || "" });
                    setIsEditMode(false);
                  }}
                  className="flex items-center gap-1.5 text-amber-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-amber-100 hover:text-white transition-colors p-1 hover:bg-amber-500 rounded-lg cursor-pointer bg-transparent border-0"
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
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            {activeTab === "details" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                    >
                      <option value="Materials">Materials</option>
                      <option value="Labour">Labour</option>
                      <option value="Fuel">Fuel</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Vendor
                    </label>
                    <input
                      type="text"
                      name="vendor"
                      value={formData.vendor}
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
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      min="0"
                      step="0.01"
                      className={!isEditMode ? inputView : inputEdit}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
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
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PAID">Paid</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      rows={3}
                      className={`${!isEditMode ? inputView : inputEdit} resize-none`}
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
                    No activity yet. This expense was just created.
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
          {expense.status === "PENDING" && (
            <button
              onClick={() => {
                updateExpense.mutate(
                  { id: expense.id, data: { status: "APPROVED" } as any },
                  {
                    onSuccess: () => {
                      setSaveSuccess(true);
                      showSuccess("Expense approved successfully.", "Expense Approved");
                      setTimeout(() => { setSaveSuccess(false); onClose(); }, 1000);
                    },
                    onError: (err: any) => {
                      showError(err?.response?.data?.message ?? "Failed to approve expense.");
                    },
                  },
                );
              }}
              disabled={updateExpense.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors cursor-pointer border-0 flex items-center gap-1.5 disabled:opacity-60"
            >
              {updateExpense.isPending ? <Loader2 size={14} className="animate-spin" /> : <Briefcase size={14} />}
              Approve Expense
            </button>
          )}
          {saveSuccess && <span className="flex items-center gap-1 text-green-600 text-sm font-medium self-center"><CheckCircle size={14} /> Done</span>}
        </div>
      </div>
    </div>
  );
}
