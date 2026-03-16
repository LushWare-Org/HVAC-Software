import React, { useState, useEffect } from "react";
import {
  X, Edit2, Save, XCircle, Wrench, MapPin, User, Calendar,
  DollarSign, FileText, Clock, AlertCircle, Loader2, ArrowRight,
  Send, Receipt, Truck,
} from "lucide-react";
import { useUpdateJobStatus, useJob } from "../../hooks/useJobs";
import { useInvoices, useQuotes, useSendInvoice, useSendQuote, decimalToNumber } from "../../hooks/useFinance";
import type { Job } from "../../types/api";

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onCreateQuote?: (job: Job) => void;
  onCreateInvoice?: (job: Job) => void;
}

type TabType = "overview" | "details" | "notes" | "finance" | "activity";

const STATUS_MAP: Record<string, { label: string; css: string }> = {
  PENDING:     { label: "Pending",     css: "badge-amber" },
  SCHEDULED:   { label: "Scheduled",   css: "badge-violet" },
  EN_ROUTE:    { label: "En Route",    css: "badge-blue" },
  ON_SITE:     { label: "In Progress", css: "badge-blue" },
  IN_PROGRESS: { label: "In Progress", css: "badge-blue" },
  COMPLETED:   { label: "Completed",   css: "badge-green" },
  INVOICED:    { label: "Invoiced",    css: "badge-cyan" },
  PAID:        { label: "Paid",        css: "badge-green" },
  CANCELLED:   { label: "Cancelled",   css: "badge-red" },
  ON_HOLD:     { label: "On Hold",     css: "badge-neutral" },
};

const PRIORITY_CSS: Record<string, string> = {
  LOW:    "badge-neutral",
  NORMAL: "badge-neutral",
  HIGH:   "badge-amber",
  URGENT: "badge-red",
};

const inputView =
  "w-full px-3 py-2.5 rounded-lg border bg-gray-100 border-transparent text-gray-600 text-sm font-medium";
const inputEdit =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

// Must mirror the backend STATUS_TRANSITIONS exactly
const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ["SCHEDULED", "ON_HOLD", "CANCELLED"],
  SCHEDULED: ["EN_ROUTE", "ON_SITE", "ON_HOLD", "CANCELLED"],
  EN_ROUTE:  ["ON_SITE", "SCHEDULED", "ON_HOLD", "CANCELLED"],
  ON_SITE:   ["COMPLETED", "ON_HOLD", "CANCELLED"],
  COMPLETED: ["INVOICED", "CANCELLED"],
  INVOICED:  ["PAID", "CANCELLED"],
  PAID:      [],
  CANCELLED: ["PENDING"],
  ON_HOLD:   ["SCHEDULED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "ON_HOLD", "CANCELLED"], // frontend alias for ON_SITE
};


export default function JobDetailModal({ isOpen, onClose, job, onCreateQuote, onCreateInvoice }: JobDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [notes, setNotes] = useState("");

  const updateStatus = useUpdateJobStatus();
  const isBusy = updateStatus.isPending;

  // Fetch full job detail (includes statusHistory)
  const jobDetailQuery = useJob(job?.id ?? '');
  const jobDetail = jobDetailQuery.data;
  const statusHistory = jobDetail?.statusHistory ?? [];

  // Finance data for this job
  const invoicesQuery = useInvoices({ limit: 50 });
  const quotesQuery = useQuotes({ limit: 50 });
  const sendInvoice = useSendInvoice();
  const sendQuote = useSendQuote();
  const jobInvoices = (invoicesQuery.data?.data ?? []).filter(inv => inv.jobId === job?.id);
  const jobQuotes = (quotesQuery.data?.data ?? []).filter(q => q.jobId === job?.id);

  useEffect(() => {
    if (job) {
      setEditStatus(job.status);
      setNotes(job.description ?? "");
      setIsEditMode(false);
      setActiveTab("overview");
      setError("");
    }
  }, [job]);

  if (!isOpen || !job) return null;

  const handleSave = () => {
    setError("");
    if (editStatus !== job.status) {
      updateStatus.mutate(
        { id: job.id, status: editStatus },
        {
          onSuccess: () => setIsEditMode(false),
          onError: (err: any) => setError(err?.response?.data?.message ?? "Failed to update job."),
        },
      );
    } else {
      setIsEditMode(false);
    }
  };

  const quickTransition = (newStatus: string) => {
    setError("");
    updateStatus.mutate(
      { id: job.id, status: newStatus },
      { onError: (err: any) => setError(err?.response?.data?.message ?? "Status change failed.") },
    );
  };

  const status = STATUS_MAP[job.status] ?? STATUS_MAP.PENDING;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview",          icon: <Wrench size={14} /> },
    { id: "details",  label: "Schedule & Billing", icon: <Calendar size={14} /> },
    { id: "finance",  label: "Quotes & Invoices",  icon: <DollarSign size={14} /> },
    { id: "activity", label: "Activity",           icon: <Clock size={14} /> },
    { id: "notes",    label: "Notes",              icon: <FileText size={14} /> },
  ];

  // Quick action buttons based on current status
  const getQuickActions = () => {
    const actions: { label: string; status: string; css: string; icon: React.ReactNode }[] = [];
    const s = job.status;
    if (s === "PENDING") {
      actions.push({ label: "Schedule", status: "SCHEDULED", css: "bg-violet-600 hover:bg-violet-700", icon: <Calendar size={14} /> });
      actions.push({ label: "Hold", status: "ON_HOLD", css: "bg-gray-500 hover:bg-gray-600", icon: <ArrowRight size={14} /> });
    } else if (s === "SCHEDULED") {
      actions.push({ label: "En Route", status: "EN_ROUTE", css: "bg-blue-600 hover:bg-blue-700", icon: <Truck size={14} /> });
      actions.push({ label: "Arrived", status: "ON_SITE", css: "bg-purple-600 hover:bg-purple-700", icon: <MapPin size={14} /> });
      actions.push({ label: "Hold", status: "ON_HOLD", css: "bg-gray-500 hover:bg-gray-600", icon: <ArrowRight size={14} /> });
    } else if (s === "EN_ROUTE") {
      actions.push({ label: "Arrive On Site", status: "ON_SITE", css: "bg-purple-600 hover:bg-purple-700", icon: <MapPin size={14} /> });
      actions.push({ label: "Hold", status: "ON_HOLD", css: "bg-gray-500 hover:bg-gray-600", icon: <ArrowRight size={14} /> });
    } else if (s === "ON_SITE" || s === "IN_PROGRESS") {
      actions.push({ label: "Complete", status: "COMPLETED", css: "bg-green-600 hover:bg-green-700", icon: <Wrench size={14} /> });
      actions.push({ label: "Hold", status: "ON_HOLD", css: "bg-gray-500 hover:bg-gray-600", icon: <ArrowRight size={14} /> });
    } else if (s === "COMPLETED") {
      actions.push({ label: "Mark Invoiced", status: "INVOICED", css: "bg-cyan-600 hover:bg-cyan-700", icon: <DollarSign size={14} /> });
    } else if (s === "ON_HOLD") {
      actions.push({ label: "Resume", status: "SCHEDULED", css: "bg-violet-600 hover:bg-violet-700", icon: <Calendar size={14} /> });
    } else if (s === "CANCELLED") {
      actions.push({ label: "Reopen", status: "PENDING", css: "bg-amber-600 hover:bg-amber-700", icon: <ArrowRight size={14} /> });
    }
    return actions;
  };

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full flex flex-col shadow-2xl"
        style={{ height: 700 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between shadow-lg rounded-t-xl shrink-0">
          <div className="text-white flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-blue-200 text-sm font-semibold tracking-wider">
                {job.id.slice(0, 8)}...
              </span>
              <span className={`badge ${status.css} text-xs`} style={{ fontSize: 11 }}>
                {status.label}
              </span>
              {job.priority && (
                <span className={`badge ${PRIORITY_CSS[job.priority] ?? "badge-neutral"} text-xs`} style={{ fontSize: 11 }}>
                  {job.priority}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold leading-tight">{job.title}</h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {job.customerName ?? "No customer"}
              {job.assignedToName && ` · Tech: ${job.assignedToName}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                disabled={isBusy}
                className="flex items-center gap-1.5 text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 disabled:opacity-50"
              >
                <Edit2 size={13} /> Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 disabled:opacity-60"
                >
                  {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save
                </button>
                <button
                  onClick={() => { setEditStatus(job.status); setIsEditMode(false); setError(""); }}
                  disabled={isBusy}
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
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
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

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {activeTab === "overview" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <User size={11} /> Customer
                    </label>
                    <input value={job.customerName ?? "—"} disabled className={inputView} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <User size={11} /> Technician
                    </label>
                    <input value={job.assignedToName ?? "Unassigned"} disabled className={inputView} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={11} /> Address
                    </label>
                    <input value={job.serviceAddress ?? job.customerAddress ?? "—"} disabled className={inputView} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</label>
                    <input value={job.title} disabled className={inputView} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
                    <textarea value={job.description ?? ""} disabled rows={3} className={`${inputView} resize-none`} />
                  </div>
                </div>

                {isEditMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        disabled={isBusy}
                        className={inputEdit}
                      >
                        {/* Always show current status first, then only valid transitions */}
                        <option value={job.status}>{STATUS_MAP[job.status]?.label ?? job.status} (current)</option>
                        {(STATUS_TRANSITIONS[job.status] ?? []).map((s) => (
                          <option key={s} value={s}>{STATUS_MAP[s]?.label ?? s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</label>
                      <input value={job.priority} disabled className={inputView} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={11} /> Scheduled Start
                    </label>
                    <input value={job.scheduledStart ? new Date(job.scheduledStart).toLocaleString() : "—"} disabled className={inputView} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={11} /> Scheduled End
                    </label>
                    <input value={job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleString() : "—"} disabled className={inputView} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign size={11} /> Estimated Amount
                    </label>
                    <input value={job.estimatedAmount != null ? `$${Number(job.estimatedAmount).toLocaleString()}` : "—"} disabled className={inputView} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign size={11} /> Final Amount
                    </label>
                    <input value={job.finalAmount != null ? `$${Number(job.finalAmount).toLocaleString()}` : "—"} disabled className={inputView} />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mt-2">
                  <h4 className="text-sm font-semibold text-blue-700 mb-3">Job Summary</h4>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Job ID", value: job.id.slice(0, 12) + "..." },
                      { label: "Customer", value: job.customerName ?? "—" },
                      { label: "Technician", value: job.assignedToName ?? "Unassigned" },
                      { label: "Status", value: STATUS_MAP[job.status]?.label ?? job.status },
                      { label: "Created", value: new Date(job.createdAt).toLocaleString() },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-gray-500">{row.label}</span>
                        <span className="font-semibold text-gray-800">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Job Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled
                  rows={8}
                  placeholder="Job description and notes…"
                  className={`${inputView} resize-none`}
                />
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} /> Status History
                </h4>
                {jobDetailQuery.isLoading && (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 size={18} className="animate-spin mr-2" /> Loading activity…
                  </div>
                )}
                {!jobDetailQuery.isLoading && statusHistory.length === 0 && (
                  <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">No activity recorded yet</p>
                )}
                {statusHistory.length > 0 && (
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200" />
                    {statusHistory.map((h, i) => {
                      const s = STATUS_MAP[h.toStatus] ?? { label: h.toStatus, css: "badge-neutral" };
                      return (
                        <div key={h.id || i} className="relative">
                          <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-white bg-blue-500 shadow" />
                          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`badge ${s.css}`}>{s.label}</span>
                              {h.fromStatus && (
                                <span className="text-xs text-gray-400">
                                  from {(STATUS_MAP[h.fromStatus] ?? { label: h.fromStatus }).label}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(h.createdAt).toLocaleString()}
                              {h.notes && <span className="ml-2 text-gray-600">— {h.notes}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "finance" && (
              <div className="space-y-6">
                {/* Create actions */}
                <div className="flex items-center gap-3">
                  {onCreateQuote && (
                    <button
                      onClick={() => onCreateQuote(job)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                    >
                      <Send size={14} /> Create Quote
                    </button>
                  )}
                  {onCreateInvoice && (
                    <button
                      onClick={() => onCreateInvoice(job)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Receipt size={14} /> Create Invoice
                    </button>
                  )}
                </div>

                {/* Quotes section */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Send size={12} /> Quotes ({jobQuotes.length})
                  </h4>
                  {jobQuotes.length === 0 ? (
                    <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">No quotes linked to this job</p>
                  ) : (
                    <div className="space-y-2">
                      {jobQuotes.map(q => (
                        <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{q.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{q.quoteNumber} · {new Date(q.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className="text-sm font-bold text-gray-900">${decimalToNumber(q.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.status === "DRAFT" ? "bg-gray-100 text-gray-600"
                              : q.status === "SENT" ? "bg-blue-100 text-blue-700"
                              : q.status === "ACCEPTED" ? "bg-green-100 text-green-700"
                              : q.status === "CONVERTED" ? "bg-cyan-100 text-cyan-700"
                              : "bg-red-100 text-red-700"
                            }`}>
                              {q.status}
                            </span>
                            {q.status === "DRAFT" && (
                              <button
                                onClick={() => sendQuote.mutate(q.id)}
                                disabled={sendQuote.isPending}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {sendQuote.isPending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} Send
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoices section */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Receipt size={12} /> Invoices ({jobInvoices.length})
                  </h4>
                  {jobInvoices.length === 0 ? (
                    <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">No invoices linked to this job</p>
                  ) : (
                    <div className="space-y-2">
                      {jobInvoices.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{inv.customerName} · {new Date(inv.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className="text-sm font-bold text-gray-900">${decimalToNumber(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === "DRAFT" ? "bg-gray-100 text-gray-600"
                              : inv.status === "SENT" ? "bg-blue-100 text-blue-700"
                              : inv.status === "PAID" ? "bg-green-100 text-green-700"
                              : inv.status === "PARTIALLY_PAID" ? "bg-amber-100 text-amber-700"
                              : inv.status === "OVERDUE" ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                            }`}>
                              {inv.status}
                            </span>
                            {inv.status === "DRAFT" && (
                              <button
                                onClick={() => sendInvoice.mutate(inv.id)}
                                disabled={sendInvoice.isPending}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {sendInvoice.isPending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} Send
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with quick actions */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 rounded-b-xl shrink-0 flex items-center justify-between gap-2">
          <div className="flex gap-2 flex-wrap">
            {getQuickActions().map((action) => (
              <button
                key={action.status}
                onClick={() => quickTransition(action.status)}
                disabled={isBusy}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 border-0 ${action.css}`}
              >
                {isBusy ? <Loader2 size={14} className="animate-spin" /> : action.icon}
                {action.label}
              </button>
            ))}
            {/* Create Quote from job */}
            {onCreateQuote && ["PENDING", "SCHEDULED", "EN_ROUTE", "ON_SITE", "COMPLETED"].includes(job.status) && (
              <button
                onClick={() => onCreateQuote(job)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
              >
                <Send size={14} /> Quote
              </button>
            )}
            {/* Create Invoice from job */}
            {onCreateInvoice && ["COMPLETED", "ON_SITE", "INVOICED"].includes(job.status) && (
              <button
                onClick={() => onCreateInvoice(job)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Receipt size={14} /> Invoice
              </button>
            )}
            {/* Show Cancel for any status still in the allowed transitions (all except PAID and already CANCELLED) */}
            {job.status !== "CANCELLED" && job.status !== "PAID" && (STATUS_TRANSITIONS[job.status] ?? []).includes("CANCELLED") && (
              <button
                onClick={() => quickTransition("CANCELLED")}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-60"
              >
                <XCircle size={14} /> Cancel Job
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
