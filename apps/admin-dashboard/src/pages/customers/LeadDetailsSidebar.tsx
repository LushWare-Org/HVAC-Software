import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Plus,
  Activity,
  FileText,
  TrendingUp,
  ShieldCheck,
  Save,
  Edit2,
  User,
  Users,
  Wrench,
  Trash2,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useUpdateLead } from "../../hooks/useCustomers";
import { useLeadAddresses, useSaveLeadAddresses } from "../../hooks/useAddresses";
import type { Lead } from "../../types/api";
import { computeLeadStatusSummary, formatLeadPct, leadConversionColor, leadRiskColor } from "./leadInsights";

type TabType = "contact" | "addresses" | "activity" | "reasoning";

interface LeadDetailsSidebarProps {
  person: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onConverted?: (customerId: string) => void;
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

function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
      <div className="grid gap-3">
        <div>
          <div className="text-[11px] font-700 text-[var(--t4)] uppercase tracking-wider mb-1">Rule-based signals</div>
          <p className="text-sm text-[var(--t2)] leading-relaxed">{details.ruleBased}</p>
        </div>
        <div>
          <div className="text-[11px] font-700 text-[var(--t4)] uppercase tracking-wider mb-1">Prediction result</div>
          <p className="text-sm text-[var(--t2)] leading-relaxed">{details.mlResult}</p>
        </div>
        <div>
          <div className="text-[11px] font-700 text-[var(--t4)] uppercase tracking-wider mb-1">AI explanation</div>
          <p className="text-sm text-[var(--t2)] leading-relaxed">{details.aiExplanation}</p>
        </div>
      </div>
    </div>
  );
}

const mockContacts = [{ id: 1, name: "", role: "Owner", email: "", phone: "" }];
export default function LeadDetailsSidebar({
  person,
  isOpen,
  onClose,
  onConverted,
}: LeadDetailsSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("contact");
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [convertedCustomerId, setConvertedCustomerId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [contacts, setContacts] = useState(mockContacts);
  const [_error, setError] = useState("");
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const { showSuccess, showError } = useToast();
  const updateLead = useUpdateLead();

  // Fetch real addresses from API
  const leadId = person?.id ?? "";
  const addressesQuery = useLeadAddresses(leadId || undefined);
  const saveAddresses = useSaveLeadAddresses();

  const displayName = person ? `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || "Unknown" : "";

  useEffect(() => {
    if (isOpen && person) {
      document.body.style.overflow = "hidden";
      setFormData({
        ...person,
        name: displayName,
      });
      setContacts([
        {
          id: 1,
          name: displayName,
          role: "Owner",
          email: person.email || "",
          phone: person.phone || "",
        },
      ]);
      setActiveTab("contact");
      setIsEditMode(false);
      setError("");
      setConvertedCustomerId(null);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, person]);

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
    setError("");
    const nameParts = (formData.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    updateLead.mutate(
      {
        id: person.id,
        data: {
          firstName,
          lastName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          whatsappNo: formData.whatsappNo || undefined,
          type: formData.type || undefined,
          status: formData.status || undefined,
          source: formData.source || undefined,
          serviceInterest: formData.serviceInterest || formData.service || undefined,
          notes: formData.notes || undefined,
        },
      },
      {
        onSuccess: (data: any) => {
          if (formData.status === 'WON' && data?.customerId) {
            setConvertedCustomerId(data.customerId);
            onConverted?.(data.customerId);
          }
          // Also save addresses if any exist or were modified
          if (addresses.length > 0 || (addressesQuery.data && addressesQuery.data.length > 0)) {
            saveAddresses.mutate({
              leadId: person.id,
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
          setIsEditMode(false);
          setSaveSucceeded(true);
          setTimeout(() => setSaveSucceeded(false), 2000);
          showSuccess('Lead details saved.');
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? 'Failed to update lead.';
          setError(msg);
          showError(msg, 'Save failed');
        },
      },
    );
  };

  // Real activity timeline derived from the actual record — no DB activity log yet
  const activityTimeline = (() => {
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const events: Array<{ id: string; icon: any; color: string; label: string; desc: string; time: string }> = [];
    events.push({
      id: 'created', icon: Plus, color: '#3B82F6',
      label: 'Lead Created',
      desc: person.source ? `Lead added via ${person.source}.` : 'Lead added manually.',
      time: fmt(person.createdAt),
    });
    if (person.status && person.status !== 'NEW') {
      events.push({
        id: 'status', icon: CheckCircle2, color: '#10B981',
        label: `Status: ${person.status.replace(/_/g, ' ')}`,
        desc: 'Lead status updated.',
        time: fmt(person.updatedAt),
      });
    }
    if ((person as any).convertedAt) {
      events.push({
        id: 'won', icon: Users, color: '#8B5CF6',
        label: 'Won / Converted',
        desc: 'Lead marked as won and converted to customer.',
        time: fmt((person as any).convertedAt),
      });
    }
    return events;
  })();

  const ORDER = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];
  const currentIdx = ORDER.indexOf(formData.status || "NEW");
  const isLost = formData.status === "LOST";

  const stages = [
    {
      name: "New",
      status: currentIdx > 0 ? "completed" : currentIdx === 0 ? "active" : "pending",
    },
    {
      name: "Contacted",
      status: currentIdx > 1 ? "completed" : currentIdx === 1 ? "active" : "pending",
    },
    {
      name: "Qualified",
      status: currentIdx > 2 ? "completed" : currentIdx === 2 ? "active" : "pending",
    },
    {
      name: "Won",
      status: isLost ? "pending" : currentIdx === 3 ? "active" : currentIdx > 3 ? "completed" : "pending",
    },
  ];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "contact", label: "Contact", icon: <User size={14} /> },
    { id: "addresses", label: "Addresses", icon: <MapPin size={14} /> },
    { id: "activity", label: "Activity", icon: <Activity size={14} /> },
    { id: "reasoning", label: "Reasoning", icon: <FileText size={14} /> },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[200] transition-opacity"
        onClick={onClose}
      />
      <div
        className="fixed top-0 bottom-0 right-0 w-3/4 z-[210] flex flex-col shadow-2xl transition-transform transform duration-300 translate-x-0 border-l border-gray-200"
        style={{ background: "var(--bg-card)" }}
      >        <div className="sticky top-0 bg-[var(--blue)] px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="text-white">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">
                {formData.name || "Details"}
              </h2>
              <select
                value={formData.status || "NEW"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                disabled={!isEditMode}
                className={`bg-white text-gray-900 text-xs px-2 py-1 rounded-md outline-none h-[28px] ${!isEditMode ? "opacity-90 cursor-default" : "cursor-pointer"}`}
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
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
                  Created Date
                </span>
                <input
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
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
                  disabled={updateLead.isPending}
                  className="flex flex-row items-center justify-center gap-2 px-5 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: saveSucceeded ? '#10b981' : 'white',
                    color: saveSucceeded ? 'white' : 'var(--blue)',
                    opacity: updateLead.isPending ? 0.8 : 1,
                    cursor: updateLead.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updateLead.isPending ? (
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

        {/* Conversion success banner */}
        {convertedCustomerId && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="text-sm font-semibold">Lead converted to customer successfully!</span>
            </div>
            <button
              onClick={() => onConverted?.(convertedCustomerId)}
              className="text-sm font-semibold text-green-700 border border-green-300 bg-white hover:bg-green-50 px-3 py-1 rounded-lg transition-colors"
            >
              View Customer →
            </button>
          </div>
        )}

        {/* Lost banner */}
        {formData.status === 'LOST' && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-2 shrink-0">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm font-medium text-red-700">This lead has been marked as lost.</span>
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left */}
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
                        {formData.phone || formData.whatsappNo || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={14} className="text-[var(--t4)] shrink-0" />
                      <span className="text-sm text-[var(--t2)]">
                        {formData.city || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Wrench size={14} className="text-[var(--t4)] shrink-0" />
                      <span className="text-sm text-[var(--t2)]">
                        {formData.service || "General Inquiry"}
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
                        {formData.status
                          ? formData.status.replace("_", " ")
                          : "NEW"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="col-span-9 space-y-4">
                {formData.status &&
                  [
                    "NEW",
                    "CONTACTED",
                    "PROPOSAL_SENT",
                    "QUOTATION_SENT",
                    "WON",
                    "REJECTED",
                  ].includes(formData.status) && (
                    <div
                      className="rounded-xl border border-gray-200 p-5 shadow-sm"
                      style={{ background: "var(--bg-card)" }}
                    >
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

                {/* Tab */}
                <div
                  className="rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                  style={{ background: "var(--bg-card)", minHeight: 560 }}
                >
                  <div
                    className="border-b border-gray-200 flex overflow-x-auto shrink-0 px-2 pt-2"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-center gap-1.5 px-4 py-3 text-[12px] font-600 whitespace-nowrap transition-all border-b-[3px] bg-transparent cursor-pointer hover:bg-gray-50 rounded-t-lg ml-1 ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
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
                              value={formData.phone || formData.whatsappNo}
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
                                "Residential",
                                "Commercial",
                                "Industrial",
                                "Property Management",
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

                    {/* ADDRESSES */}
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

                    {/* ACTIVITY */}
                    {activeTab === "activity" && (
                      <div>
                        <SectionHeader
                          icon={Activity}
                          title="Activity Timeline"
                        />
                        <div className="relative space-y-5 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                          {activityTimeline.map((item) => {
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

                    {/* REASONING */}
                    {activeTab === "reasoning" && (() => {
                      const summary = computeLeadStatusSummary(person);
                      return (
                        <div className="space-y-5">
                          <SectionHeader icon={FileText} title="Reasoning" />
                          <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                              <div className="flex items-center gap-2 text-[11px] font-700 text-[var(--t4)] uppercase tracking-wider">
                                <TrendingUp size={14} /> Conversion
                              </div>
                              <div className="text-sm font-700 mt-1" style={{ color: leadConversionColor(summary.conversionPrediction.level) }}>
                                {summary.conversionPrediction.level} ({formatLeadPct(summary.conversionPrediction.probability)})
                              </div>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                              <div className="flex items-center gap-2 text-[11px] font-700 text-[var(--t4)] uppercase tracking-wider">
                                <ShieldCheck size={14} /> Risk
                              </div>
                              <div className="text-sm font-700 mt-1" style={{ color: leadRiskColor(summary.riskPrediction.level) }}>
                                {summary.riskPrediction.level} ({formatLeadPct(summary.riskPrediction.probability)})
                              </div>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                              <div className="text-[11px] font-700 text-[var(--t4)] uppercase tracking-wider">Next action</div>
                              <div className="text-sm font-700 text-[var(--t1)] mt-1">{titleCase(summary.recommendedAction.action)}</div>
                            </div>
                          </div>

                          <ReasoningCard
                            title="Lead Conversion Prediction"
                            result={`${summary.conversionPrediction.level} likelihood - ${formatLeadPct(summary.conversionPrediction.probability)}`}
                            accent={leadConversionColor(summary.conversionPrediction.level)}
                            details={summary.reasoning.leadConversion}
                          />
                          <ReasoningCard
                            title="Risk Prediction"
                            result={`${summary.riskPrediction.level} risk - ${formatLeadPct(summary.riskPrediction.probability)}`}
                            accent={leadRiskColor(summary.riskPrediction.level)}
                            details={summary.reasoning.riskPrediction}
                          />
                          <ReasoningCard
                            title="Individual Recommendation"
                            result={`${titleCase(summary.recommendedAction.action)} - ${summary.recommendedAction.priority} priority`}
                            accent={summary.recommendedAction.priority === "high" ? "var(--red)" : summary.recommendedAction.priority === "medium" ? "var(--amber)" : "var(--green)"}
                            details={summary.reasoning.recommendation}
                          />
                          <ReasoningCard
                            title="Proposed Next Step"
                            result={summary.proposedNextStep}
                            accent="var(--blue)"
                            details={summary.reasoning.proposedNextStep}
                          />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
