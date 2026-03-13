import React, { useState, useEffect } from "react";
import {
  X, Edit2, Save, FileText, Calendar, Mail,
  DollarSign, Ban, AlertCircle, Loader2, Download,
} from "lucide-react";
import {
  useUpdateInvoice, useSendInvoice, useRecordPayment, useVoidInvoice, useInvoice, decimalToNumber,
} from "../../hooks/useFinance";
import api from "../../lib/api";
import type { Invoice } from "../../types/api";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

type TabType = "details" | "payment" | "activity";

const INV_CSS: Record<string, string> = {
  DRAFT: "badge-neutral", SENT: "badge-blue", PARTIALLY_PAID: "badge-amber",
  PAID: "badge-green", OVERDUE: "badge-red", CANCELLED: "badge-red", VOID: "badge-neutral",
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
  const [isEditMode, setIsEditMode]   = useState(false);
  const [error, setError]             = useState("");
  const [formData, setFormData]       = useState({ notes: "", dueAt: "" });
  const [payAmount, setPayAmount]     = useState("");
  const [payMethod, setPayMethod]     = useState("CASH");
  const [payReference, setPayReference] = useState("");
  const [downloading, setDownloading] = useState(false);

  const updateInvoice = useUpdateInvoice();
  const sendInvoice   = useSendInvoice();
  const recordPayment = useRecordPayment();
  const voidInvoice   = useVoidInvoice();

  // Fetch live data so the modal auto-updates after status mutations
  const { data: liveInvoice } = useInvoice(invoice?.id ?? undefined)
  const inv = liveInvoice ?? invoice

  const isBusy =
    updateInvoice.isPending || sendInvoice.isPending ||
    recordPayment.isPending || voidInvoice.isPending;

  useEffect(() => {
    if (invoice) {
      setFormData({
        notes: invoice.notes ?? "",
        dueAt: invoice.dueAt ? invoice.dueAt.split("T")[0] : "",
      });
      setIsEditMode(false);
      setActiveTab("details");
      setError("");
      setPayAmount("");
      setPayMethod("CASH");
      setPayReference("");
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setError("");
    updateInvoice.mutate(
      {
        id: inv!.id,
        data: {
          notes: formData.notes || undefined,
          dueAt: formData.dueAt || undefined,
        },
      },
      {
        onSuccess: () => setIsEditMode(false),
        onError:   (err: any) => setError(err?.response?.data?.message ?? "Failed to save invoice."),
      },
    );
  };

  const handleSend = () => {
    setError("");
    sendInvoice.mutate(inv!.id, {
      onError: (err: any) => setError(err?.response?.data?.message ?? "Failed to send invoice."),
    });
  };

  const handleRecordPayment = () => {
    setError("");
    const amount = parseFloat(payAmount);
    if (!payAmount || isNaN(amount) || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }
    recordPayment.mutate(
      { invoiceId: inv!.id, amount, method: payMethod, notes: payReference || undefined },
      {
        onSuccess: () => {
          setPayAmount("");
          setPayReference("");
          setError("");
        },
        onError: (err: any) => setError(err?.response?.data?.message ?? "Failed to record payment."),
      },
    );
  };

  const handleVoid = () => {
    setError("");
    voidInvoice.mutate(
      { id: inv!.id, reason: "Voided via admin dashboard" },
      {
        onSuccess: () => onClose(),
        onError:   (err: any) => setError(err?.response?.data?.message ?? "Failed to void invoice."),
      },
    );
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/finance/invoices/${inv!.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv!.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleViewPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/finance/invoices/${inv!.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err: any) {
      setError('Failed to open PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const statusCSS = INV_CSS[inv!.status] ?? "badge-neutral";

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "details",  label: "Invoice Details", icon: <FileText size={14} /> },
    { id: "payment",  label: "Record Payment",  icon: <DollarSign size={14} /> },
    { id: "activity", label: "Activity",        icon: <Calendar size={14} /> },
  ];

  const canRecordPayment = ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(inv!.status);
  const canVoid = ["DRAFT", "SENT"].includes(inv!.status);

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
                {inv!.invoiceNumber}
              </span>
              <span className={`badge ${statusCSS} text-xs`} style={{ fontSize: 11 }}>
                {inv!.status}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight">
              {inv!.customerName || "Invoice"}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              Balance Due: ${decimalToNumber(inv!.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {inv!.jobId && ` · Job: ${inv!.jobId}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                disabled={isBusy || inv!.status === "VOID" || inv!.status === "PAID"}
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
                  {updateInvoice.isPending
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Save size={13} />}
                  Save
                </button>
                <button
                  onClick={() => { setFormData({ notes: inv!.notes ?? "", dueAt: inv!.dueAt ? inv!.dueAt.split("T")[0] : "" }); setIsEditMode(false); setError(""); }}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 disabled:opacity-50"
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

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoice Number</label>
                  <input type="text" value={invoice.invoiceNumber} disabled className={inputView} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</label>
                  <input type="text" value={invoice.customerName ?? "—"} disabled className={inputView} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</label>
                  <input type="text" value={`$${decimalToNumber(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} disabled className={inputView} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Balance Due</label>
                  <input type="text" value={`$${decimalToNumber(invoice.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} disabled className={inputView} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
                  <input type="text" value={invoice.status} disabled className={inputView} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Due Date</label>
                  <input
                    type="date"
                    name="dueAt"
                    value={formData.dueAt}
                    onChange={handleChange}
                    disabled={!isEditMode || isBusy}
                    className={!isEditMode ? inputView : inputEdit}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</label>
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
                {inv!.jobId && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Job Reference</label>
                    <input type="text" value={inv!.jobId} disabled className={inputView} />
                  </div>
                )}
              </div>
            )}

            {activeTab === "payment" && (
              <div className="space-y-5">
                {!canRecordPayment ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                    Payment recording is only available for invoices with status SENT, PARTIALLY_PAID, or OVERDUE.
                    This invoice is currently <strong>{inv!.status}</strong>.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Payment Amount ($) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder={`Max: $${decimalToNumber(inv!.balanceDue).toFixed(2)}`}
                          min="0.01"
                          step="0.01"
                          disabled={isBusy}
                          className={inputEdit}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Method</label>
                        <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} disabled={isBusy} className={inputEdit}>
                          <option value="CASH">Cash</option>
                          <option value="CARD">Card</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                          <option value="CHEQUE">Cheque</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Reference / Note</label>
                        <input
                          type="text"
                          value={payReference}
                          onChange={(e) => setPayReference(e.target.value)}
                          placeholder="Transaction ID, cheque number…"
                          disabled={isBusy}
                          className={inputEdit}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleRecordPayment}
                      disabled={isBusy}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-60 border-0"
                    >
                      {recordPayment.isPending ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                      Record Payment
                    </button>
                  </>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar size={14} />
                    Created: {new Date(inv!.createdAt).toLocaleString()}
                  </p>
                </div>
                {inv!.issuedAt && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <Calendar size={14} />
                      Issued: {new Date(inv!.issuedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {inv!.paidAt && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <DollarSign size={14} />
                      Paid: {new Date(inv!.paidAt).toLocaleString()} · Amount Paid: ${decimalToNumber(inv!.amountPaid).toFixed(2)}
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
            {/* Send Invoice — only for DRAFT */}
            {inv!.status === "DRAFT" && (
              <button
                onClick={handleSend}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-60 border-0"
              >
                {sendInvoice.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                Send Invoice
              </button>
            )}
            {/* Record Payment shortcut — for unpaid invoices */}
            {canRecordPayment && activeTab !== "payment" && (
              <button
                onClick={() => setActiveTab("payment")}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer border-0"
              >
                <DollarSign size={14} /> Record Payment
              </button>
            )}
            {/* Void Invoice */}
            {canVoid && (
              <button
                onClick={handleVoid}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-60 border-0"
              >
                {voidInvoice.isPending ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                Void
              </button>
            )}
            {/* View PDF */}
            <button
              onClick={handleViewPdf}
              disabled={downloading || isBusy}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              View PDF
            </button>
            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloading || isBusy}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download PDF
            </button>
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
