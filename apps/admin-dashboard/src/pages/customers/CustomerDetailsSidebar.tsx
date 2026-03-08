import React, { useState, useEffect } from "react";
import {
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
} from "lucide-react";
import AddAgreementModal from "./AddAgreementModal";

type TabType =
  | "contact"
  | "addresses"
  | "equipment"
  | "jobs"
  | "agreements"
  | "reviews"
  | "activity";

interface CustomerDetailsSidebarProps {
  person: any | null;
  isOpen: boolean;
  onClose: () => void;
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

const mockAddresses = [
  {
    id: 1,
    type: "Site",
    line1: "14 Elm Street",
    line2: "Flat 3",
    city: "London",
    postcode: "E1 6RF",
    primary: true,
  },
  {
    id: 2,
    type: "Billing",
    line1: "88 King Road",
    line2: "",
    city: "Manchester",
    postcode: "M1 2AB",
    primary: false,
  },
];
const mockContacts = [{ id: 1, name: "", role: "Owner", email: "", phone: "" }];
const mockEquipment = [
  {
    id: 1,
    type: "Boiler",
    brand: "Worcester",
    model: "Greenstar 30i",
    serial: "WB20-1104",
    install: "2021-06-12",
    warranty: "2026-06-12",
  },
  {
    id: 2,
    type: "AC Unit",
    brand: "Daikin",
    model: "Perfera 3.5kW",
    serial: "DK-903A",
    install: "2022-03-01",
    warranty: "2027-03-01",
  },
];
const mockJobs = [
  {
    id: "JOB-1204",
    date: "2026-03-05",
    service: "HVAC Maintenance",
    tech: "Mike Davis",
    status: "completed",
    amount: 385,
  },
  {
    id: "JOB-1188",
    date: "2026-01-18",
    service: "Boiler Service",
    tech: "Tom Baker",
    status: "completed",
    amount: 275,
  },
  {
    id: "JOB-1151",
    date: "2025-11-02",
    service: "AC Installation",
    tech: "Anna Smith",
    status: "invoiced",
    amount: 2400,
  },
];
const mockAgreements = [
  {
    id: "AGR-011",
    name: "Annual Maintenance Plan",
    nextService: "2026-06-15",
    renewal: "2026-12-31",
    status: "active",
    value: 1200,
    pdfUrl: "",
    pdfName: "",
    signatureEmail: "",
    showSignPanel: false,
  },
];
const mockReviews = [
  {
    id: 1,
    rating: 5,
    date: "2026-02-28",
    comment: "Brilliant service! Very professional and punctual.",
    replied: true,
    replyText:
      "Thank you so much! We are glad we could help and look forward to serving you again.",
  },
  {
    id: 2,
    rating: 4,
    date: "2025-12-10",
    comment: "Good work, would recommend.",
    replied: false,
  },
];
const mockTimeline = [
  {
    id: 1,
    icon: Plus,
    color: "#3B82F6",
    label: "Lead Created",
    desc: "Added manually by Super Admin.",
    time: "Mar 1, 2026",
  },
  {
    id: 2,
    icon: Mail,
    color: "#10B981",
    label: "Email Sent",
    desc: "Follow-up email sent via system.",
    time: "Mar 2, 2026",
  },
  {
    id: 3,
    icon: CheckCircle2,
    color: "#8B5CF6",
    label: "Converted to Customer",
    desc: "Lead status changed to WON.",
    time: "Mar 4, 2026",
  },
  {
    id: 4,
    icon: Wrench,
    color: "#F59E0B",
    label: "Job Completed",
    desc: "JOB-1204 HVAC Maintenance completed.",
    time: "Mar 5, 2026",
  },
];

const JOB_CSS: Record<string, string> = {
  completed: "badge-green",
  invoiced: "badge-cyan",
  in_progress: "badge-blue",
  pending: "badge-amber",
  cancelled: "badge-red",
};

export default function CustomerDetailsSidebar({
  person,
  isOpen,
  onClose,
  initialTab = "contact",
}: CustomerDetailsSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [addresses, setAddresses] = useState(mockAddresses);
  const [contacts, setContacts] = useState(mockContacts);
  const [equipment, setEquipment] = useState(mockEquipment);
  const [agreements, setAgreements] = useState(mockAgreements);
  const [isAddAgreementModalOpen, setIsAddAgreementModalOpen] = useState(false);
  const [reviews, setReviews] = useState(mockReviews);
  const [showRequestPanel, setShowRequestPanel] = useState(false);
  const [requestForm, setRequestForm] = useState({
    email: "",
    channel: "Google",
    message: "",
  });

  useEffect(() => {
    if (isOpen && person) {
      document.body.style.overflow = "hidden";
      setFormData({ ...person });
      setContacts([
        {
          id: 1,
          name: person.name || "",
          role: "Owner",
          email: person.email || "",
          phone: person.phone || person.whatsappNo || "",
        },
      ]);
      setAddresses(mockAddresses);
      setEquipment(mockEquipment);
      setAgreements(mockAgreements);
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

  if (!isOpen || !person) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => setIsEditMode(false);

  const stages = [
    { name: "New", status: person.status === "NEW" ? "active" : "completed" },
    {
      name: "Contacted",
      status:
        person.status === "CONTACTED"
          ? "active"
          : person.status === "NEW"
            ? "pending"
            : "completed",
    },
    {
      name: "Qualified",
      status: person.status === "QUALIFIED" ? "active" : "pending",
    },
    {
      name: "Proposal",
      status: person.status === "PROPOSAL_SENT" ? "active" : "pending",
    },
    { name: "Won", status: person.status === "WON" ? "active" : "pending" },
  ];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "contact", label: "Contact", icon: <User size={14} /> },
    { id: "addresses", label: "Addresses", icon: <MapPin size={14} /> },
    { id: "equipment", label: "Equipment", icon: <Wrench size={14} /> },
    { id: "jobs", label: "Jobs", icon: <ClipboardList size={14} /> },
    { id: "agreements", label: "Agreements", icon: <ShieldCheck size={14} /> },
    { id: "reviews", label: "Reviews", icon: <Star size={14} /> },
    { id: "activity", label: "Activity", icon: <Activity size={14} /> },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[200] transition-opacity"
        onClick={onClose}
      />
      <div
        className="fixed top-0 bottom-0 right-0 w-3/4 z-[210] flex flex-col shadow-2xl transition-transform transform duration-300 translate-x-0 border-l border-gray-200"
        style={{ background: "#ffffff" }}
      >
        <div className="sticky top-0 bg-[var(--blue)] px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="text-white">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">
                {formData.name || "Details"}
              </h2>
              <select
                value={formData.status || "Active"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                disabled={!isEditMode}
                className={`bg-white text-gray-900 text-xs px-2 py-1 rounded-md outline-none h-[28px] ${!isEditMode ? "opacity-90 cursor-default" : "cursor-pointer"}`}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
                  className="flex flex-row items-center justify-center gap-2 bg-white text-[var(--blue)] hover:bg-blue-50 px-5 py-1.5 rounded-lg text-sm font-semibold transition-all"
                >
                  <Save size={14} /> Save
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
          style={{ background: "#f3f4f6" }}
        >
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Panel */}
              <div className="col-span-3 space-y-4">
                <div
                  className="rounded-xl border border-gray-200 p-5 shadow-sm"
                  style={{ background: "#ffffff" }}
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
                  style={{ background: "#ffffff" }}
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
                  style={{ background: "#ffffff" }}
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
                        {formData.status || "Active"}
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
                  style={{ background: "#ffffff" }}
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
                        $14,250
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-600 text-[var(--t4)] uppercase tracking-wider mb-1">
                        YTD Revenue
                      </p>
                      <div className="text-sm font-medium text-[var(--t2)]">
                        $3,400
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-600 text-[var(--t4)] uppercase tracking-wider mb-1">
                        Outstanding Balance
                      </p>
                      <div className="text-sm font-medium text-red-500">
                        $0.00
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
                    "QUALIFIED",
                    "PROPOSAL_SENT",
                    "WON",
                  ].includes(formData.status) && (
                    <div
                      className="rounded-xl border border-gray-200 p-5 shadow-sm"
                      style={{ background: "#ffffff" }}
                    >
                      <div className="relative pt-2 pb-1">
                        <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-gray-300" />
                        <div className="relative z-10 flex justify-between">
                          {stages.map((stage, i) => (
                            <div
                              key={i}
                              className="flex flex-col items-center gap-2 px-2"
                              style={{ background: "#ffffff" }}
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
                  style={{ background: "#ffffff", minHeight: 560 }}
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
                        {tab.icon} {tab.label}{" "}
                        {tab.id === "jobs" && (
                          <span className="text-red-500 ml-0.5">
                            {mockJobs.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div
                    className="flex-1 overflow-y-auto p-6"
                    style={{ background: "#ffffff" }}
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
                              label="WhatsApp"
                              name="whatsappNo"
                              value={formData.whatsappNo}
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
                              name="remarks"
                              value={formData.remarks}
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

                    {/* Address */}
                    {activeTab === "addresses" && (
                      <div>
                        <SectionHeader
                          icon={MapPin}
                          title="Site & Billing Addresses"
                          action={
                            isEditMode && (
                              <button
                                className="flex items-center gap-1 text-[11px] font-600 text-blue-600 hover:text-blue-700"
                                onClick={() =>
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
                                  ])
                                }
                              >
                                <Plus size={13} /> Add Address
                              </button>
                            )
                          }
                        />
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
                        <div className="table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Job ID</th>
                                <th>Date</th>
                                <th>Service</th>
                                <th>Technician</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th style={{ textAlign: "center" }}>View</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mockJobs.map((j) => (
                                <tr key={j.id}>
                                  <td>
                                    <span className="td-mono td-primary">
                                      {j.id}
                                    </span>
                                  </td>
                                  <td className="text-sm text-3">{j.date}</td>
                                  <td className="text-sm">{j.service}</td>
                                  <td className="text-sm text-2">{j.tech}</td>
                                  <td className="td-primary font-600">
                                    ${j.amount}
                                  </td>
                                  <td>
                                    <span
                                      className={`badge ${JOB_CSS[j.status]}`}
                                    >
                                      {j.status}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <button
                                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                      title="Open Job"
                                    >
                                      <ExternalLink size={13} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* AGREEMENTS */}
                    {activeTab === "agreements" && (
                      <div>
                        <SectionHeader
                          icon={ShieldCheck}
                          title="Service Agreements & Contracts"
                          action={
                            isEditMode && (
                              <button
                                className="btn btn-secondary border-dashed btn-sm flex items-center gap-1.5"
                                onClick={() => setIsAddAgreementModalOpen(true)}
                              >
                                <Plus size={13} /> New Agreement
                              </button>
                            )
                          }
                        />
                        {agreements.map((agr) => (
                          <div
                            key={agr.id}
                            className="p-5 rounded-xl border border-gray-100 bg-gray-50 mb-4"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 mr-3">
                                <div className="space-y-1 mb-1">
                                  <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                    Agreement Name
                                  </label>
                                  <input
                                    value={agr.name}
                                    disabled={!isEditMode}
                                    placeholder={
                                      isEditMode
                                        ? "e.g. Annual Maintenance Plan"
                                        : ""
                                    }
                                    onChange={(e) =>
                                      setAgreements((prev) =>
                                        prev.map((x) =>
                                          x.id === agr.id
                                            ? { ...x, name: e.target.value }
                                            : x,
                                        ),
                                      )
                                    }
                                    className={
                                      isEditMode ? inputEdit : inputView
                                    }
                                  />
                                </div>
                                <div className="text-[11px] text-[var(--t3)]">
                                  {agr.id}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <select
                                  value={agr.status}
                                  disabled={!isEditMode}
                                  onChange={(e) =>
                                    setAgreements((prev) =>
                                      prev.map((x) =>
                                        x.id === agr.id
                                          ? { ...x, status: e.target.value }
                                          : x,
                                      ),
                                    )
                                  }
                                  className={`text-[11px] font-600 rounded px-2 py-1 ${isEditMode ? "border border-gray-300 bg-white" : "border-0 bg-transparent"}`}
                                  style={{
                                    color:
                                      agr.status === "active"
                                        ? "var(--green)"
                                        : agr.status === "pending"
                                          ? "#d97706"
                                          : "#ef4444",
                                  }}
                                >
                                  <option value="active">Active</option>
                                  <option value="pending">Pending</option>
                                  <option value="expired">Expired</option>
                                </select>
                                {isEditMode && (
                                  <button
                                    onClick={() =>
                                      setAgreements((prev) =>
                                        prev.filter((x) => x.id !== agr.id),
                                      )
                                    }
                                    className="text-red-400 hover:text-red-600 p-1"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {[
                                {
                                  lbl: "Next Service",
                                  key: "nextService",
                                  placeholder: "YYYY-MM-DD",
                                },
                                {
                                  lbl: "Renewal Date",
                                  key: "renewal",
                                  placeholder: "YYYY-MM-DD",
                                },
                                {
                                  lbl: "Annual Value ($)",
                                  key: "value",
                                  placeholder: "0",
                                },
                              ].map((f) => (
                                <div key={f.key} className="space-y-1">
                                  <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                    {f.lbl}
                                  </label>
                                  <input
                                    value={(agr as any)[f.key]}
                                    disabled={!isEditMode}
                                    placeholder={
                                      isEditMode ? f.placeholder : ""
                                    }
                                    onChange={(e) =>
                                      setAgreements((prev) =>
                                        prev.map((x) =>
                                          x.id === agr.id
                                            ? { ...x, [f.key]: e.target.value }
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
                            <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                              {/* Upload zone */}
                              {isEditMode && (
                                <div>
                                  <label className="text-[11px] font-600 text-[var(--t4)] uppercase block mb-1.5">
                                    Agreement Document (PDF)
                                  </label>
                                  <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors">
                                    <FileText
                                      size={18}
                                      className="text-blue-500 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      {agr.pdfName ? (
                                        <span className="text-sm font-600 text-blue-600 truncate block">
                                          {agr.pdfName}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-[var(--t3)]">
                                          Click to upload PDF document
                                        </span>
                                      )}
                                      <span className="text-[10px] text-[var(--t4)]">
                                        PDF, max 10MB
                                      </span>
                                    </div>
                                    {agr.pdfName && (
                                      <CheckCircle2
                                        size={16}
                                        className="text-green-500 shrink-0"
                                      />
                                    )}
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const url = URL.createObjectURL(file);
                                        setAgreements((prev) =>
                                          prev.map((x) =>
                                            x.id === agr.id
                                              ? {
                                                ...x,
                                                pdfUrl: url,
                                                pdfName: file.name,
                                              }
                                              : x,
                                          ),
                                        );
                                      }}
                                    />
                                  </label>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {agr.pdfUrl ? (
                                  <a
                                    href={agr.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm flex items-center gap-1.5"
                                  >
                                    <FileText size={12} /> View PDF
                                  </a>
                                ) : (
                                  <span
                                    className="btn btn-secondary btn-sm flex items-center gap-1.5 opacity-40 cursor-not-allowed"
                                    title="Upload a PDF first"
                                  >
                                    <FileText size={12} /> View PDF
                                  </span>
                                )}
                                <button
                                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                                  onClick={() =>
                                    setAgreements((prev) =>
                                      prev.map((x) =>
                                        x.id === agr.id
                                          ? {
                                            ...x,
                                            showSignPanel: !x.showSignPanel,
                                          }
                                          : x,
                                      ),
                                    )
                                  }
                                >
                                  <ShieldCheck size={12} />
                                  {(agr as any).showSignPanel
                                    ? "Cancel"
                                    : "Send for Signature"}
                                </button>
                              </div>

                              {/* Signature send panel */}
                              {(agr as any).showSignPanel && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
                                  <p className="text-[11px] font-700 text-blue-700 uppercase tracking-wider">
                                    Send Agreement for e-Signature
                                  </p>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-600 text-[var(--t4)] uppercase">
                                      Recipient Email
                                    </label>
                                    <input
                                      type="email"
                                      value={(agr as any).signatureEmail || ""}
                                      placeholder="customer@email.com"
                                      onChange={(e) =>
                                        setAgreements((prev) =>
                                          prev.map((x) =>
                                            x.id === agr.id
                                              ? {
                                                ...x,
                                                signatureEmail:
                                                  e.target.value,
                                              }
                                              : x,
                                          ),
                                        )
                                      }
                                      className={inputEdit}
                                    />
                                  </div>
                                  {!agr.pdfUrl && (
                                    <p className="text-[11px] text-amber-600 flex items-center gap-1">
                                      ⚠️ Please upload a PDF document before
                                      sending.
                                    </p>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      disabled={
                                        !(agr as any).signatureEmail ||
                                        !agr.pdfUrl
                                      }
                                      className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                      onClick={() => {
                                        alert(
                                          `Signature request sent to ${(agr as any).signatureEmail}`,
                                        );
                                        setAgreements((prev) =>
                                          prev.map((x) =>
                                            x.id === agr.id
                                              ? {
                                                ...x,
                                                showSignPanel: false,
                                                status: "pending",
                                              }
                                              : x,
                                          ),
                                        );
                                      }}
                                    >
                                      <Mail size={12} /> Send Now
                                    </button>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() =>
                                        setAgreements((prev) =>
                                          prev.map((x) =>
                                            x.id === agr.id
                                              ? { ...x, showSignPanel: false }
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
                          </div>
                        ))}
                        {agreements.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-16 text-center">
                            <ShieldCheck
                              size={40}
                              className="text-gray-300 mb-3"
                            />
                            <p className="text-sm font-600 text-[var(--t2)]">
                              No agreements yet
                            </p>
                            <p className="text-xs text-[var(--t4)] mt-1">
                              Create a maintenance contract or service plan.
                            </p>
                          </div>
                        )}
                      </div>
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

                    {activeTab === "activity" && (
                      <div>
                        <SectionHeader
                          icon={Activity}
                          title="Activity Timeline"
                        />
                        <div className="relative space-y-5 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                          {mockTimeline.map((item) => {
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

      <AddAgreementModal
        isOpen={isAddAgreementModalOpen}
        onClose={() => setIsAddAgreementModalOpen(false)}
        onCreated={(newAgr) => {
          setAgreements((prev) => [newAgr, ...prev]);
        }}
      />
    </>
  );
}
