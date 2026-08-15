import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Wrench, Hammer, PackagePlus, Search, AlertTriangle, Calendar, Loader2, AlertCircle, Link2, Lock, FolderKanban, Home } from "lucide-react";
import { useCreateJob } from "../../hooks/useJobs";
import { useCustomers } from "../../hooks/useCustomers";
import { useCustomerEquipment } from "../../hooks/useEquipment";
import MapPicker from "../../components/MapPickerLazy";
import ProjectJobLinkPicker, { type ProjectJobLink } from "../../components/ProjectJobLinkPicker";
import { useComponents } from "../projects/componentsApi";
import type { ProjectTemplateType, ComponentTypeMeta } from "../projects/projectsApi";

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (job: any) => void;
  preselectedCustomer?: { id: string; name: string; address?: string };
  /** Locks the customer to a fixed record (e.g. a house owner) — shown as a non-editable chip instead of the search/select. */
  lockedCustomer?: { id: string; name: string; address?: string; lat?: number; lng?: number };
  /** Locks the job to this project — hides the project picker and shows a fixed chip instead. */
  lockedProject?: { id: string; name: string; templateType?: ProjectTemplateType; templateId?: string | null; componentTypesSnapshot?: ComponentTypeMeta[] | null };
  /** Narrows a locked templated project down to one component (hides the "which component?" picker). */
  lockedComponentId?: string;
  lockedComponentLabel?: string;
  /** Locks the job to one specific piece of equipment — hides the equipment picker. */
  lockedEquipmentId?: string;
  lockedEquipmentLabel?: string;
  /** Extra context shown under the title, e.g. the project/house name. */
  contextLabel?: string;
}

type TabType = "basic" | "scheduling";

// Same service-type taxonomy as the customer portal's "Request a service" modal
// (BookServiceModal) — keeps the vocabulary customers and admins see in sync.
const SERVICE_TYPES: { value: string; label: string; icon: React.ElementType; danger?: boolean }[] = [
  { value: "Maintenance", label: "Maintenance", icon: Wrench },
  { value: "Repair", label: "Repair", icon: Hammer },
  { value: "Installation", label: "Installation", icon: PackagePlus },
  { value: "Inspection", label: "Inspection", icon: Search },
  { value: "Emergency", label: "Emergency", icon: AlertTriangle, danger: true },
];

export default function AddJobModal({
  isOpen,
  onClose,
  onCreated,
  preselectedCustomer,
  lockedCustomer,
  lockedProject,
  lockedComponentId,
  lockedComponentLabel,
  lockedEquipmentId,
  lockedEquipmentLabel,
  contextLabel,
}: AddJobModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [error, setError]         = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [projectLink, setProjectLink] = useState<ProjectJobLink>({});
  const [equipmentId, setEquipmentId] = useState('');
  const [formData, setFormData]   = useState({
    title: "",
    description: "",
    priority: "NORMAL",
    serviceType: "Maintenance",
    customerId: lockedCustomer?.id ?? "",
    customerName: lockedCustomer?.name ?? "",
    serviceAddress: lockedCustomer?.address ?? "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    lat: lockedCustomer?.lat ?? 6.9271,
    lng: lockedCustomer?.lng ?? 79.8612,
  });

  // Templated project locked without a specific component — offer a lightweight
  // "which component?" narrow-down, same idea as ProjectJobLinkPicker's cascading select.
  const showComponentSelect = lockedProject?.componentTypesSnapshot != null && !lockedComponentId;
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const lockedComponentsQuery = useComponents(showComponentSelect ? lockedProject!.id : undefined);

  const createJob = useCreateJob();
  const customersQuery = useCustomers({ page: 1, limit: 50, search: customerSearch || undefined });
  const customers = customersQuery.data?.data ?? [];
  const equipmentQuery = useCustomerEquipment(!lockedEquipmentId ? (formData.customerId || undefined) : undefined);
  const customerEquipment = equipmentQuery.data ?? [];
  const selectedEquipment = customerEquipment.find((eq) => eq.id === equipmentId);

  // Pre-fill customer when opened from customer detail
  useEffect(() => {
    if (isOpen && preselectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerId: preselectedCustomer.id,
        customerName: preselectedCustomer.name,
        serviceAddress: preselectedCustomer.address || prev.serviceAddress,
      }));
    }
  }, [isOpen, preselectedCustomer]);

  // Re-seed the locked customer each time the modal opens (props may change between opens)
  useEffect(() => {
    if (isOpen && lockedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerId: lockedCustomer.id,
        customerName: lockedCustomer.name,
        serviceAddress: lockedCustomer.address || prev.serviceAddress,
        lat: lockedCustomer.lat ?? prev.lat,
        lng: lockedCustomer.lng ?? prev.lng,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lockedCustomer?.id]);

  // Lock the dashboard behind the modal — without this, wheel/trackpad input
  // over the backdrop scrolls the page underneath instead of staying put.
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isOpen]);

  // Escape closes — standard modal affordance
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceTypeSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceType: value,
      // Emergency jumps priority automatically, mirroring the portal wizard — still overridable below.
      priority: value === "Emergency" ? "EMERGENCY" : prev.priority === "EMERGENCY" ? "NORMAL" : prev.priority,
    }));
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setEquipmentId(''); // equipment belongs to the previous customer — clear on switch
    if (!id) {
      setFormData(prev => ({ ...prev, customerId: '', customerName: '', serviceAddress: '' }));
      return;
    }
    const c = customers.find((c: any) => c.id === id);
    if (c) {
      const name = `${c.firstName} ${c.lastName}`.trim();
      const addr = [c.address, c.city, c.state, c.zipCode].filter(Boolean).join(', ');
      setFormData(prev => ({ ...prev, customerId: c.id, customerName: name, serviceAddress: addr || 'N/A' }));
    }
  };

  const handleSubmit = () => {
    setError('');

    if (!formData.title.trim()) {
      setError('Job title is required.');
      return;
    }
    if (!formData.customerId) {
      setError('Please select a customer.');
      return;
    }
    if (!formData.serviceAddress.trim()) {
      setError('Service address is required.');
      return;
    }

    // Build scheduledStart ISO string
    let scheduledStart: string | undefined;
    if (formData.date) {
      const dt = new Date(`${formData.date}T${formData.time || '09:00'}:00`);
      if (!isNaN(dt.getTime())) scheduledStart = dt.toISOString();
    }

    createJob.mutate(
      {
        title:              formData.title.trim(),
        description:        formData.description.trim() || undefined,
        priority:           formData.priority.toUpperCase() as any,
        tags:               [formData.serviceType.toLowerCase()],
        customerId:         formData.customerId,
        customerName:       formData.customerName,
        serviceAddress:     formData.serviceAddress,
        scheduledStart,
        serviceLatitude:    formData.lat,
        serviceLongitude:   formData.lng,
        projectId:          lockedProject?.id ?? projectLink.projectId ?? undefined,
        componentId:        lockedComponentId ?? projectLink.componentId ?? selectedComponentId ?? undefined,
        equipmentId:        lockedEquipmentId ?? equipmentId ?? undefined,
      } as any,
      {
        onSuccess: (newJob) => {
          onCreated?.(newJob);
          onClose();
          setFormData({
            title: "",
            description: "",
            priority: "NORMAL",
            serviceType: "Maintenance",
            customerId: lockedCustomer?.id ?? "",
            customerName: lockedCustomer?.name ?? "",
            serviceAddress: lockedCustomer?.address ?? "",
            date: new Date().toISOString().split("T")[0],
            time: "09:00",
            lat: lockedCustomer?.lat ?? 6.9271,
            lng: lockedCustomer?.lng ?? 79.8612,
          });
          setProjectLink({});
          setEquipmentId('');
          setSelectedComponentId('');
          setActiveTab("basic");
          setError('');
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message;
          setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to create job. Please try again.'));
        },
      }
    );
  };

  const inputCls =
    "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm";

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "basic", label: "Job Details", icon: <Wrench size={14} /> },
    { id: "scheduling", label: "Schedule & Cost", icon: <Calendar size={14} /> },
  ];

  const isLoading = createJob.isPending;

  /** Step 1 validation before advancing to scheduling tab */
  const handleNextStep = () => {
    setError('');
    if (!formData.title.trim()) { setError('Job title is required.'); return; }
    if (!formData.customerId) { setError('Please select a customer.'); return; }
    if (!formData.serviceAddress.trim()) { setError('Service address is required.'); return; }
    setActiveTab('scheduling');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6 admin-modal-backdrop"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={contextLabel ? `Create Job — ${contextLabel}` : "Create New Job"}
        className="bg-white rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl admin-modal-box overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="text-white">
            <h2 className="text-2xl font-bold">{contextLabel ? `Create Job — ${contextLabel}` : "Create New Job"}</h2>
            <p className="text-blue-100 text-sm mt-0.5 flex items-center gap-1.5">
              {lockedProject && <FolderKanban size={12} />}
              Step {activeTab === "basic" ? "1" : "2"} of 2 — {activeTab === "basic" ? "Job Details" : "Schedule & Cost"}
              {lockedProject && ` · linked to ${lockedProject.name}${lockedComponentLabel ? ` — ${lockedComponentLabel}` : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicators — visual only, not clickable */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          {tabs.map((t, idx) => {
            const isActive = activeTab === t.id;
            const isDone = t.id === "basic" && activeTab === "scheduling";
            return (
              <div
                key={t.id}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 select-none ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : isDone
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-400"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isActive ? "bg-blue-600 text-white" : isDone ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {isDone ? "✓" : idx + 1}
                </span>
                {t.icon}
                {t.label}
              </div>
            );
          })}
        </div>

        {/* min-h-0 is required so this flex child actually shrinks and
            scrolls instead of growing past the dialog's fixed height */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-8 space-y-5">

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {activeTab === "basic" && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    What kind of service is this?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {SERVICE_TYPES.map((t) => {
                      const active = formData.serviceType === t.value;
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => handleServiceTypeSelect(t.value)}
                          disabled={isLoading}
                          className={`flex flex-col items-center text-center rounded-xl px-3 py-3.5 border transition-colors cursor-pointer ${
                            active
                              ? t.danger
                                ? "border-2 border-red-500 bg-red-50"
                                : "border-2 border-blue-600 bg-blue-50"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                              active ? (t.danger ? "text-red-600 bg-red-100" : "text-blue-600 bg-blue-100") : "text-gray-400 bg-gray-100"
                            }`}
                          >
                            <Icon size={17} strokeWidth={1.8} />
                          </span>
                          <span className={`text-xs font-bold ${active ? (t.danger ? "text-red-600" : "text-blue-600") : "text-gray-600"}`}>
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Customer <span className="text-red-500">*</span>
                    </label>
                    {lockedCustomer ? (
                      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-900">
                        <Lock size={12} className="text-blue-400 shrink-0" />
                        <span className="font-medium">{formData.customerName}</span>
                        <span className="text-blue-400 text-xs ml-auto">Set by the house</span>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Search customers…"
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          disabled={isLoading}
                          className={`${inputCls} mb-1.5`}
                          style={{ marginBottom: 6 }}
                        />
                        <select
                          value={formData.customerId}
                          onChange={handleCustomerSelect}
                          disabled={isLoading}
                          className={inputCls}
                        >
                          <option value="">— Select Customer —</option>
                          {customers.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.firstName} {c.lastName}{c.email ? ` (${c.email})` : ''}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Service Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="serviceAddress"
                      value={formData.serviceAddress}
                      onChange={handleChange}
                      placeholder="123 Main St, City, State"
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {lockedProject ? "Project" : "Link to a project (optional)"}
                    </label>
                    {lockedProject ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-900">
                          <FolderKanban size={13} className="text-blue-400 shrink-0" />
                          <span className="font-medium">{lockedProject.name}</span>
                          {lockedComponentLabel && <span className="text-blue-700 text-xs">· {lockedComponentLabel}</span>}
                          <span className="text-blue-400 text-xs ml-auto">Set by this page</span>
                        </div>
                        {showComponentSelect && (
                          <select
                            value={selectedComponentId}
                            onChange={(e) => setSelectedComponentId(e.target.value)}
                            disabled={isLoading}
                            className={inputCls}
                          >
                            <option value="">Which component? (optional)</option>
                            {(lockedComponentsQuery.data ?? []).map((c) => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <ProjectJobLinkPicker value={projectLink} onChange={setProjectLink} customerId={formData.customerId || undefined} />
                    )}
                  </div>
                  {lockedEquipmentId ? (
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Equipment
                      </label>
                      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-900">
                        <Home size={13} className="text-blue-400 shrink-0" />
                        <span className="font-medium">{lockedEquipmentLabel ?? 'This unit'}</span>
                        <span className="text-blue-400 text-xs ml-auto">This visit will be logged against that unit</span>
                      </div>
                    </div>
                  ) : formData.customerId && customerEquipment.length > 0 && (
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Related equipment (optional)
                      </label>
                      <select
                        value={equipmentId}
                        onChange={(e) => setEquipmentId(e.target.value)}
                        disabled={isLoading}
                        className={inputCls}
                      >
                        <option value="">— None / not applicable —</option>
                        {customerEquipment.map((eq: any) => (
                          <option key={eq.id} value={eq.id}>
                            {[eq.brand, eq.type, eq.model].filter(Boolean).join(' ')}
                            {eq.serialNo ? ` (S/N: ${eq.serialNo})` : ''}
                          </option>
                        ))}
                      </select>
                      {selectedEquipment && (
                        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                          <Link2 size={13} className="text-blue-500 shrink-0" />
                          <span className="text-xs font-medium text-gray-700">
                            Linked to <b className="text-gray-900">
                              {[selectedEquipment.brand, selectedEquipment.model].filter(Boolean).join(' ') || selectedEquipment.type}
                            </b> — this visit will be logged against that unit
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. HVAC Maintenance — John Doe"
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the job…"
                      disabled={isLoading}
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={inputCls}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === "scheduling" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Scheduled Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={inputCls}
                    />
                  </div>
                </div>
                <MapPicker
                  label="Service Location (GPS for Dispatch)"
                  lat={formData.lat}
                  lng={formData.lng}
                  onChange={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))}
                  height="240px"
                />
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-between gap-3 rounded-b-xl shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {activeTab === "scheduling" && (
              <button
                onClick={() => { setActiveTab("basic"); setError(""); }}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                ← Back
              </button>
            )}
            {activeTab === "basic" ? (
              <button
                onClick={handleNextStep}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer border-0"
              >
                Next: Schedule & Cost →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer border-0"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isLoading ? "Creating..." : "Create Job"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
