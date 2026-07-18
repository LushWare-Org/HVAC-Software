import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  X,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Plus,
  Star,
  FileText,
  Activity,
  Save,
  Edit2,
  User,
  Users,
  Wrench,
  ClipboardList,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Wifi,
  Loader2,
  Check,
  FolderKanban,
  CalendarRange,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { IotDevicesTab } from "./IotDevicesTab";
import CustomerAgreementsTab from "../agreements/CustomerAgreementsTab";
import { useNavigate } from "react-router-dom";
import { useCustomerProjects, STATUS_META } from "../projects/projectsApi";
import AddJobModal from "../jobs/AddJobModal";
import { TagInput } from "../../components/TagInput";
import { useCustomerStatusSummary, useUpdateCustomer, useCustomerTags } from "../../hooks/useCustomers";
import { useCustomerAddresses, useSaveCustomerAddresses } from "../../hooks/useAddresses";
import { useCustomerEquipment, useSaveCustomerEquipment } from "../../hooks/useEquipment";
import EquipmentConsumables from "./EquipmentConsumables";
import { useJobs } from "../../hooks/useJobs";
import { useQuotes, useInvoices } from "../../hooks/useFinance";
import { decimalToNumber } from "../../hooks/useFinance";
import type { CustomerStatusSummary } from "../../types/api";
import { formatMoney as formatMoneyBase } from '../../lib/format'

type TabType =
  | "contact"
  | "addresses"
  | "equipment"
  | "jobs"
  | "agreements"
  | "projects"
  | "reviews"
  | "activity"
  | "reasoning"
  | "iot";

interface CustomerDetailsSidebarProps {
  person: any | null;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  initialTab?: TabType;
}

const inputBase =
  "w-full px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors";
const inputView = `${inputBase} bg-gray-100 border-transparent text-gray-600`;
const inputEdit = `${inputBase} bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`;

function Field({
  label,
  name,
  value,
  type = "text",
  isEdit,
  onChange,
  placeholder = "—",
  full = false,
  as = "input",
  options,
}: any) {
  const cls = `${full ? "col-span-2" : ""} space-y-1.5`;
  return (
    <div className={cls}>
      <label className="text-[11px] font-700 text-[var(--t4)] uppercase tracking-wider">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={!isEdit}
          rows={3}
          placeholder={isEdit ? placeholder : ""}
          className={isEdit ? inputEdit : inputView}
          style={{ resize: "none" }}
        />
      ) : as === "select" ? (
        <select
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={!isEdit}
          className={isEdit ? inputEdit : inputView}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options?.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={!isEdit}
          placeholder={isEdit ? placeholder : ""}
          className={isEdit ? inputEdit : inputView}
        />
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: any;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-700 text-[var(--t1)] flex items-center gap-2">
        <Icon size={16} className="text-[var(--blue-light)]" />
        {title}
      </h3>
      {action}
    </div>
  );
}

const mockContacts = [{ id: 1, name: "", role: "Owner", email: "", phone: "" }];
const mockReviews: any[] = [];


const JOB_CSS: Record<string, string> = {
  COMPLETED: "badge-green",
  INVOICED: "badge-cyan",
  ON_SITE: "badge-blue",
  EN_ROUTE: "badge-blue",
  SCHEDULED: "badge-amber",
  PENDING: "badge-amber",
  CANCELLED: "badge-red",
  PAID: "badge-green",
  ON_HOLD: "badge-neutral",
};

const QUO_CSS: Record<string, string> = {
  DRAFT: "badge-neutral",
  SENT: "badge-blue",
  VIEWED: "badge-blue",
  ACCEPTED: "badge-green",
  DECLINED: "badge-red",
  REJECTED: "badge-red",
  EXPIRED: "badge-amber",
  CONVERTED: "badge-cyan",
};

const INV_CSS: Record<string, string> = {
  DRAFT: "badge-neutral",
  SENT: "badge-blue",
  PARTIALLY_PAID: "badge-amber",
  PAID: "badge-green",
  OVERDUE: "badge-red",
  CANCELLED: "badge-red",
  VOID: "badge-neutral",
};

function formatPct(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return formatMoneyBase(0, { decimals: 0 });
  return formatMoneyBase(value, { decimals: 0 });
}

function offerLabel(value?: string) {
  if (!value) return "None";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function riskColor(level: CustomerStatusSummary["churnPrediction"]["level"]) {
  if (level === "High") return "var(--red)";
  if (level === "Medium") return "var(--amber)";
  return "var(--green)";
}

function fallbackReasoning(summary: CustomerStatusSummary) {
  const upsell = summary.upsellRecommendation;
  const retention = summary.retentionPrediction;
  const source = "rule-based classification";

  return {
    upsellRecommendation: {
      ruleBased: `Scores consider service recency (${summary.signals.daysSinceLastService} days), failure risk (${summary.failurePrediction.level}), churn risk (${summary.churnPrediction.level}), and monthly spend (${formatMoney(summary.signals.avgMonthlySpend)}).`,
      mlResult: upsell
        ? `Recommended ${offerLabel(upsell.recommendedOffer)} with ${formatPct(upsell.confidence)} confidence and ${formatPct(upsell.priorityScore ?? upsell.confidence)} priority.`
        : "No upsell recommendation was returned for this customer.",
      aiExplanation: upsell
        ? `The offer is favored because the customer signals make ${offerLabel(upsell.recommendedOffer).toLowerCase()} the strongest commercial follow-up.`
        : "The system needs more offer data before it can explain a specific upsell recommendation.",
    },
    retentionSuggestion: {
      ruleBased: "Retention thresholds favor premium contracts for high conversion and value, retention discounts for high churn, and maintenance plans for repeated failure history.",
      mlResult: retention
        ? `${source} inputs produced ${formatPct(retention.pConvert)} conversion probability, ${formatMoney(retention.ltv)} annual value, ${formatPct(retention.churnProbability)} churn probability, and score ${Math.round(retention.score)}.`
        : "No retention suggestion was returned for this customer.",
      aiExplanation: retention
        ? `${retention.reason}. Suggested action: ${offerLabel(retention.action)} at ${retention.priority} priority via ${offerLabel(retention.recommendedChannel)}.`
        : "The system cannot explain a retention action until a retention prediction is available.",
    },
    failureAndChurnPrediction: {
      ruleBased: "Fallback rules increase churn for long inactivity and low recent service count; failure risk rises with older equipment, service gaps, and poor review history.",
      mlResult: `${source} returned ${summary.churnPrediction.level} churn risk (${formatPct(summary.churnPrediction.probability)}) and ${summary.failurePrediction.level} failure risk (${formatPct(summary.failurePrediction.probability)}).`,
      aiExplanation: `The combined result means this customer needs outreach calibrated to churn risk and service timing calibrated to failure risk.`,
    },
    proposedNextStep: {
      ruleBased: "Next-step rules prioritize paused follow-up review, urgent intervention, retention offers, maintenance scheduling, re-engagement, monitoring, then normal cadence.",
      mlResult: `Selected next step: ${summary.proposedNextStep}`,
      aiExplanation: "This converts the risk and recommendation results into the next operational action for the team.",
    },
  };
}

function ReasoningCard({
  title,
  result,
  accent,
  details,
}: {
  title: string;
  result: string;
  accent: string;
  details: {
    ruleBased: string;
    mlResult: string;
    aiExplanation: string;
  };
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="text-sm font-700 text-[var(--t1)]">{title}</h4>
          <p className="text-xs text-[var(--t2)] mt-1 font-600">{result}</p>
        </div>
        <span className="text-[11px] font-700 px-2 py-1 rounded-md" style={{ color: accent, background: "rgba(59, 130, 246, 0.12)" }}>
          Explanation
        </span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-[11px] font-700 text-[var(--t2)] uppercase tracking-wider mb-2">Rule based</div>
          <p className="text-sm text-[var(--t1)] leading-relaxed">{details.ruleBased}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-[11px] font-700 text-[var(--t2)] uppercase tracking-wider mb-2">ML result</div>
          <p className="text-sm text-[var(--t1)] leading-relaxed">{details.mlResult}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-[11px] font-700 text-[var(--t2)] uppercase tracking-wider mb-2">AI explanation</div>
          <p className="text-sm text-[var(--t1)] leading-relaxed">{details.aiExplanation}</p>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetailsSidebar({
  person,
  isOpen,
  onClose,
  onBack,
  initialTab = "contact",
}: CustomerDetailsSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [addresses, setAddresses] = useState<any[]>([]);
  const [contacts, setContacts] = useState(mockContacts);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [reviews, setReviews] = useState(mockReviews);
  const [showRequestPanel, setShowRequestPanel] = useState(false);
  const [requestForm, setRequestForm] = useState({
    email: "",
    channel: "Google",
    message: "",
  });

  // Fetch real jobs and quotes for this customer
  const customerId = person?.id ?? "";
  const statusSummaryQuery = useCustomerStatusSummary(customerId || undefined);
  const customerJobsQuery = useJobs({ customerId: customerId || undefined, limit: 50 });
  const customerJobs = [...(customerJobsQuery.data?.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const customerQuotesQuery = useQuotes({ customerId: customerId || undefined, limit: 50 });
  const customerQuotes = [...(customerQuotesQuery.data?.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const customerInvoicesQuery = useInvoices({ customerId: customerId || undefined, limit: 50 });
  const customerInvoices = [...(customerInvoicesQuery.data?.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const currentYear = new Date().getFullYear();
  const lifetimeRevenue = decimalToNumber(person?.totalRevenue ?? customerInvoices.reduce((sum, invoice) => sum + decimalToNumber(invoice.total), 0));
  const ytdRevenue = customerInvoices.reduce((sum, invoice) => {
    const invoiceDate = new Date(invoice.createdAt);
    if (invoiceDate.getFullYear() !== currentYear) return sum;
    if (['DRAFT', 'VOID', 'CANCELLED'].includes(invoice.status)) return sum;
    return sum + decimalToNumber(invoice.total);
  }, 0);
  const outstandingBalance = customerInvoices.reduce((sum, invoice) => sum + decimalToNumber(invoice.balanceDue), 0);

  // Fetch real addresses and equipment from API
  const addressesQuery = useCustomerAddresses(customerId || undefined);
  const customerProjectsQuery = useCustomerProjects(customerId || undefined);
  const customerProjects = customerProjectsQuery.data;
  const navigateToProject = useNavigate();
  const equipmentQuery = useCustomerEquipment(customerId || undefined);
  const saveAddresses = useSaveCustomerAddresses();
  const saveEquipment = useSaveCustomerEquipment();

  useEffect(() => {
    if (isOpen && person) {
      document.body.style.overflow = "hidden";
      const fullName = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
      setFormData({
        ...person,
        name: fullName,
        whatsappNo: person.mobile || '',
        customerSince: person.createdAt ? person.createdAt.split('T')[0] : '',
        lastService: person.lastServiceDate ? person.lastServiceDate.split('T')[0] : '',
      });
      setTags(person.tags ?? []);
      setContacts([
        {
          id: 1,
          name: fullName,
          role: "Owner",
          email: person.email || "",
          phone: person.phone || person.mobile || "",
        },
      ]);
      setReviews(mockReviews);
      setActiveTab(initialTab);
      setIsEditMode(false);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, person, initialTab]);

  // Sync addresses from API query into local state for editing
  useEffect(() => {
    if (addressesQuery.data) {
      setAddresses(addressesQuery.data.map((a: any) => ({
        id: a.id,
        type: a.type || "Site",
        line1: a.line1 || "",
        line2: a.line2 || "",
        city: a.city || "",
        state: a.state || "",
        postcode: a.postcode || "",
        isPrimary: a.isPrimary || false,
      })));
    }
  }, [addressesQuery.data]);

  // Sync equipment from API query into local state for editing
  useEffect(() => {
    if (equipmentQuery.data) {
      setEquipment(equipmentQuery.data.map((e: any) => ({
        id: e.id,
        type: e.type || "Boiler",
        brand: e.brand || "",
        model: e.model || "",
        serial: e.serialNo || "",
        install: e.installDate ? e.installDate.split("T")[0] : "",
        warranty: e.warrantyEnd ? e.warrantyEnd.split("T")[0] : "",
        manualUrl: e.manualUrl || "",
      })));
    }
  }, [equipmentQuery.data]);

  // Hook must be called unconditionally — before any early returns
  const updateCustomer = useUpdateCustomer();
  const allTagsQuery = useCustomerTags();
  const allTags = allTagsQuery.data ?? [];
  const { showSuccess, showError } = useToast();
  const [saveSucceeded, setSaveSucceeded] = useState(false);

  if (!isOpen || !person) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const nameParts = (formData.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName  = nameParts.slice(1).join(' ') || '';
    updateCustomer.mutate(
      { id: person.id, data: {
          firstName: firstName || undefined,
          lastName:  lastName  || undefined,
          email:  formData.email      || undefined,
          phone:  formData.phone      || undefined,
          mobile: formData.whatsappNo || undefined,
          source: formData.source     || undefined,
          type:   (formData.type as 'RESIDENTIAL' | 'COMMERCIAL') || undefined,
          notes:  formData.notes || undefined,
          engagementStatus: formData.engagementStatus || undefined,
          tags,
      }},
      {
        onSuccess: () => {
          // Also save addresses if any exist or were modified
          if (addresses.length > 0 || (addressesQuery.data && addressesQuery.data.length > 0)) {
            saveAddresses.mutate({
              customerId: person.id,
              addresses: addresses
                .filter((a: any) => a.line1?.trim())
                .map((a: any) => ({
                  type: a.type || 'Site',
                  line1: a.line1,
                  line2: a.line2 || undefined,
                  city: a.city || undefined,
                  state: a.state || undefined,
                  postcode: a.postcode || undefined,
                  isPrimary: a.isPrimary || false,
                })),
            });
          }
          // Also save equipment if any exist or were modified
          if (equipment.length > 0 || (equipmentQuery.data && equipmentQuery.data.length > 0)) {
            saveEquipment.mutate({
              customerId: person.id,
              equipment: equipment
                .filter((e: any) => e.brand?.trim() || e.model?.trim() || e.serial?.trim())
                .map((e: any) => ({
                  type: e.type || 'Boiler',
                  brand: e.brand || undefined,
                  model: e.model || undefined,
                  serialNo: e.serial || undefined,
                  installDate: e.install || undefined,
                  warrantyEnd: e.warranty || undefined,
                  manualUrl: e.manualUrl || undefined,
                })),
            });
          }
          setIsEditMode(false);
          setSaveSucceeded(true);
          setTimeout(() => setSaveSucceeded(false), 2000);
          showSuccess('Customer details saved.');
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? err.message ?? 'Something went wrong.';
          showError(msg, 'Save failed');
        },
      }
    );
  };

  const engagementOrder = ["ACTIVE", "QUOTE_SENT", "JOB_BOOKED", "INVOICE_SENT", "COMPLETED"];
  const engagementIdx = engagementOrder.indexOf(formData.engagementStatus || "ACTIVE");
  const stages = [
    { name: "Active", status: engagementIdx > 0 ? "completed" : engagementIdx === 0 ? "active" : "pending" },
    { name: "Quote Sent", status: engagementIdx > 1 ? "completed" : engagementIdx === 1 ? "active" : "pending" },
    { name: "Job Booked", status: engagementIdx > 2 ? "completed" : engagementIdx === 2 ? "active" : "pending" },
    { name: "Invoice Sent", status: engagementIdx > 3 ? "completed" : engagementIdx === 3 ? "active" : "pending" },
    { name: "Completed", status: engagementIdx === 4 ? "active" : "pending" },
  ];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "contact", label: "Contact", icon: <User size={14} /> },
    { id: "addresses", label: "Addresses", icon: <MapPin size={14} /> },
    { id: "equipment", label: "Equipment", icon: <Wrench size={14} /> },
    { id: "jobs", label: "Jobs", icon: <ClipboardList size={14} /> },
    { id: "agreements", label: "Agreements", icon: <ShieldCheck size={14} /> },
    // Projects tab appears only when the customer has at least one project
    ...((customerProjects?.length ?? 0) > 0
      ? [{ id: "projects" as TabType, label: "Projects", icon: <FolderKanban size={14} /> }]
      : []),
    { id: "reviews", label: "Reviews", icon: <Star size={14} /> },
    { id: "activity", label: "Activity", icon: <Activity size={14} /> },
    { id: "reasoning", label: "Reasoning", icon: <FileText size={14} /> },
    { id: "iot", label: "IoT", icon: <Wifi size={14} /> },
  ];

  // Real activity timeline derived from the actual record — no DB activity log yet
  const activityTimeline = (() => {
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const events: Array<{ id: string; icon: any; color: string; label: string; desc: string; time: string }> = [];
    events.push({
      id: 'created', icon: Plus, color: '#3B82F6',
      label: 'Customer Created',
      desc: person.source ? `Customer added via ${person.source}.` : 'Customer added manually.',
      time: fmt(person.createdAt),
    });
    return events;
  })();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[200] transition-opacity"
        onClick={onClose}
      />
      <div
        className="fixed top-0 bottom-0 right-0 w-3/4 z-[210] flex flex-col shadow-2xl transition-transform transform duration-300 translate-x-0 border-l border-gray-200"
        style={{ background: "var(--bg-card)" }}
      >
        <div className="sticky top-0 bg-[var(--blue)] px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="text-white">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors border-0 cursor-pointer"
                  aria-label="Go back"
                  title="Back"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <h2 className="text-xl font-bold">
                {formData.name || "Details"}
              </h2>
              <select
                value={formData.engagementStatus || "ACTIVE"}
                onChange={(e) =>
                  setFormData({ ...formData, engagementStatus: e.target.value })
                }
                disabled={!isEditMode}
                className={`bg-white text-gray-900 text-xs px-2 py-1 rounded-md outline-none h-[28px] ${!isEditMode ? "opacity-90 cursor-default" : "cursor-pointer"}`}
              >
                <option value="ACTIVE">Active</option>
                <option value="QUOTE_SENT">Quote Sent</option>
                <option value="JOB_BOOKED">Job Booked</option>
                <option value="INVOICE_SENT">Invoice Sent</option>
                <option value="COMPLETED">Completed</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <p className="text-blue-100 text-xs mt-1">
              {formData.company || formData.businessName || "Customer"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 mr-2 border-r border-white/20 pr-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">
                  Customer Since
                </span>
                <input
                  type="date"
                  value={formData.customerSince || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, customerSince: e.target.value })
                  }
                  disabled={!isEditMode}
                  className={`bg-white text-gray-900 px-2 py-1 h-[28px] rounded-md text-xs outline-none w-[130px] ${!isEditMode ? "opacity-90 cursor-default" : ""}`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">
                  Last Service
                </span>
                <input
                  type="date"
                  value={formData.lastService || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lastService: e.target.value })
                  }
                  disabled={!isEditMode}
                  className={`bg-white text-gray-900 px-2 py-1 h-[28px] rounded-md text-xs outline-none w-[130px] ${!isEditMode ? "opacity-90 cursor-default" : ""}`}
                />
              </div>
            </div>

            {isEditMode ? (
              <>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-5 py-1.5 text-white bg-red-500 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors border-0"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateCustomer.isPending}
                  className="flex flex-row items-center justify-center gap-2 px-5 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: saveSucceeded ? '#10b981' : 'white',
                    color: saveSucceeded ? 'white' : 'var(--blue)',
                    opacity: updateCustomer.isPending ? 0.8 : 1,
                    cursor: updateCustomer.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updateCustomer.isPending ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  ) : saveSucceeded ? (
                    <><Check size={14} /> Saved</>
                  ) : (
                    <><Save size={14} /> Save</>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex flex-row items-center justify-center gap-2 bg-white text-[var(--blue)] hover:bg-blue-50 px-5 py-1.5 rounded-lg text-sm font-semibold transition-all border-0"
              >
                <Edit2 size={14} /> Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg border-0 bg-transparent flex items-center justify-center cursor-pointer ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Panel */}
              <div className="col-span-3 space-y-4">
                <div
                  className="rounded-xl border border-gray-200 p-5 shadow-sm"
                  style={{ background: "var(--bg-card)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--blue)] text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {formData.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h1 className="text-base font-bold text-[var(--t1)]">
                        {formData.name}
                      </h1>
                      <div className="text-sm text-[var(--t3)] mt-0.5">
                        {formData.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl border border-gray-200 p-5 shadow-sm"
                  style={{ background: "var(--bg-card)" }}
                >
                  <h3 className="text-sm font-semibold text-[var(--t1)] mb-4 flex items-center gap-2">
                    <Mail size={16} className="text-[var(--blue-light)]" />{" "}
                    Contact Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail size={14} className="text-[var(--t4)] shrink-0" />
                      <span className="text-sm text-[var(--t2)] truncate">
                        {formData.email || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={14} className="text-[var(--t4)] shrink-0" />
                      <span className="text-sm text-[var(--t2)]">
                        {formData.phone || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={14} className="text-[var(--t4)] shrink-0" />
                      <span className="text-sm text-[var(--t2)]">
                        {formData.city || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2
                        size={14}
                        className="text-[var(--t4)] shrink-0"
                      />
                      <span className="text-sm text-[var(--t2)]">
                        {formData.type || "Residential"} Customer
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl border border-gray-200 p-5 shadow-sm"
                  style={{ background: "var(--bg-card)" }}
                >
                  <h3 className="text-sm font-semibold text-[var(--t1)] mb-4 flex items-center gap-2">
                    <CheckCircle2
                      size={16}
                      className="text-[var(--blue-light)]"
                    />{" "}
                    Status
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-600 text-[var(--t4)] uppercase tracking-wider mb-1">
                        Lifecycle
                      </p>
                      <div className="bg-[var(--blue-dim)] text-[var(--blue-light)] inline-block px-3 py-1.5 rounded-lg text-sm font-medium">
                        {(formData.engagementStatus || 'ACTIVE').replace(/_/g, ' ')}
                      </div>
                    </div>
                    {formData.assigned && (
                      <div>
                        <p className="text-xs font-600 text-[var(--t4)] uppercase tracking-wider mb-1">
                          Assigned To
                        </p>
                        <div className="text-sm font-medium text-[var(--t2)]">
                          {formData.assigned}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Revenue */}
                <div
                  className="rounded-xl border border-gray-200 p-5 shadow-sm"
                  style={{ background: "var(--bg-card)" }}
                >
                  <h3 className="text-sm font-semibold text-[var(--t1)] mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-[var(--blue-light)]" />{" "}
                    Revenue
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-600 text-[var(--t4)] uppercase tracking-wider mb-1">
                        Total Lifetime
                      </p>
                      <div className="text-lg font-bold text-[var(--green)]">
                        {formatMoney(lifetimeRevenue)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-600 text-[var(--t4)] uppercase tracking-wider mb-1">
                        YTD Revenue
                      </p>
                      <div className="text-sm font-medium text-[var(--t2)]">
                        {formatMoney(ytdRevenue)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-600 text-[var(--t4)] uppercase tracking-wider mb-1">
                        Outstanding Balance
                      </p>
                      <div className="text-sm font-medium text-red-500">
                        {formatMoney(outstandingBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="col-span-9 space-y-4">
                {formData.engagementStatus !== 'INACTIVE' && (
                    <div
                      className="rounded-xl border border-gray-200 p-5 shadow-sm"
                      style={{ background: "var(--bg-card)" }}
                    >
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Customer Engagement Pipeline</p>
                      <div className="relative pt-2 pb-1">
                        <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-gray-300" />
                        <div className="relative z-10 flex justify-between">
                          {stages.map((stage, i) => (
                            <div
                              key={i}
                              className="flex flex-col items-center gap-2 px-2"
                              style={{ background: "var(--bg-card)" }}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${stage.status === "completed" ? "bg-[var(--green)] border-[var(--green)] text-white" : stage.status === "active" ? "bg-white border-[var(--blue)] ring-2 ring-[var(--blue-dim)] ring-offset-2" : "bg-white border-[var(--bd-md)]"}`}
                              >
                                {stage.status === "completed" && (
                                  <CheckCircle2 size={12} />
                                )}
                                {stage.status === "active" && (
                                  <div className="w-2 h-2 rounded-full bg-[var(--blue)]" />
                                )}
                              </div>
                              <span
                                className={`text-[11px] font-semibold text-center leading-tight ${stage.status === "pending" ? "text-[var(--t4)]" : "text-[var(--t2)]"}`}
                              >
                                {stage.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Tabs */}
                <div
                  className="rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                  style={{ background: "var(--bg-card)", minHeight: 560 }}
                >
                  {/* Tab nav — pill grid, always fully visible, no scroll needed */}
                  <div
                    className="shrink-0 px-3 pt-3 pb-2 border-b"
                    style={{ borderColor: 'var(--bd)' }}
                  >
                    <div className="flex flex-wrap gap-1">
                      {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-600 whitespace-nowrap transition-all cursor-pointer relative"
                            style={{
                              background: isActive ? 'var(--blue)' : 'var(--bg-surface)',
                              color: isActive ? '#fff' : 'var(--t3)',
                              boxShadow: isActive ? '0 1px 4px rgba(37,99,235,0.25)' : 'none',
                            }}
                          >
                            <span style={{ opacity: isActive ? 1 : 0.7 }}>{tab.icon}</span>
                            {tab.label}
                            {tab.id === "jobs" && (
                              customerJobsQuery.isFetching
                                ? <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: isActive ? 'rgba(255,255,255,0.4)' : 'var(--t4)', marginLeft: 4, opacity: 0.7 }} />
                                : customerJobs.length > 0 && (
                                    <span
                                      className="ml-0.5 text-[10px] font-700 px-1 rounded-full"
                                      style={{
                                        background: isActive ? 'rgba(255,255,255,0.25)' : '#EF4444',
                                        color: '#fff',
                                        lineHeight: '16px',
                                        minWidth: 16,
                                        textAlign: 'center',
                                        display: 'inline-block',
                                      }}
                                    >
                                      {customerJobs.length}
                                    </span>
                                  )
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className="flex-1 overflow-y-auto p-6"
                    style={{ background: "var(--bg-card)" }}
                  >
                    {activeTab === "contact" && (
                      <div className="space-y-8">
                        <div>
                          <SectionHeader icon={User} title="Profile Info" />
                          <div className="grid grid-cols-2 gap-5">
                            <Field
                              label="Full Name"
                              name="name"
                              value={formData.name}
                              isEdit={isEditMode}
                              onChange={handleChange}
                            />
                            <Field
                              label="Email"
                              name="email"
                              type="email"
                              value={formData.email}
                              isEdit={isEditMode}
                              onChange={handleChange}
                            />
                            <Field
                              label="Phone"
                              name="phone"
                              value={formData.phone}
                              isEdit={isEditMode}
                              onChange={handleChange}
                              placeholder="+1 7700 000000"
                            />
                            <Field
                              label="Lead Source"
                              name="source"
                              value={formData.source}
                              isEdit={isEditMode}
                              onChange={handleChange}
                              as="select"
                              options={[
                                "Google",
                                "Referral",
                                "Facebook",
                                "Yelp",
                                "Walk-in",
                                "Other",
                              ]}
                              placeholder="Select Source"
                            />
                            <Field
                              label="Customer Type"
                              name="type"
                              value={formData.type}
                              isEdit={isEditMode}
                              onChange={handleChange}
                              as="select"
                              options={[
                                "RESIDENTIAL",
                                "COMMERCIAL",
                              ]}
                              placeholder="Select Type"
                            />
                            <Field
                              label="Notes / Remarks"
                              name="notes"
                              value={formData.notes}
                              isEdit={isEditMode}
                              onChange={handleChange}
                              as="textarea"
                              full
                            />

                            {/* Tags */}
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                Tags
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 8 }}>
                                Used for filtering, campaign segmentation and reporting. Press Enter or comma to add.
                              </div>
                              <TagInput
                                tags={tags}
                                onChange={setTags}
                                suggestions={allTags}
                                placeholder="Type a tag and press Enter…"
                                readOnly={!isEditMode}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Additional Contacts */}
                        <div>
                          <SectionHeader
                            icon={Users}
                            title="Account Contacts"
                            action={
                              isEditMode && (
                                <button
                                  className="flex items-center gap-1 text-[11px] font-600 text-blue-600 hover:text-blue-700"
                                  onClick={() =>
                                    setContacts((prev) => [
                                      ...prev,
                                      {
                                        id: Date.now(),
                                        name: "",
                                        role: "Tenant",
                                        email: "",
                                        phone: "",
                                      },
                                    ])
                                  }
                                >
                                  <Plus size={13} /> Add Contact
                                </button>
                              )
                            }
                          />
                          <div className="space-y-4">
                            {contacts.map((c, idx) => (
                              <div
                                key={c.id}
                                className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-3"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-700 text-[var(--t4)] uppercase tracking-wider">
                                    Contact {idx + 1}
                                  </span>
                                  {isEditMode && contacts.length > 1 && (
                                    <button
                                      onClick={() =>
                                        setContacts((prev) =>
                                          prev.filter((x) => x.id !== c.id),
                                        )
                                      }
                                      className="text-red-400 hover:text-red-600 p-1"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                      Name
                                    </label>
                                    <input
                                      value={c.name}
                                      disabled={!isEditMode}
                                      onChange={(e) =>
                                        setContacts((prev) =>
                                          prev.map((x) =>
                                            x.id === c.id
                                              ? { ...x, name: e.target.value }
                                              : x,
                                          ),
                                        )
                                      }
                                      className={
                                        isEditMode ? inputEdit : inputView
                                      }
                                      placeholder="Full Name"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                      Role
                                    </label>
                                    <select
                                      value={c.role}
                                      disabled={!isEditMode}
                                      onChange={(e) =>
                                        setContacts((prev) =>
                                          prev.map((x) =>
                                            x.id === c.id
                                              ? { ...x, role: e.target.value }
                                              : x,
                                          ),
                                        )
                                      }
                                      className={
                                        isEditMode ? inputEdit : inputView
                                      }
                                    >
                                      <option>Owner</option>
                                      <option>Tenant</option>
                                      <option>Property Manager</option>
                                      <option>Other</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                      Email
                                    </label>
                                    <input
                                      type="email"
                                      value={c.email}
                                      disabled={!isEditMode}
                                      onChange={(e) =>
                                        setContacts((prev) =>
                                          prev.map((x) =>
                                            x.id === c.id
                                              ? { ...x, email: e.target.value }
                                              : x,
                                          ),
                                        )
                                      }
                                      className={
                                        isEditMode ? inputEdit : inputView
                                      }
                                      placeholder="email@example.com"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                      Phone
                                    </label>
                                    <input
                                      value={c.phone}
                                      disabled={!isEditMode}
                                      onChange={(e) =>
                                        setContacts((prev) =>
                                          prev.map((x) =>
                                            x.id === c.id
                                              ? { ...x, phone: e.target.value }
                                              : x,
                                          ),
                                        )
                                      }
                                      className={
                                        isEditMode ? inputEdit : inputView
                                      }
                                      placeholder="+44 7700 000000"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {activeTab === "addresses" && (
                      <div>
                        <SectionHeader
                          icon={MapPin}
                          title="Site & Billing Addresses"
                          action={
                            <button
                              className="flex items-center gap-1 text-[11px] font-600 text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                if (!isEditMode) setIsEditMode(true);
                                setAddresses((prev) => [
                                  ...prev,
                                  {
                                    id: Date.now(),
                                    type: "Site",
                                    line1: "",
                                    line2: "",
                                    city: "",
                                    postcode: "",
                                    primary: false,
                                  },
                                ]);
                              }}
                            >
                              <Plus size={13} /> Add Address
                            </button>
                          }
                        />
                        {addresses.length === 0 && (
                          <div className="text-center py-10 text-[var(--t4)] text-sm">
                            <MapPin size={28} className="mx-auto mb-2 opacity-30" />
                            No addresses yet. Click <b>Add Address</b> to add one.
                          </div>
                        )}
                        <div className="space-y-4">
                          {addresses.map((addr) => (
                            <div
                              key={addr.id}
                              className="p-4 rounded-xl border border-gray-100 bg-gray-50"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={addr.type}
                                    disabled={!isEditMode}
                                    onChange={(e) =>
                                      setAddresses((prev) =>
                                        prev.map((a) =>
                                          a.id === addr.id
                                            ? { ...a, type: e.target.value }
                                            : a,
                                        ),
                                      )
                                    }
                                    className={`text-[12px] font-700 rounded px-2 py-1 ${isEditMode ? "border border-gray-300 bg-white" : "border-0 bg-transparent text-[var(--t2)]"}`}
                                  >
                                    <option>Site</option>
                                    <option>Billing</option>
                                    <option>Shipping</option>
                                  </select>
                                  {addr.primary && (
                                    <span className="badge badge-blue text-[10px]">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                {isEditMode && addresses.length > 1 && (
                                  <button
                                    onClick={() =>
                                      setAddresses((prev) =>
                                        prev.filter((a) => a.id !== addr.id),
                                      )
                                    }
                                    className="text-red-400 hover:text-red-600 p-1"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { lbl: "Address Line 1", key: "line1" },
                                  { lbl: "Address Line 2", key: "line2" },
                                  { lbl: "City", key: "city" },
                                  { lbl: "State", key: "state" },
                                  { lbl: "Postcode", key: "postcode" },
                                ].map((f) => (
                                  <div key={f.key} className="space-y-1">
                                    <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                      {f.lbl}
                                    </label>
                                    <input
                                      value={(addr as any)[f.key]}
                                      disabled={!isEditMode}
                                      onChange={(e) =>
                                        setAddresses((prev) =>
                                          prev.map((a) =>
                                            a.id === addr.id
                                              ? {
                                                ...a,
                                                [f.key]: e.target.value,
                                              }
                                              : a,
                                          ),
                                        )
                                      }
                                      className={
                                        isEditMode ? inputEdit : inputView
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EQUIPMENT */}
                    {activeTab === "equipment" && (
                      <div>
                        <SectionHeader
                          icon={Wrench}
                          title="Equipment Records"
                          action={
                            isEditMode && (
                              <button
                                className="flex items-center gap-1 text-[11px] font-600 text-blue-600 hover:text-blue-700"
                                onClick={() =>
                                  setEquipment((prev) => [
                                    ...prev,
                                    {
                                      id: Date.now(),
                                      type: "Boiler",
                                      brand: "",
                                      model: "",
                                      serial: "",
                                      install: "",
                                      warranty: "",
                                      manualUrl: "",
                                    },
                                  ])
                                }
                              >
                                <Plus size={13} /> Add Equipment
                              </button>
                            )
                          }
                        />
                        <div className="space-y-4">
                          {equipment.map((eq, idx) => (
                            <div
                              key={eq.id}
                              className="p-4 rounded-xl border border-gray-100 bg-gray-50"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Wrench
                                    size={14}
                                    className="text-[var(--blue-light)]"
                                  />
                                  <span className="font-700 text-sm text-[var(--t1)]">
                                    {eq.brand || eq.model
                                      ? `${eq.brand} ${eq.model}`.trim()
                                      : `Equipment ${idx + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={eq.type}
                                    disabled={!isEditMode}
                                    onChange={(e) =>
                                      setEquipment((prev) =>
                                        prev.map((x) =>
                                          x.id === eq.id
                                            ? { ...x, type: e.target.value }
                                            : x,
                                        ),
                                      )
                                    }
                                    className={`text-[11px] font-600 rounded px-2 py-1 ${isEditMode ? "border border-gray-300 bg-white" : "border-0 bg-transparent text-[var(--t3)]"}`}
                                  >
                                    <option>Boiler</option>
                                    <option>AC Unit</option>
                                    <option>Heat Pump</option>
                                    <option>Electrical Panel</option>
                                    <option>Other</option>
                                  </select>
                                  {isEditMode && (
                                    <button
                                      onClick={() =>
                                        setEquipment((prev) =>
                                          prev.filter((x) => x.id !== eq.id),
                                        )
                                      }
                                      className="text-red-400 hover:text-red-600 p-1"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                {[
                                  { lbl: "Brand", key: "brand" },
                                  { lbl: "Model", key: "model" },
                                ].map((f) => (
                                  <div key={f.key} className="space-y-1">
                                    <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                      {f.lbl}
                                    </label>
                                    <input
                                      value={(eq as any)[f.key]}
                                      disabled={!isEditMode}
                                      onChange={(e) =>
                                        setEquipment((prev) =>
                                          prev.map((x) =>
                                            x.id === eq.id
                                              ? {
                                                ...x,
                                                [f.key]: e.target.value,
                                              }
                                              : x,
                                          ),
                                        )
                                      }
                                      className={
                                        isEditMode ? inputEdit : inputView
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  { lbl: "Serial No.", key: "serial" },
                                  { lbl: "Install Date", key: "install" },
                                  { lbl: "Warranty Until", key: "warranty" },
                                ].map((f) => (
                                  <div key={f.key} className="space-y-1">
                                    <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                      {f.lbl}
                                    </label>
                                    <input
                                      value={(eq as any)[f.key]}
                                      disabled={!isEditMode}
                                      onChange={(e) =>
                                        setEquipment((prev) =>
                                          prev.map((x) =>
                                            x.id === eq.id
                                              ? {
                                                ...x,
                                                [f.key]: e.target.value,
                                              }
                                              : x,
                                          ),
                                        )
                                      }
                                      className={
                                        isEditMode ? inputEdit : inputView
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 space-y-1">
                                <label className="text-[11px] font-600 text-[var(--t4)] uppercase">Manual URL</label>
                                <input
                                  value={eq.manualUrl ?? ''}
                                  disabled={!isEditMode}
                                  placeholder="https://…/manual.pdf"
                                  onChange={(e) =>
                                    setEquipment((prev) =>
                                      prev.map((x) =>
                                        x.id === eq.id ? { ...x, manualUrl: e.target.value } : x,
                                      ),
                                    )
                                  }
                                  className={isEditMode ? inputEdit : inputView}
                                />
                              </div>
                              {customerId && equipmentQuery.data?.some((d: any) => d.id === eq.id) && (
                                <EquipmentConsumables customerId={customerId} equipmentId={eq.id} />
                              )}
                            </div>
                          ))}
                          {equipment.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                              <Wrench
                                size={40}
                                className="text-gray-300 mb-3"
                              />
                              <p className="text-sm font-600 text-[var(--t2)]">
                                No equipment records
                              </p>
                              <p className="text-xs text-[var(--t4)] mt-1">
                                Add boilers, AC units, panels and other
                                installed equipment.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Jobs */}
                    {activeTab === "jobs" && (
                      <div>
                        <SectionHeader
                          icon={ClipboardList}
                          title="Job History"
                        />
                        {/* Quotes for this customer */}
                        {customerQuotes.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-xs font-700 text-gray-500 uppercase mb-3 flex items-center gap-2">
                              <FileText size={14} className="text-green-500" />
                              Quotes ({customerQuotes.length})
                            </h4>
                            <div className="space-y-2">
                              {customerQuotes.map((q) => (
                                <div
                                  key={q.id}
                                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => window.dispatchEvent(new CustomEvent("open-quote-detail", { detail: q }))}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-600 text-gray-900 truncate">{q.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{q.quoteNumber} · {new Date(q.createdAt).toLocaleDateString()}</div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-3">
                                    <span className="text-sm font-700 text-gray-900">{formatMoneyBase(decimalToNumber(q.total))}</span>
                                    <span className={`badge ${QUO_CSS[q.status] ?? "badge-neutral"}`}>{q.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Invoices for this customer */}
                        {customerInvoices.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-xs font-700 text-gray-500 uppercase mb-3 flex items-center gap-2">
                              <FileText size={14} className="text-blue-500" />
                              Invoices ({customerInvoices.length})
                            </h4>
                            <div className="space-y-2">
                              {customerInvoices.map((inv) => (
                                <div
                                  key={inv.id}
                                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => window.dispatchEvent(new CustomEvent("open-invoice-detail", { detail: inv }))}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-600 text-gray-900 truncate">{inv.invoiceNumber}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {inv.dueDate ? `Due ${new Date(inv.dueDate).toLocaleDateString()}` : new Date(inv.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-3">
                                    <div className="text-right">
                                      <span className="text-sm font-700 text-gray-900">{formatMoneyBase(decimalToNumber(inv.total))}</span>
                                      {decimalToNumber(inv.balanceDue) > 0 && (
                                        <div className="text-[10px] text-amber-600">Due: ${decimalToNumber(inv.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                      )}
                                    </div>
                                    <span className={`badge ${INV_CSS[inv.status] ?? "badge-neutral"}`}>{inv.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Jobs for this customer */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold uppercase flex items-center gap-2" style={{ color: 'var(--t4)' }}>
                            <ClipboardList size={14} style={{ color: 'var(--blue)' }} />
                            {customerJobsQuery.isFetching ? 'Jobs' : `Jobs (${customerJobs.length})`}
                          </h4>
                          <button
                            onClick={() => setIsAddJobModalOpen(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer border-0"
                          >
                            <Plus size={12} /> New Job
                          </button>
                        </div>
                        <div className="table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Job</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: "center" }}>View</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customerJobsQuery.isFetching
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} style={{ opacity: 1 - i * 0.15 }}>
                                      <td>
                                        <div style={{ height: 11, borderRadius: 4, background: 'var(--bg-hover)', marginBottom: 5, width: '72%' }} />
                                        <div style={{ height: 9, borderRadius: 3, background: 'var(--bg-hover)', width: '44%', opacity: 0.5 }} />
                                      </td>
                                      <td><div style={{ height: 11, borderRadius: 4, background: 'var(--bg-hover)', width: '62%' }} /></td>
                                      <td><div style={{ height: 20, borderRadius: 6, background: 'var(--bg-hover)', width: 72 }} /></td>
                                      <td style={{ textAlign: 'center' }}><div style={{ height: 28, width: 28, borderRadius: 6, background: 'var(--bg-hover)', margin: '0 auto' }} /></td>
                                    </tr>
                                  ))
                                : customerJobs.map((j) => (
                                    <tr key={j.id}>
                                      <td>
                                        <div className="text-sm font-600" style={{ color: 'var(--t1)' }}>{j.title}</div>
                                        <div className="text-xs" style={{ color: 'var(--t3)' }}>{j.serviceAddress ?? j.customerAddress ?? ""}</div>
                                      </td>
                                      <td className="text-sm" style={{ color: 'var(--t3)' }}>{new Date(j.createdAt).toLocaleDateString()}</td>
                                      <td>
                                        <span className={`badge ${JOB_CSS[j.status] ?? "badge-neutral"}`}>
                                          {j.status.replace(/_/g, " ")}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: "center" }}>
                                        <button
                                          className="p-2 rounded-lg transition-colors"
                                          style={{ color: 'var(--blue)' }}
                                          title="Open Job"
                                          onClick={() => window.dispatchEvent(new CustomEvent("open-job-detail", { detail: j }))}
                                        >
                                          <ExternalLink size={13} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                              }
                              {!customerJobsQuery.isFetching && customerJobs.length === 0 && (
                                <tr>
                                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0', fontSize: 13 }}>No jobs found for this customer</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* PROJECTS — only reachable when the customer has some */}
                    {activeTab === "projects" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {(customerProjects ?? []).map((pr) => {
                          const meta = STATUS_META[pr.status] ?? STATUS_META.PLANNING;
                          return (
                            <button
                              key={pr.id}
                              onClick={() => navigateToProject(`/projects/${pr.id}`)}
                              style={{
                                display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                                padding: "12px 14px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                                background: "var(--bg-card-2, #f8fafc)", border: "1px solid var(--bd, #e2e8f0)",
                              }}
                            >
                              <div style={{
                                width: 34, height: 34, borderRadius: 9, background: meta.dim, flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <FolderKanban size={14} style={{ color: meta.color }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{pr.name}</p>
                                <p style={{ fontSize: 11, color: "var(--t3, #64748b)", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                                  <CalendarRange size={10} />
                                  {pr.startDate ?? "—"} → {pr.targetEndDate ?? "—"}
                                </p>
                              </div>
                              <span style={{
                                fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
                                background: meta.dim, color: meta.color, whiteSpace: "nowrap",
                              }}>
                                {meta.label}
                              </span>
                              <ExternalLink size={12} style={{ color: "var(--t4, #94a3b8)", flexShrink: 0 }} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* AGREEMENTS */}
                    {activeTab === "agreements" && customerId && (
                      <CustomerAgreementsTab
                        customerId={customerId}
                        customerName={`${person.firstName ?? ""} ${person.lastName ?? ""}`.trim()}
                      />
                    )}

                    {/* REVIEWS */}
                    {activeTab === "reviews" && (
                      <div>
                        <div className="flex items-center gap-6 p-4 rounded-xl bg-amber-50 border border-amber-100 mb-5">
                          <div className="text-center">
                            <div className="text-3xl font-800 text-amber-500">
                              {reviews.length > 0
                                ? (
                                  reviews.reduce((s, r) => s + r.rating, 0) /
                                  reviews.length
                                ).toFixed(1)
                                : "—"}
                            </div>
                            <div className="flex gap-0.5 justify-center mt-1">
                              {[1, 2, 3, 4, 5].map((n) => {
                                const avg =
                                  reviews.length > 0
                                    ? reviews.reduce(
                                      (s, r) => s + r.rating,
                                      0,
                                    ) / reviews.length
                                    : 0;
                                return (
                                  <Star
                                    key={n}
                                    size={12}
                                    className={
                                      n <= Math.round(avg)
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-gray-300"
                                    }
                                  />
                                );
                              })}
                            </div>
                            <div className="text-[10px] text-[var(--t4)] mt-1">
                              {reviews.length} reviews
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            {[5, 4, 3, 2, 1].map((n) => {
                              const count = reviews.filter(
                                (r) => r.rating === n,
                              ).length;
                              const pct =
                                reviews.length > 0
                                  ? (count / reviews.length) * 100
                                  : 0;
                              return (
                                <div
                                  key={n}
                                  className="flex items-center gap-2"
                                >
                                  <span className="text-[11px] text-[var(--t4)] w-3">
                                    {n}
                                  </span>
                                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-amber-400 rounded-full transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-[var(--t4)] w-4">
                                    {count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {isEditMode && (
                            <div className="flex flex-col gap-2">
                              <button
                                className="btn btn-primary btn-sm flex items-center justify-center gap-1.5"
                                onClick={() => {
                                  setShowRequestPanel((p) => !p);
                                  setRequestForm((p) => ({
                                    ...p,
                                    email: formData.email || "",
                                  }));
                                }}
                              >
                                <Mail size={12} />{" "}
                                {showRequestPanel
                                  ? "Cancel Request"
                                  : "Request Review"}
                              </button>
                              <button
                                className="btn btn-secondary border-amber-200 text-amber-700 hover:bg-amber-100 btn-sm flex items-center justify-center gap-1.5"
                                onClick={() =>
                                  setReviews((prev) => [
                                    {
                                      id: Date.now(),
                                      rating: 5,
                                      channel: "Google",
                                      date: new Date()
                                        .toISOString()
                                        .split("T")[0],
                                      comment: "",
                                      replied: false,
                                    },
                                    ...prev,
                                  ])
                                }
                              >
                                <Plus size={12} /> Add Manual Review
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Request Review */}
                        {isEditMode && showRequestPanel && (
                          <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
                            <p className="text-[11px] font-700 text-blue-700 uppercase tracking-wider">
                              Send Review Request to Customer
                            </p>
                            <div className="space-y-1">
                              <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                Customer Email
                              </label>
                              <input
                                type="email"
                                value={requestForm.email}
                                placeholder="customer@email.com"
                                onChange={(e) =>
                                  setRequestForm((p) => ({
                                    ...p,
                                    email: e.target.value,
                                  }))
                                }
                                className={inputEdit}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                Message (Optional)
                              </label>
                              <textarea
                                value={requestForm.message}
                                rows={2}
                                placeholder={`Hi ${formData.name || "there"}, we'd love your feedback! Please leave us a review.`}
                                onChange={(e) =>
                                  setRequestForm((p) => ({
                                    ...p,
                                    message: e.target.value,
                                  }))
                                }
                                className={inputEdit}
                                style={{ resize: "none" }}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                disabled={!requestForm.email}
                                className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={() => {
                                  alert(
                                    `Review request sent to ${requestForm.email}`,
                                  );
                                  setShowRequestPanel(false);
                                  setRequestForm({
                                    email: "",
                                    channel: "Google",
                                    message: "",
                                  });
                                }}
                              >
                                <Mail size={12} /> Send Request
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setShowRequestPanel(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        <SectionHeader icon={Star} title="Customer Reviews" />
                        <div className="space-y-4">
                          {reviews.map((rv) => (
                            <div
                              key={rv.id}
                              className="p-4 rounded-xl border border-gray-100 bg-gray-50"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  {/* Star rating picker */}
                                  <div className="flex gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <button
                                        key={n}
                                        disabled={!isEditMode}
                                        onClick={() =>
                                          setReviews((prev) =>
                                            prev.map((x) =>
                                              x.id === rv.id
                                                ? { ...x, rating: n }
                                                : x,
                                            ),
                                          )
                                        }
                                        className={`transition-colors ${isEditMode ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
                                      >
                                        <Star
                                          size={16}
                                          className={
                                            n <= rv.rating
                                              ? "text-amber-400 fill-amber-400"
                                              : "text-gray-300"
                                          }
                                        />
                                      </button>
                                    ))}
                                  </div>
                                  {isEditMode ? (
                                    <textarea
                                      value={rv.comment}
                                      rows={2}
                                      placeholder="Customer review text..."
                                      onChange={(e) =>
                                        setReviews((prev) =>
                                          prev.map((x) =>
                                            x.id === rv.id
                                              ? {
                                                ...x,
                                                comment: e.target.value,
                                              }
                                              : x,
                                          ),
                                        )
                                      }
                                      className={inputEdit}
                                      style={{ resize: "none" }}
                                    />
                                  ) : (
                                    <p className="text-sm text-[var(--t1)]">
                                      {rv.comment ? (
                                        `"${rv.comment}"`
                                      ) : (
                                        <span className="text-[var(--t4)] italic">
                                          No comment yet
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right shrink-0 ml-4 space-y-1">
                                  <div className="text-[11px] text-[var(--t4)]">
                                    {rv.date}
                                  </div>
                                  {isEditMode && (
                                    <button
                                      onClick={() =>
                                        setReviews((prev) =>
                                          prev.filter((x) => x.id !== rv.id),
                                        )
                                      }
                                      className="text-red-400 hover:text-red-600 p-1 block ml-auto"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-gray-200 mt-2">
                                {rv.replied ? (
                                  <div className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-lg">
                                    <span className="text-[11px] text-green-600 font-600 flex items-center gap-1 mb-1">
                                      <CheckCircle2 size={12} /> Replied
                                    </span>
                                    {(rv as any).replyText && (
                                      <p className="text-[12px] text-[var(--t2)] italic">
                                        "{(rv as any).replyText}"
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-full mt-1">
                                    {!(rv as any).showReplyPanel ? (
                                      <button
                                        className="btn btn-secondary btn-sm flex items-center gap-1.5"
                                        onClick={() =>
                                          setReviews((prev) =>
                                            prev.map((x) =>
                                              x.id === rv.id
                                                ? {
                                                  ...x,
                                                  showReplyPanel: true,
                                                  replyText: "",
                                                }
                                                : x,
                                            ),
                                          )
                                        }
                                      >
                                        <MessageSquare size={12} /> Reply
                                      </button>
                                    ) : (
                                      <div className="flex-1 space-y-2">
                                        <textarea
                                          value={(rv as any).replyText || ""}
                                          rows={2}
                                          placeholder="Type your reply to this customer..."
                                          onChange={(e) =>
                                            setReviews((prev) =>
                                              prev.map((x) =>
                                                x.id === rv.id
                                                  ? {
                                                    ...x,
                                                    replyText: e.target.value,
                                                  }
                                                  : x,
                                              ),
                                            )
                                          }
                                          className={inputEdit}
                                          style={{ resize: "none" }}
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            disabled={!(rv as any).replyText}
                                            className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                            onClick={() =>
                                              setReviews((prev) =>
                                                prev.map((x) =>
                                                  x.id === rv.id
                                                    ? {
                                                      ...x,
                                                      replied: true,
                                                      showReplyPanel: false,
                                                    }
                                                    : x,
                                                ),
                                              )
                                            }
                                          >
                                            <CheckCircle2 size={12} /> Submit
                                            Reply
                                          </button>
                                          <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() =>
                                              setReviews((prev) =>
                                                prev.map((x) =>
                                                  x.id === rv.id
                                                    ? {
                                                      ...x,
                                                      showReplyPanel: false,
                                                    }
                                                    : x,
                                                ),
                                              )
                                            }
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {reviews.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                              <Star size={40} className="text-gray-300 mb-3" />
                              <p className="text-sm font-600 text-[var(--t2)]">
                                No reviews yet
                              </p>
                              <p className="text-xs text-[var(--t4)] mt-1">
                                Request a review after job completion to build
                                your reputation.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "reasoning" && (
                      <div className="space-y-5">
                        <SectionHeader icon={FileText} title="Reasoning" />
                        {statusSummaryQuery.isLoading && (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                            <p className="text-sm text-[var(--t1)] font-600">Loading reasoning from customer status signals...</p>
                          </div>
                        )}
                        {statusSummaryQuery.isError && (
                          <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                            <p className="text-sm font-600 text-red-700">Reasoning is unavailable right now.</p>
                            <p className="text-xs text-red-600 mt-1">The status summary endpoint could not be loaded.</p>
                          </div>
                        )}
                        {!statusSummaryQuery.isLoading && !statusSummaryQuery.isError && statusSummaryQuery.data && (() => {
                          const summary = statusSummaryQuery.data;
                          const reasoning = summary.reasoning ?? fallbackReasoning(summary);
                          const upsell = summary.upsellRecommendation;
                          const retention = summary.retentionPrediction;

                          return (
                            <>
                              <div className="grid grid-cols-4 gap-3">
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                  <div className="text-[11px] font-700 text-[var(--t2)] uppercase tracking-wider">Prediction source</div>
                                  <div className="text-sm font-700 text-[var(--t1)] mt-1">Rule-based</div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                  <div className="text-[11px] font-700 text-[var(--t2)] uppercase tracking-wider">Churn risk</div>
                                  <div className="text-sm font-700 mt-1" style={{ color: riskColor(summary.churnPrediction.level) }}>
                                    {summary.churnPrediction.level} ({formatPct(summary.churnPrediction.probability)})
                                  </div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                  <div className="text-[11px] font-700 text-[var(--t2)] uppercase tracking-wider">Failure risk</div>
                                  <div className="text-sm font-700 mt-1" style={{ color: riskColor(summary.failurePrediction.level) }}>
                                    {summary.failurePrediction.level} ({formatPct(summary.failurePrediction.probability)})
                                  </div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                  <div className="text-[11px] font-700 text-[var(--t2)] uppercase tracking-wider">Revenue risk</div>
                                  <div className="text-sm font-700 text-[var(--t1)] mt-1">{formatMoney(summary.revenueRisk)}</div>
                                </div>
                              </div>

                              <ReasoningCard
                                title="Upsell Recommendation"
                                result={upsell ? `${offerLabel(upsell.recommendedOffer)} - ${formatPct(upsell.confidence)} confidence` : "No recommendation"}
                                accent="var(--blue)"
                                details={reasoning.upsellRecommendation}
                              />
                              <ReasoningCard
                                title="Retention Suggestion"
                                result={retention ? `${offerLabel(retention.action)} - ${retention.priority} priority` : "No suggestion"}
                                accent={retention?.priority === "high" ? "var(--red)" : retention?.priority === "medium" ? "var(--amber)" : "var(--green)"}
                                details={reasoning.retentionSuggestion}
                              />
                              <ReasoningCard
                                title="Failure & Churn Prediction"
                                result={`${summary.failurePrediction.level} failure, ${summary.churnPrediction.level} churn`}
                                accent={summary.churnPrediction.level === "High" || summary.failurePrediction.level === "High" ? "var(--red)" : "var(--blue)"}
                                details={reasoning.failureAndChurnPrediction}
                              />
                              <ReasoningCard
                                title="Proposed Next Step"
                                result={summary.proposedNextStep}
                                accent="var(--green)"
                                details={reasoning.proposedNextStep}
                              />
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {activeTab === "iot" && customerId && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Wifi size={15} style={{ color: 'var(--blue-light)' }} />
                          <span className="font-700 text-sm" style={{ color: 'var(--t1)' }}>IoT Devices</span>
                        </div>
                        <IotDevicesTab customerId={customerId} />
                      </div>
                    )}

                    {activeTab === "activity" && (
                      <div>
                        <SectionHeader
                          icon={Activity}
                          title="Activity Timeline"
                        />
                        <div className="relative space-y-5 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                          {activityTimeline.length === 0 ? (
                            <p className="text-sm text-[var(--t4)] text-center py-8">No activity recorded yet.</p>
                          ) : activityTimeline.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div
                                key={item.id}
                                className="relative flex gap-4 pl-1"
                              >
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 z-10"
                                  style={{ background: item.color }}
                                >
                                  <Icon size={14} />
                                </div>
                                <div className="flex-1 p-3 rounded-xl border border-gray-100 bg-gray-50">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-600 text-[var(--t1)]">
                                      {item.label}
                                    </span>
                                    <time className="text-[11px] text-[var(--t4)]">
                                      {item.time}
                                    </time>
                                  </div>
                                  <p className="text-[12px] text-[var(--t3)]">
                                    {item.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddJobModal
        isOpen={isAddJobModalOpen}
        onClose={() => setIsAddJobModalOpen(false)}
        preselectedCustomer={person ? {
          id: person.id,
          name: `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim(),
          address: [person.address, person.city, person.state, person.zipCode].filter(Boolean).join(', '),
        } : undefined}
        onCreated={() => {
          customerJobsQuery.refetch();
        }}
      />
    </>
  );
}
