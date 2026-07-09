import React, { useState, useEffect } from "react";
import {
  X, Edit2, Save, FileText, Calendar, Mail, CheckCircle,
  RefreshCw, AlertCircle, Loader2, Download, Briefcase, ExternalLink,
} from "lucide-react";
import {
  useUpdateQuote, useSendQuote, useApproveQuote, useConvertQuote, useQuote, decimalToNumber,
} from "../../hooks/useFinance";
import { useToast } from "../../contexts/ToastContext";
import api from "../../lib/api";
import type { Quote } from "../../types/api";
import { formatMoney } from '../../lib/format'

interface QuoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
}

type TabType = "details" | "activity";

const QUO_CSS: Record<string, string> = {
  DRAFT: "badge-neutral", SENT: "badge-blue", ACCEPTED: "badge-green",
  REJECTED: "badge-red", DECLINED: "badge-red", EXPIRED: "badge-amber", CONVERTED: "badge-cyan",
};

const inputView =
  "w-full px-3 py-2.5 rounded-lg border bg-gray-100 border-transparent text-gray-600 text-sm font-medium";
const inputEdit =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none";

export default function QuoteDetailModal({
  isOpen,
  onClose,
  quote,
}: QuoteDetailModalProps) {
  const { showError, showSuccess, showInfo } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [formData, setFormData] = useState({ notes: "", validUntil: "" });

  const updateQuote  = useUpdateQuote();
  const sendQuote    = useSendQuote();
  const approveQuote = useApproveQuote();
  const convertQuote = useConvertQuote();

  // Fetch live data so the modal auto-updates after status mutations
  const { data: liveQuote } = useQuote(quote?.id ?? undefined)
  const q = liveQuote ?? quote

  const isBusy =
    updateQuote.isPending || sendQuote.isPending ||
    approveQuote.isPending || convertQuote.isPending;

  useEffect(() => {
    if (quote) {
      setFormData({
        notes:     quote.notes ?? "",
        validUntil: quote.validUntil ? quote.validUntil.split("T")[0] : "",
      });
      setIsEditMode(false);
      setActiveTab("details");
      setError("");
    }
  }, [quote]);

  if (!isOpen || !quote) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setError("");
    updateQuote.mutate(
      {
        id: q!.id,
        data: {
          notes:     formData.notes || undefined,
          validUntil: formData.validUntil || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditMode(false);
          showSuccess("Quote details saved successfully.", "Quote Updated");
        },
        onError:   (err: any) => {
          const message = err?.response?.data?.message ?? "Failed to save quote.";
          setError(message);
          showError(message);
        },
      },
    );
  };

  const handleSend = () => {
    setError("");
    if (!q?.customerEmail?.trim()) {
      const message = "Customer email is required before sending this quote.";
      setError(message);
      showInfo(message, "Missing Customer Email");
      return;
    }
    sendQuote.mutate(q!.id, {
      onSuccess: () => showSuccess("Quote email sent with PDF attachment.", "Quote Sent"),
      onError: (err: any) => {
        const message = err?.response?.data?.message ?? "Failed to send quote.";
        setError(message);
        showError(message);
      },
    });
  };

  const handleApprove = () => {
    setError("");
    approveQuote.mutate({ id: q!.id, approvedByName: 'Admin', approvedByEmail: 'admin@company.com' }, {
      onSuccess: () => showSuccess("Quote approved successfully.", "Quote Approved"),
      onError: (err: any) => {
        const message = err?.response?.data?.message ?? "Failed to approve quote.";
        setError(message);
        showError(message);
      },
    });
  };

  const handleConvert = () => {
    setError("");
    convertQuote.mutate(q!.id, {
      onSuccess: () => {
        showSuccess("Quote converted to invoice.", "Conversion Complete");
        onClose();
      },
      onError:   (err: any) => {
        const message = err?.response?.data?.message ?? "Failed to convert quote.";
        setError(message);
        showError(message);
      },
    });
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/finance/quotes/${q!.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${q!.quoteNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      const message = 'Failed to download PDF.';
      setError(message);
      showError(message);
    } finally {
      setDownloading(false);
    }
  };

  const handleViewPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/finance/quotes/${q!.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch {
      const message = 'Failed to load PDF.';
      setError(message);
      showError(message);
    } finally {
      setDownloading(false);
    }
  };

  const statusCSS = QUO_CSS[q!.status] ?? "badge-neutral";
  const canSendQuote = ["DRAFT", "SENT", "VIEWED", "ACCEPTED"].includes(q!.status);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "details",  label: "Quote Details", icon: <FileText size={14} /> },
    { id: "activity", label: "Activity",      icon: <Calendar size={14} /> },
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
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-8 py-5 flex items-center justify-between shadow-lg rounded-t-xl shrink-0">
          <div className="text-white flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-green-200 text-sm font-semibold tracking-wider">
                {q!.quoteNumber}
              </span>
              <span className={`badge ${statusCSS} text-xs`} style={{ fontSize: 11 }}>
                {q!.status}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight">
              {q!.title || q!.customerName || "Quote"}
            </h2>
            <p className="text-green-100 text-sm mt-0.5">
              Customer: {q!.customerName ?? "\u2014"}
              {q!.jobId && (
                <>
                  {' \u00b7 '}
                  <button
                    onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-job-from-finance', { detail: { job: { id: q!.jobId, title: (q as any).jobTitle || q!.jobId, status: 'PENDING', priority: 'NORMAL', tags: [], companyId: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, returnTo: { type: 'quote', doc: q, label: q!.quoteNumber } } })); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, padding: '1px 6px', color: 'inherit', fontSize: 'inherit', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Briefcase size={10} /> Job {(q as any).jobTitle ? (q as any).jobTitle.slice(0, 20) : q!.jobId!.slice(0, 8)}
                  </button>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                disabled={isBusy || q!.status === "CONVERTED"}
                className="flex items-center gap-1.5 text-green-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 disabled:opacity-50"
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
                  {updateQuote.isPending
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Save size={13} />}
                  Save
                </button>
                <button
                  onClick={() => { setFormData({ notes: q!.notes ?? "", validUntil: q!.validUntil ? q!.validUntil.split("T")[0] : "" }); setIsEditMode(false); setError(""); }}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 text-green-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-green-100 hover:text-white transition-colors p-1 hover:bg-green-500 rounded-lg cursor-pointer bg-transparent border-0"
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
                  ? "border-green-600 text-green-600"
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
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Quote Number
                  </label>
                  <input
                    type="text"
                  value={q!.quoteNumber}
                    disabled
                    className={inputView}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Customer
                  </label>
                  <input
                    type="text"
                    value={quote.customerName ?? "—"}
                    disabled
                    className={inputView}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Title
                  </label>
                  <input
                    type="text"
                    value={q!.title}
                    disabled
                    className={inputView}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Total
                  </label>
                  <input
                    type="text"
                    value={formatMoney(decimalToNumber(q!.total))}
                    disabled
                    className={inputView}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </label>
                  <input
                    type="text"
                    value={q!.status}
                    disabled
                    className={inputView}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleChange}
                    disabled={!isEditMode || isBusy}
                    className={!isEditMode ? inputView : inputEdit}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={!isEditMode || isBusy}
                    rows={3}
                    placeholder="Add notes…"
                    className={`${!isEditMode ? inputView : inputEdit} resize-none`}
                  />
                </div>
                {q!.jobId && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Job Reference
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: 'var(--bg-card-2, #f8fafc)', border: '1px solid var(--bd, #e2e8f0)' }}>
                      <Briefcase size={14} style={{ color: 'var(--blue, #3b82f6)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--t1, #1e293b)', fontFamily: 'ui-monospace, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(q as any).jobTitle || q!.jobId}
                      </span>
                      <button
                        onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-job-from-finance', { detail: { job: { id: q!.jobId, title: (q as any).jobTitle || q!.jobId, status: 'PENDING', priority: 'NORMAL', tags: [], companyId: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, returnTo: { type: 'quote', doc: q, label: q!.quoteNumber } } })); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--blue, #3b82f6)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        <ExternalLink size={10} /> View Job →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar size={14} />
                    Created: {new Date(q!.createdAt).toLocaleString()}
                  </p>
                </div>
                {q!.validUntil && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-700 flex items-center gap-2">
                      <Calendar size={14} />
                      Valid Until: {new Date(q!.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 rounded-b-xl shrink-0 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {/* Send/Resend Quote */}
            {canSendQuote && (
              <button
                onClick={handleSend}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-60 border-0"
              >
                {sendQuote.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                {q!.status === "DRAFT" ? "Send Quote" : "Resend Quote"}
              </button>
            )}
            {/* Approve — only for SENT */}
            {q!.status === "SENT" && (
              <button
                onClick={handleApprove}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-60 border-0"
              >
                {approveQuote.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Approve
              </button>
            )}
            {/* Convert to Invoice — only for ACCEPTED */}
            {q!.status === "ACCEPTED" && (
              <button
                onClick={handleConvert}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-60 border-0"
              >
                {convertQuote.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Convert to Invoice
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleViewPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              View PDF
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
