import { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, Loader2, Plus, Trash2, Search } from "lucide-react";
import { useCreateQuote } from "../../hooks/useFinance";
import { useCustomers } from "../../hooks/useCustomers";
import { useJobs } from "../../hooks/useJobs";
import { useToast } from "../../contexts/ToastContext";
import { customerName as fmtCustomerName } from "../../types/api";
import type { Customer, Job } from "../../types/api";

interface AddQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LineItem {
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

const CATEGORIES = [
  { value: "LABOUR", label: "Labour" },
  { value: "PARTS", label: "Parts" },
  { value: "MATERIALS", label: "Materials" },
  { value: "EQUIPMENT_RENTAL", label: "Equipment Rental" },
  { value: "TRAVEL", label: "Travel" },
  { value: "OTHER", label: "Other" },
];

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none";

export default function AddQuoteModal({ isOpen, onClose }: AddQuoteModalProps) {
  const { showError, showSuccess, showInfo } = useToast();
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [customerNameVal, setCustomerNameVal] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [jobId, setJobId] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [taxRate, setTaxRate] = useState("10");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", category: "LABOUR", quantity: 1, unitPrice: 0 },
  ]);

  // Fetch existing customers and jobs for dropdowns
  const customersQuery = useCustomers({ limit: 100, search: customerSearch || undefined });
  const customers: Customer[] = customersQuery.data?.data ?? [];
  const jobsQuery = useJobs({ limit: 100, search: jobSearch || undefined, customerId: customerId || undefined });
  const jobs: Job[] = jobsQuery.data?.data ?? [];

  const selectCustomer = (c: Customer) => {
    setCustomerId(c.id);
    setCustomerNameVal(fmtCustomerName(c));
    setCustomerEmail(c.email ?? "");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setJobId("");
    setJobSearch("");
  };

  const selectJob = (j: Job) => {
    setJobId(j.id);
    setJobSearch(j.title);
    setShowJobDropdown(false);
    // If no customer selected yet and job has customer info, auto-fill
    if (!customerId && j.customerId) {
      setCustomerId(j.customerId);
      if (j.customerName) setCustomerNameVal(j.customerName);
    }
  };

  const createQuote = useCreateQuote();

  if (!isOpen) return null;

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const tax = subtotal * (parseFloat(taxRate) || 0) / 100;
  const total = subtotal + tax;

  const addLineItem = () => setLineItems(prev => [...prev, { description: "", category: "LABOUR", quantity: 1, unitPrice: 0 }]);
  const removeLineItem = (i: number) => setLineItems(prev => prev.filter((_, idx) => idx !== i));
  const updateLineItem = (i: number, field: keyof LineItem, value: string | number) =>
    setLineItems(prev => prev.map((li, idx) => idx === i ? { ...li, [field]: value } : li));

  const handleSubmit = () => {
    setError("");
    if (!title.trim()) { setError("Title is required."); showInfo("Add a quote title before saving.", "Title Required"); return; }
    if (!customerId.trim()) { setError("Please select a customer."); showInfo("Select a customer before creating a quote.", "Customer Required"); return; }
    if (!customerNameVal.trim()) { setError("Customer name is required."); showError("Customer name is required."); return; }
    if (!customerEmail.trim()) { setError("Customer email is required."); showInfo("Add customer email to send this quote later.", "Email Required"); return; }
    if (lineItems.length === 0 || !lineItems[0].description) { setError("At least one line item is required."); showInfo("Add at least one quote line item.", "Line Items Required"); return; }

    createQuote.mutate(
      {
        title,
        customerName: customerNameVal,
        customerEmail,
        customerId,
        jobId: jobId || undefined,
        taxRate: (parseFloat(taxRate) || 0) / 100,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
        lineItems: lineItems.filter(li => li.description).map((li, i) => ({
          description: li.description,
          category: li.category,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          taxable: true,
          sortOrder: i,
        })),
      } as any,
      {
        onSuccess: () => {
          showSuccess("Quote created successfully.", "Quote Ready");
          onClose();
          setTitle(""); setCustomerNameVal(""); setCustomerEmail(""); setCustomerId("");
          setJobId(""); setNotes(""); setValidUntil(""); setJobSearch("");
          setLineItems([{ description: "", category: "LABOUR", quantity: 1, unitPrice: 0 }]);
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message ?? "Failed to create quote.";
          setError(message);
          showError(message);
        },
      },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 admin-modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl admin-modal-box" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-5 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="text-white">
            <h2 className="text-xl font-bold">Create Quote</h2>
            <p className="text-green-100 text-sm mt-0.5">Add a new quote with line items</p>
          </div>
          <button onClick={onClose} className="text-green-100 hover:text-white p-1 hover:bg-green-500 rounded-lg cursor-pointer bg-transparent border-0">
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
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Title <span className="text-red-500">*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. HVAC Annual Maintenance" className={inputClass} />
            </div>

            {/* Customer Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Customer <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  value={customerId ? customerNameVal : customerSearch}
                  onChange={e => {
                    if (customerId) { setCustomerId(""); setCustomerNameVal(""); setCustomerEmail(""); }
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  placeholder="Search customers..."
                  className={inputClass}
                />
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              {customerId && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-green-600 font-medium">Selected: {customerNameVal}</span>
                  <button onClick={() => { setCustomerId(""); setCustomerNameVal(""); setCustomerEmail(""); }} className="text-xs text-red-500 bg-transparent border-0 cursor-pointer underline">Clear</button>
                </div>
              )}
              {showCustomerDropdown && !customerId && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customersQuery.isLoading && <div className="p-3 text-sm text-gray-400">Loading...</div>}
                  {customers.length === 0 && !customersQuery.isLoading && <div className="p-3 text-sm text-gray-400">No customers found</div>}
                  {customers.map(c => (
                    <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 hover:bg-green-50 transition-colors flex items-center justify-between bg-transparent border-0 cursor-pointer">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{fmtCustomerName(c)}</div>
                        <div className="text-xs text-gray-500">{c.email}</div>
                      </div>
                      <span className="text-[10px] text-gray-400">{c.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Customer Email <span className="text-red-500">*</span></label>
              <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="john@example.com" className={inputClass} />
            </div>

            {/* Job Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Link to Job (optional)</label>
              <div className="relative">
                <input
                  value={jobId ? jobSearch : jobSearch}
                  onChange={e => {
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
                  className={inputClass}
                />
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              {jobId && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-green-600 font-medium">Linked: {jobId.slice(0, 8)}...</span>
                  <button onClick={() => { setJobId(""); setJobSearch(""); }} className="text-xs text-red-500 bg-transparent border-0 cursor-pointer underline">Clear</button>
                </div>
              )}
              {showJobDropdown && !jobId && customerId && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {jobsQuery.isLoading && <div className="p-3 text-sm text-gray-400">Loading...</div>}
                  {jobs.length === 0 && !jobsQuery.isLoading && <div className="p-3 text-sm text-gray-400">No jobs found for selected customer</div>}
                  {jobs.map(j => (
                    <button key={j.id} onClick={() => selectJob(j)} className="w-full text-left px-3 py-2 hover:bg-green-50 transition-colors flex items-center justify-between bg-transparent border-0 cursor-pointer">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{j.title}</div>
                        <div className="text-xs text-gray-500">{j.customerName ?? "No customer"} · {j.status}</div>
                      </div>
                      <span className="text-[10px] text-gray-400">{j.priority}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Tax Rate (%)</label>
              <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} min="0" step="0.5" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Valid Until</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-400 uppercase">Line Items</label>
              <button onClick={addLineItem} className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 bg-transparent border-0 cursor-pointer">
                <Plus size={13} /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="col-span-5 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Description</label>
                    <input value={li.description} onChange={e => updateLineItem(i, "description", e.target.value)} placeholder="Service description" className={inputClass} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Category</label>
                    <select value={li.category} onChange={e => updateLineItem(i, "category", e.target.value)} className={inputClass}>
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Qty</label>
                    <input type="number" value={li.quantity} onChange={e => updateLineItem(i, "quantity", parseInt(e.target.value) || 1)} min="1" className={inputClass} />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Unit Price ($)</label>
                    <input type="number" value={li.unitPrice} onChange={e => updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)} min="0" step="0.01" className={inputClass} />
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
              <div className="text-gray-500">Subtotal: <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span></div>
              <div className="text-gray-500">Tax ({taxRate}%): <span className="font-semibold text-gray-800">${tax.toFixed(2)}</span></div>
              <div className="text-gray-700 font-bold text-base">Total: ${total.toFixed(2)}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional notes…" className={`${inputClass} resize-none`} />
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={createQuote.isPending} className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={createQuote.isPending} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer border-0 disabled:opacity-60">
            {createQuote.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {createQuote.isPending ? "Creating…" : "Create Quote"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
