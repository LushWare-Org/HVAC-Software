import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, Loader2, Plus, Trash2, Search, FileText, Link2, Unlink } from "lucide-react";
import { useCreateInvoice, useQuotes, useConvertQuote } from "../../hooks/useFinance";
import { useCustomers } from "../../hooks/useCustomers";
import { useJobs } from "../../hooks/useJobs";
import { useToast } from "../../contexts/ToastContext";
import { useDocumentTemplates } from "./documentTemplatesApi";
import { customerName as fmtCustomerName } from "../../types/api";
import type { Customer, Job } from "../../types/api";
import { formatMoney } from '../../lib/format'

interface PrefilledJob {
  id: string;
  title: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
}

export interface PresetCustomer {
  id: string;
  name: string;
  email?: string;
}

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledJob?: PrefilledJob | null;
  /** Prefills the customer without linking a specific job (e.g. creating an invoice from a project page). */
  presetCustomer?: PresetCustomer | null;
  /** Attaches the invoice to a project on create (finance-service accepts an optional projectId). */
  projectId?: string;
  /** Attaches the invoice to a specific house within a Housing Scheme project; projectId is auto-backfilled server-side if omitted. */
  componentId?: string;
  contextLabel?: string;
  onCreated?: (invoice: any) => void;
  onBack?: () => void;
}

interface LineItem {
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

const INVOICE_CATEGORY_OPTIONS = [
  { value: "LABOUR", label: "Labour" },
  { value: "PARTS", label: "Parts" },
  { value: "MATERIALS", label: "Materials" },
  { value: "EQUIPMENT_RENTAL", label: "Equipment Rental" },
  { value: "TRAVEL", label: "Travel" },
  { value: "OTHER", label: "Other" },
] as const;

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

export default function AddInvoiceModal({ isOpen, onClose, prefilledJob, presetCustomer, projectId, componentId, contextLabel, onCreated, onBack }: AddInvoiceModalProps) {
  const { showError, showSuccess, showInfo } = useToast();
  const [error, setError] = useState("");
  const [customerNameVal, setCustomerNameVal] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [jobId, setJobId] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState("10");
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState("");
  const templatesQ = useDocumentTemplates('INVOICE');
  const templates = templatesQ.data ?? [];
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", category: "LABOUR", quantity: 1, unitPrice: 0 },
  ]);
  const [linkedQuoteId, setLinkedQuoteId] = useState("");

  const customersQuery = useCustomers({ limit: 100, search: customerSearch || undefined });
  const customers: Customer[] = customersQuery.data?.data ?? [];
  const jobsQuery = useJobs({ limit: 100, search: jobSearch || undefined, customerId: customerId || undefined });
  const jobs: Job[] = jobsQuery.data?.data ?? [];
  const customerQuotesQuery = useQuotes({ customerId: customerId || undefined, limit: 50 });
  const customerQuotes = (customerQuotesQuery.data?.data ?? []).filter((q) => customerId && !['CONVERTED', 'DECLINED', 'EXPIRED'].includes(q.status));
  const linkedQuote = customerQuotes.find((q) => q.id === linkedQuoteId);
  const convertQuote = useConvertQuote();

  // Default the template dropdown to whichever template is marked active, so
  // it's visibly selected rather than silently falling back server-side.
  useEffect(() => {
    if (isOpen && !templateId) {
      const active = templates.find((t) => t.isDefault);
      if (active) setTemplateId(active.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, templates.length]);

  const selectCustomer = (c: Customer) => {
    setCustomerId(c.id);
    setCustomerNameVal(fmtCustomerName(c));
    setCustomerEmail(c.email ?? "");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setJobId("");
    setJobSearch("");
    setLinkedQuoteId("");
  };

  const selectJob = (j: Job) => {
    setJobId(j.id);
    setJobSearch(j.title);
    setShowJobDropdown(false);
  };

  const createInvoice = useCreateInvoice();

  // Auto-fill when opened from a specific job's Finance tab
  useEffect(() => {
    if (isOpen && prefilledJob) {
      setJobId(prefilledJob.id);
      setJobSearch(prefilledJob.title);
      if (prefilledJob.customerId) {
        setCustomerId(prefilledJob.customerId);
        if (prefilledJob.customerName) setCustomerNameVal(prefilledJob.customerName);
        if (prefilledJob.customerEmail) setCustomerEmail(prefilledJob.customerEmail);
      }
    } else if (isOpen && presetCustomer) {
      setCustomerId(presetCustomer.id);
      setCustomerNameVal(presetCustomer.name);
      if (presetCustomer.email) setCustomerEmail(presetCustomer.email);
    }
  }, [isOpen, prefilledJob, presetCustomer]);

  if (!isOpen) return null;

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const tax = (subtotal * (parseFloat(taxRate) || 0)) / 100;
  const total = subtotal + tax;

  const addLineItem = () => setLineItems((prev) => [...prev, { description: "", category: "LABOUR", quantity: 1, unitPrice: 0 }]);
  const removeLineItem = (i: number) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateLineItem = (i: number, field: keyof LineItem, value: string | number) =>
    setLineItems((prev) => prev.map((li, idx) => (idx === i ? { ...li, [field]: value } : li)));

  const resetForm = () => {
    setCustomerNameVal("");
    setCustomerEmail("");
    setCustomerId("");
    setCustomerSearch("");
    setJobId("");
    setJobSearch("");
    setNotes("");
    setDueDate("");
    setLinkedQuoteId("");
    setLineItems([{ description: "", category: "LABOUR", quantity: 1, unitPrice: 0 }]);
  };

  const handleSubmit = () => {
    setError("");
    if (!customerId.trim()) {
      const message = "Please select a customer.";
      setError(message);
      showInfo("Select a customer before creating an invoice.", "Customer Required");
      return;
    }

    // Linked quote: reuse the existing convert-to-invoice flow instead of
    // building a duplicate invoice — this is what actually keeps quoteId set.
    if (linkedQuoteId) {
      convertQuote.mutate(linkedQuoteId, {
        onSuccess: (created) => {
          onCreated?.(created);
          showSuccess("Invoice created from quotation.", "Invoice Ready");
          onClose();
          resetForm();
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message ?? "Failed to convert quotation to invoice.";
          setError(message);
          showError(message);
        },
      });
      return;
    }

    if (!customerNameVal.trim()) {
      const message = "Customer name is required.";
      setError(message);
      showError(message);
      return;
    }
    if (lineItems.length === 0 || !lineItems[0].description) {
      const message = "At least one line item is required.";
      setError(message);
      showInfo("Add at least one invoice line item.", "Line Items Required");
      return;
    }

    createInvoice.mutate(
      {
        customerId,
        customerName: customerNameVal || undefined,
        customerEmail: customerEmail || undefined,
        jobId: jobId || undefined,
        projectId: projectId || undefined,
        componentId: componentId || undefined,
        dueDate: dueDate || undefined,
        taxRate: (parseFloat(taxRate) || 0) / 100,
        notes: notes || undefined,
        templateId: templateId || undefined,
        lineItems: lineItems.filter((li) => li.description).map((li, i) => ({
          description: li.description,
          category: li.category,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          taxable: true,
          sortOrder: i,
        })),
      } as any,
      {
        onSuccess: (created) => {
          onCreated?.(created);
          showSuccess("Invoice created successfully.", "Invoice Ready");
          onClose();
          resetForm();
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message ?? "Failed to create invoice.";
          setError(message);
          showError(message);
        },
      },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 admin-modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl admin-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="text-white">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-blue-200 hover:text-white text-xs font-semibold mb-1.5 bg-transparent border-0 cursor-pointer p-0 transition-colors"
              >
                ← Back to Job
              </button>
            )}
            <h2 className="text-xl font-bold">{contextLabel ? `Create Invoice — ${contextLabel}` : 'Create Invoice'}</h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {prefilledJob ? `For: ${prefilledJob.title}` : "Create a new invoice with line items"}
            </p>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white p-1 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0">
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
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Customer <span className="text-red-500">*</span></label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  value={customerId ? customerNameVal : customerSearch}
                  onChange={(e) => {
                    if (customerId) {
                      setCustomerId("");
                      setCustomerNameVal("");
                      setCustomerEmail("");
                    }
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  placeholder="Search customers..."
                  className={`${inputClass} pl-8`}
                />
              </div>
              {showCustomerDropdown && (customerSearch || !customerId) && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customersQuery.isLoading && <div className="px-3 py-2 text-sm text-gray-400">Loading...</div>}
                  {!customersQuery.isLoading && customers.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No customers found</div>}
                  {customers.map((c) => (
                    <button key={c.id} onMouseDown={() => selectCustomer(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-0 bg-transparent">
                      <div className="font-medium text-gray-900">{fmtCustomerName(c)}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </button>
                  ))}
                </div>
              )}
              {customerId && <p className="text-[11px] text-blue-600 font-medium mt-0.5">✓ {customerNameVal}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Customer Email</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="auto-filled from customer" className={inputClass} />
            </div>
          </div>

          {customerId && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                <FileText size={12} /> Link a Quotation (optional)
              </label>
              {linkedQuote ? (
                <div className="flex items-center justify-between gap-3 p-3.5 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-purple-800 flex items-center gap-1.5">
                      <Link2 size={13} /> Converting {linkedQuote.quoteNumber}
                    </div>
                    <div className="text-xs text-purple-600 mt-0.5">
                      {linkedQuote.title} · {formatMoney(Number(linkedQuote.total))} · line items and totals will be copied onto the invoice
                    </div>
                  </div>
                  <button
                    onClick={() => setLinkedQuoteId("")}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 cursor-pointer shrink-0"
                  >
                    <Unlink size={12} /> Unlink
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-36 overflow-y-auto">
                  {customerQuotesQuery.isLoading ? (
                    <div className="px-3 py-2.5 text-sm text-gray-400">Loading quotations…</div>
                  ) : customerQuotes.length === 0 ? (
                    <div className="px-3 py-2.5 text-sm text-gray-400">No convertible quotations for this customer.</div>
                  ) : (
                    customerQuotes.map((q) => (
                      <button
                        key={q.id}
                        disabled={q.status !== 'ACCEPTED'}
                        onClick={() => setLinkedQuoteId(q.id)}
                        title={q.status !== 'ACCEPTED' ? 'Only ACCEPTED quotes can be converted to an invoice' : undefined}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left border-t border-gray-100 first:border-t-0 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent bg-transparent border-0 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{q.quoteNumber} · {q.title}</div>
                          <div className="text-xs text-gray-500">{formatMoney(Number(q.total))}</div>
                        </div>
                        <span className={`badge ${q.status === 'ACCEPTED' ? 'badge-green' : 'badge-neutral'} shrink-0`} style={{ fontSize: 10.5 }}>{q.status}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {!linkedQuoteId && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Job (optional)</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  value={jobSearch}
                  onChange={(e) => {
                    if (jobId) setJobId("");
                    setJobSearch(e.target.value);
                    setShowJobDropdown(true);
                  }}
                  onFocus={() => {
                    if (!customerId) {
                      setShowJobDropdown(false);
                      showInfo("Select a customer first to view their jobs.", "Choose Customer First");
                      return;
                    }
                    setShowJobDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowJobDropdown(false), 200)}
                  placeholder={customerId ? "Select or search customer's jobs..." : "Select customer first"}
                  disabled={!customerId}
                  className={`${inputClass} pl-8`}
                />
              </div>
              {showJobDropdown && !jobId && customerId && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {jobsQuery.isLoading && <div className="px-3 py-2 text-sm text-gray-400">Loading...</div>}
                  {!jobsQuery.isLoading && jobs.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No jobs found for selected customer</div>}
                  {jobs.map((j) => (
                    <button key={j.id} onMouseDown={() => selectJob(j)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-0 bg-transparent">
                      <div className="font-medium text-gray-900">{j.title}</div>
                      {j.customerName && <div className="text-xs text-gray-500">{j.customerName}</div>}
                    </button>
                  ))}
                </div>
              )}
              {jobId && <p className="text-[11px] text-blue-600 font-medium mt-0.5">✓ {jobSearch}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Tax Rate (%)</label>
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} min="0" step="0.5" className={inputClass} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-400 uppercase">Line Items</label>
              <button onClick={addLineItem} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-transparent border-0 cursor-pointer">
                <Plus size={13} /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="col-span-5 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Description</label>
                    <input value={li.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} placeholder="Service / Part" className={inputClass} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Category</label>
                    <select value={li.category} onChange={(e) => updateLineItem(i, "category", e.target.value)} className={inputClass}>
                      {INVOICE_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Qty</label>
                    <input type="number" value={li.quantity} onChange={(e) => updateLineItem(i, "quantity", parseInt(e.target.value, 10) || 1)} min="1" className={inputClass} />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Unit Price ($)</label>
                    <input type="number" value={li.unitPrice} onChange={(e) => updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)} min="0" step="0.01" className={inputClass} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLineItem(i)} className="p-1.5 text-red-400 hover:text-red-600 bg-transparent border-0 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right space-y-1 text-sm">
              <div className="text-gray-500">Subtotal: <span className="font-semibold text-gray-800">{formatMoney(subtotal)}</span></div>
              <div className="text-gray-500">Tax ({taxRate}%): <span className="font-semibold text-gray-800">{formatMoney(tax)}</span></div>
              <div className="text-gray-700 font-bold text-base">Total: {formatMoney(total)}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional notes..." className={`${inputClass} resize-none`} />
          </div>

          {templates.length > 1 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Template</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inputClass}>
                {!templates.some((t) => t.isDefault) && <option value="">Use default</option>}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (active)' : ''}</option>
                ))}
              </select>
            </div>
          )}
          </>
          )}
        </div>

        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={createInvoice.isPending || convertQuote.isPending} className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={createInvoice.isPending || convertQuote.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer border-0 disabled:opacity-60">
            {(createInvoice.isPending || convertQuote.isPending) ? <Loader2 size={14} className="animate-spin" /> : null}
            {linkedQuoteId
              ? (convertQuote.isPending ? "Converting…" : "Create Invoice From Quote")
              : (createInvoice.isPending ? "Creating..." : "Create Invoice")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

