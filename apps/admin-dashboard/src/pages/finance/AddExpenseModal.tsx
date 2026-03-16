import { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, Loader2, Search } from "lucide-react";
import { useCreateExpense } from "../../hooks/useFinance";
import { useJobs } from "../../hooks/useJobs";
import { useToast } from "../../contexts/ToastContext";
import type { Job } from "../../types/api";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Backend enum: PARTS | FUEL | TOOLS | SUBCONTRACTOR | OTHER
const CATEGORIES = [
  { value: "PARTS",         label: "Parts / Materials" },
  { value: "FUEL",          label: "Fuel" },
  { value: "TOOLS",         label: "Tools & Equipment" },
  { value: "SUBCONTRACTOR", label: "Subcontractor" },
  { value: "OTHER",         label: "Other" },
];

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none";

export default function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const { showError, showSuccess, showInfo } = useToast();
  const [error, setError] = useState("");
  const [category, setCategory] = useState("PARTS");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [showJobDropdown, setShowJobDropdown] = useState(false);

  const jobsQuery = useJobs({ limit: 100, search: jobSearch || undefined });
  const jobs: Job[] = jobsQuery.data?.data ?? [];
  const createExpense = useCreateExpense();

  const resetForm = () => {
    setError(""); setCategory("PARTS"); setVendor(""); setAmount("");
    setDate(new Date().toISOString().split("T")[0]); setDescription("");
    setJobId(""); setJobSearch("");
  };

  const handleClose = () => { resetForm(); onClose(); };

  const selectJob = (j: Job) => {
    setJobId(j.id);
    setJobSearch(j.title);
    setShowJobDropdown(false);
  };

  if (!isOpen) return null;

  const handleSubmit = () => {
    setError("");
    if (!category) { setError("Category is required."); showInfo("Select an expense category.", "Category Required"); return; }
    if (!amount || parseFloat(amount) <= 0) { setError("A valid amount is required."); showInfo("Enter a valid expense amount.", "Amount Required"); return; }
    if (!date) { setError("Date is required."); showInfo("Select an expense date.", "Date Required"); return; }

    createExpense.mutate(
      {
        category,
        vendor: vendor || undefined,
        amount: parseFloat(amount),
        expenseDate: date,
        description: description || "Expense",
        jobId: jobId || undefined,
      } as any,
      {
        onSuccess: () => {
          showSuccess("Expense logged successfully.", "Expense Saved");
          handleClose();
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message ?? "Failed to create expense.";
          setError(message);
          showError(message);
        },
      },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-8 py-5 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="text-white">
            <h2 className="text-xl font-bold">Log Expense</h2>
            <p className="text-amber-100 text-sm mt-0.5">Record a new business expense</p>
          </div>
          <button onClick={handleClose} className="text-amber-100 hover:text-white p-1 hover:bg-amber-500 rounded-lg cursor-pointer bg-transparent border-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Category <span className="text-red-500">*</span></label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Vendor</label>
              <input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Vendor name" className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Amount ($) <span className="text-red-500">*</span></label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" placeholder="0.00" className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Date <span className="text-red-500">*</span></label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
            </div>

            {/* Job (optional) */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Link to Job (optional)</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  value={jobId ? jobSearch : jobSearch}
                  onChange={e => { if (jobId) setJobId(""); setJobSearch(e.target.value); setShowJobDropdown(true); }}
                  onFocus={() => setShowJobDropdown(true)}
                  onBlur={() => setTimeout(() => setShowJobDropdown(false), 200)}
                  placeholder="Search jobs…"
                  className={`${inputClass} pl-8`}
                />
              </div>
              {showJobDropdown && !jobId && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {jobsQuery.isLoading && <div className="px-3 py-2 text-sm text-gray-400">Loading…</div>}
                  {!jobsQuery.isLoading && jobs.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No jobs found</div>}
                  {jobs.map(j => (
                    <button key={j.id} onClick={() => selectJob(j)} className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 cursor-pointer border-0 bg-transparent">
                      <div className="font-medium text-gray-900">{j.title}</div>
                      {j.customerName && <div className="text-xs text-gray-500">{j.customerName}</div>}
                    </button>
                  ))}
                </div>
              )}
              {jobId && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-amber-600 font-medium">Linked: {jobSearch}</span>
                  <button onClick={() => { setJobId(""); setJobSearch(""); }} className="text-xs text-red-500 bg-transparent border-0 cursor-pointer underline">Clear</button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Expense details…" className={`${inputClass} resize-none`} />
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3 shrink-0">
          <button onClick={handleClose} disabled={createExpense.isPending} className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={createExpense.isPending} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer border-0 disabled:opacity-60">
            {createExpense.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {createExpense.isPending ? "Saving…" : "Log Expense"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
