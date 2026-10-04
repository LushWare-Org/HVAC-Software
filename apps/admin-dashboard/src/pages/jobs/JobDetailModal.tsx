import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import {
  X, Edit2, Save, Wrench, User, Calendar,
  DollarSign, FileText, Clock, AlertCircle, Loader2, ArrowRight,
  Send, Receipt, Truck, Package, CheckSquare, ClipboardList, CalendarClock,
  Plus, Trash2, MessageSquare, Phone, Mail, Home,
} from "lucide-react";
import {
  useUpdateJobStatus, useUpdateJobFields, useJob, useWorkOrdersByJob,
  useCreateWorkOrder, useUpdateWorkOrderTask, useAddWorkOrderTask,
  useUpdateJobTags,
} from "../../hooks/useJobs";
import { useInvoices, useQuotes, useSendInvoice, useSendQuote, decimalToNumber } from "../../hooks/useFinance";
import { useCustomer } from "../../hooks/useCustomers";
import ProjectComponentTag from "../projects/ProjectComponentTag";
import {
  useCustomerEquipment,
  useAddEquipmentItem,
  useUpdateEquipmentItem,
  useDeleteEquipmentItem,
} from "../../hooks/useEquipment";
import {
  useLocations, useLocationStock, useInventoryItems,
  useTransfer, useConsume, useReturnStock, useEnsureVan, decimalToNumber as invDecimal,
} from "../../hooks/useInventory";
import type { Job, EquipmentRecord } from "../../types/api";
import JobActivityTab from "./JobActivityTab";
import JobStatusSpine from "./JobStatusSpine";
import JobVitalsRail from "./JobVitalsRail";
import CrewControlCenter from "../scheduling/crew/CrewControlCenter";
import { useCrew } from "../../hooks/useCrew";
import { formatMoney } from '../../lib/format'
import GpsSimulationControl from '../../components/GpsSimulationControl'
import JobStatusOverrideMenu from "../../components/JobStatusOverrideMenu";
import RescheduleBadge from "../../components/reschedule/RescheduleBadge";
import RescheduleModal from "../../components/reschedule/RescheduleModal";
import { STAFF_RESCHEDULABLE_STATUSES } from "../../lib/reschedule";
import { DURATION_PRESETS, DEFAULT_DURATION_MIN, formatDurationLabel } from "../../lib/dayPlan";

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onCreateQuote?: (job: Job) => void;
  onCreateInvoice?: (job: Job) => void;
  onBack?: () => void;
  backLabel?: string;
}

type TabType = "overview" | "checklist" | "equipment" | "inventory" | "details" | "notes" | "finance" | "activity" | "customer";

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
  LOW: "badge-neutral", NORMAL: "badge-neutral", HIGH: "badge-amber", URGENT: "badge-red", EMERGENCY: "badge-red",
};

const inputView = "w-full px-3 py-2.5 rounded-lg border border-transparent text-sm font-medium bg-[var(--bg-hover)] text-[var(--t2)]";
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[var(--bd)] text-sm font-medium bg-[var(--bg-card)] text-[var(--t1)]";


type EqDraft = Partial<EquipmentRecord> & { _tempId?: string };

export default function JobDetailModal({ isOpen, onClose, job: propJob, onCreateQuote, onCreateInvoice, onBack, backLabel }: JobDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");

  // Equipment editing state
  const [editingEquipment, setEditingEquipment] = useState(false);
  const [eqDraft, setEqDraft] = useState<EqDraft[]>([]);
  const [savingEq, setSavingEq] = useState(false);

  // Checklist add-task state
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskRequired, setNewTaskRequired] = useState(false);

  // J4: Cancellation reason
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonOther, setCancelReasonOther] = useState("");

  // J5: Parts shortage
  const [savingShortage, setSavingShortage] = useState(false);
  const [hasShortage, setHasShortage] = useState<boolean>(propJob?.hasPartShortage ?? false);

  // Expected duration — drives day-plan packing, editable here.
  const [durationDraft, setDurationDraft] = useState<number>(
    propJob?.estimatedDurationMins ?? DEFAULT_DURATION_MIN,
  );
  const [savingDuration, setSavingDuration] = useState(false);

  // Customer data for the Customer tab
  const customerQuery = useCustomer(propJob?.customerId ?? "");
  const customer = customerQuery.data;

  // Mutations
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const updateStatus = useUpdateJobStatus();
  const updateFields = useUpdateJobFields();
  const addEqItem = useAddEquipmentItem();
  const updateEqItem = useUpdateEquipmentItem();
  const deleteEqItem = useDeleteEquipmentItem();
  const createWorkOrder = useCreateWorkOrder();
  const updateTask = useUpdateWorkOrderTask();
  const addTask = useAddWorkOrderTask();
  const sendInvoice = useSendInvoice();
  const sendQuote = useSendQuote();

  const isBusy = updateStatus.isPending;

  // useJob keeps a live, auto-refreshing copy of this job. After any mutation
  // invalidates ['jobs'], this refetches and the modal re-renders with fresh data
  // without the user needing to close and reopen.
  const jobDetailQuery = useJob(propJob?.id ?? "");
  const jobDetail = jobDetailQuery.data;
  // Prefer the server-fresh copy; fall back to the list-page prop for first render.
  const job = (jobDetail ?? propJob)!;
  const statusHistory = jobDetail?.statusHistory ?? [];

  // The crew the old modal never showed. Read-only here; editing opens the
  // control centre, which already handles candidates, conflicts and the lead.
  const crewQuery = useCrew(propJob?.id);
  const crew = crewQuery.data ?? [];
  const [showCrewCenter, setShowCrewCenter] = useState(false);

  // Re-seed the duration editor when a different job is opened, or when the
  // server-fresh copy arrives with a value the list-page prop didn't carry.
  useEffect(() => {
    setDurationDraft(job?.estimatedDurationMins ?? DEFAULT_DURATION_MIN);
  }, [job?.id, job?.estimatedDurationMins]);

  const saveDuration = () => {
    if (!job?.id) return;
    const mins = Math.min(1440, Math.max(5, Math.round(durationDraft)));
    setSavingDuration(true);
    updateFields.mutate(
      { id: job.id, estimatedDurationMins: mins } as any,
      {
        onSuccess: () => {
          setSavingDuration(false);
          showSuccess(`Duration set to ${formatDurationLabel(mins)}`);
        },
        onError: () => {
          setSavingDuration(false);
          showError("Could not save the duration.");
        },
      },
    );
  };

  const invoicesQuery = useInvoices({ limit: 50 });
  const quotesQuery = useQuotes({ limit: 50 });
  const jobInvoices = (invoicesQuery.data?.data ?? []).filter(inv => inv.jobId === propJob?.id);
  const jobQuotes = (quotesQuery.data?.data ?? []).filter(q => q.jobId === propJob?.id);

  const equipmentQuery = useCustomerEquipment(propJob?.customerId);
  const workOrdersQuery = useWorkOrdersByJob(propJob?.id);
  const workOrder = workOrdersQuery.data?.[0];

  // Sync optimistic shortage state only when a different job is opened — not on
  // every background refetch (which would fight the optimistic toggle).
  useEffect(() => {
    setHasShortage(propJob?.hasPartShortage ?? false)
  }, [propJob?.id, propJob?.hasPartShortage])

  // Reset UI state when a new job is opened.
  useEffect(() => {
    if (propJob) {
      setNotes(propJob.description ?? "");
      setActiveTab("overview");
      setError("");
      setEditingEquipment(false);
      setShowAddTask(false);
    }
  }, [propJob]);

  if (!isOpen || !propJob) return null;

  const handleChatWithTech = () => {
    onClose()
    navigate('/communications', { state: { chatWithTech: job.assignedToName } })
  };

  const quickTransition = (newStatus: string) => {
    setError("");
    const label = newStatus.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    updateStatus.mutate(
      { id: job.id, status: newStatus },
      {
        onSuccess: () => showSuccess(`Status changed to ${label}.`),
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? "Status change failed.";
          setError(msg);
          showError(msg, 'Status update failed');
        },
      },
    );
  };

  // Admin correction — bypasses the state machine (job-service re-checks the
  // role independently; see JobStatusOverrideMenu).
  const handleForceStatus = (newStatus: string) => {
    setError("");
    const label = newStatus.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    updateStatus.mutate(
      { id: job.id, status: newStatus, force: true },
      {
        onSuccess: () => showSuccess(`Status corrected to ${label}.`, 'Status corrected'),
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? "Status correction failed.";
          setError(msg);
          showError(msg, 'Status correction failed');
        },
      },
    );
  };

  const startEditEquipment = () => {
    setEqDraft((equipmentQuery.data ?? []).map(e => ({ ...e })));
    setEditingEquipment(true);
  };

  const cancelEditEquipment = () => {
    setEqDraft([]);
    setEditingEquipment(false);
  };

  const handleSaveEquipment = async () => {
    if (!job?.customerId) return;
    setSavingEq(true);
    try {
      const existing = equipmentQuery.data ?? [];
      const existingIds = new Set(existing.map(e => e.id));

      // Delete removed items
      const draftIds = new Set(eqDraft.filter(e => e.id).map(e => e.id as string));
      for (const eq of existing) {
        if (!draftIds.has(eq.id)) {
          await deleteEqItem.mutateAsync({ customerId: job.customerId, eqId: eq.id });
        }
      }

      // Create new or update existing
      for (const eq of eqDraft) {
        const payload = {
          type: eq.type ?? "",
          brand: eq.brand,
          model: eq.model,
          serialNo: eq.serialNo,
          installDate: eq.installDate ? String(eq.installDate).slice(0, 10) : undefined,
          warrantyEnd: eq.warrantyEnd ? String(eq.warrantyEnd).slice(0, 10) : undefined,
          notes: eq.notes,
        };
        if (eq.id && existingIds.has(eq.id)) {
          await updateEqItem.mutateAsync({ customerId: job.customerId, eqId: eq.id, updates: payload });
        } else {
          await addEqItem.mutateAsync({ customerId: job.customerId, item: payload });
        }
      }

      setEditingEquipment(false);
      showSuccess('Equipment details saved.');
    } catch (err: any) {
      showError(err?.response?.data?.message ?? 'Failed to save equipment.', 'Save failed');
    } finally {
      setSavingEq(false);
    }
  };

  const handleEqChange = (idx: number, field: keyof EqDraft, value: string) => {
    setEqDraft(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const handleAddEquipment = () => {
    setEqDraft(prev => [...prev, { _tempId: `new-${Date.now()}`, type: "" }]);
  };

  const handleRemoveEquipment = (idx: number) => {
    setEqDraft(prev => prev.filter((_, i) => i !== idx));
  };

  // task.id IS the taskCompletionId — used in PATCH /work-orders/:id/tasks/:taskCompletionId
  const handleToggleTask = (taskCompletionId: string, currentValue: boolean) => {
    if (!workOrder) return;
    updateTask.mutate({
      workOrderId: workOrder.id,
      taskCompletionId,
      isCompleted: !currentValue,
    });
  };

  const handleAddTask = () => {
    if (!workOrder || !newTaskName.trim()) return;
    addTask.mutate(
      { workOrderId: workOrder.id, taskName: newTaskName.trim(), isRequired: newTaskRequired },
      {
        onSuccess: () => {
          setNewTaskName("");
          setNewTaskRequired(false);
          setShowAddTask(false);
        },
      },
    );
  };

  const handleCancelWithReason = () => {
    const reason = cancelReason === "Other" ? cancelReasonOther.trim() : cancelReason;
    if (!reason) return;
    setError("");
    // Close and toast immediately — don't make the user wait for the server.
    setShowCancelModal(false);
    setCancelReason("");
    setCancelReasonOther("");
    showSuccess("Job cancelled.");
    updateStatus.mutate(
      { id: job.id, status: "CANCELLED", cancellationReason: reason },
      {
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? "Cancel failed.";
          setError(msg);
          showError(msg, "Cancel failed");
        },
      },
    );
  };

  const handleToggleShortage = () => {
    if (savingShortage) return;
    const next = !hasShortage;
    setHasShortage(next);
    // Toast fires immediately — the toggle is already visually flipped.
    showSuccess(next ? "Parts shortage flagged." : "Parts shortage cleared.");
    setSavingShortage(true);
    updateFields.mutate(
      { id: job.id, hasPartShortage: next, partShortageNote: job.partShortageNote ?? "" },
      {
        onSuccess: () => setSavingShortage(false),
        onError: () => {
          setHasShortage(!next);
          setSavingShortage(false);
          showError("Failed to update parts shortage.");
        },
      },
    );
  };

  const status = STATUS_MAP[job.status] ?? STATUS_MAP.PENDING;

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview",  label: "Overview",      icon: <Wrench size={13} /> },
    { id: "customer",  label: "Customer",      icon: <User size={13} /> },
    { id: "checklist", label: "Checklist",      icon: <CheckSquare size={13} /> },
    { id: "equipment", label: "Equipment",      icon: <Package size={13} />, badge: equipmentQuery.data?.length },
    { id: "inventory", label: "Inventory",      icon: <Truck size={13} /> },
    { id: "details",   label: "Schedule",       icon: <Calendar size={13} /> },
    { id: "finance",   label: "Finance",        icon: <DollarSign size={13} /> },
    { id: "activity",  label: "Activity",       icon: <Clock size={13} /> },
    { id: "notes",     label: "Notes",          icon: <FileText size={13} /> },
  ];

  const getQuickActions = () => {
    const actions: { label: string; status?: string; css: string; icon: React.ReactNode; onClick?: () => void }[] = [];
    const s = job.status;
    // Only show Hold for active jobs that can be put on hold
    if (["PENDING", "SCHEDULED", "EN_ROUTE", "ON_SITE", "IN_PROGRESS"].includes(s)) {
      actions.push({ label: "Hold", status: "ON_HOLD", css: "bg-gray-500 hover:bg-gray-600", icon: <ArrowRight size={14} /> });
    }
    return actions;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 admin-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="flex flex-col admin-modal-box"
        style={{
          background: 'var(--bg-card)',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(15,23,42,0.28)',
          width: 'min(1280px, 96vw)',
          height: 'min(880px, 92vh)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — quiet surface rather than a coloured hero, so the spine
            below it is the thing the eye lands on. */}
        <div style={{ padding: '15px 20px 0', flexShrink: 0 }}>
          {onBack && (
            <button
              onClick={() => { onClose(); onBack(); }}
              style={{ all: 'unset', cursor: 'pointer', color: 'var(--blue)', fontSize: 11.5, fontWeight: 700, marginBottom: 8, display: 'inline-block' }}
            >
              ← {backLabel ?? 'Back'}
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5, color: 'var(--t3)', fontWeight: 600 }}>
                  {(job as any).jobNumber ?? job.id.slice(0, 8)}
                </span>
                <span className={`badge ${status.css}`} style={{ fontSize: 11 }}>{status.label}</span>
                {job.priority && (
                  <span className={`badge ${PRIORITY_CSS[job.priority] ?? "badge-neutral"}`} style={{ fontSize: 11 }}>{job.priority}</span>
                )}
                {hasShortage && (
                  <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, background: 'var(--amber-dim)', color: 'var(--amber)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Package size={10} /> Parts short
                  </span>
                )}
                <RescheduleBadge state={job.rescheduleState} />
                {job.projectId && <ProjectComponentTag projectId={job.projectId} componentId={job.componentId} />}
              </div>
              <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.22, letterSpacing: '-0.015em', margin: 0 }}>
                {job.title}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{ all: 'unset', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--t3)', display: 'inline-flex' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* The signature element: where this job is, and how long it has been
              there. See JobStatusSpine. */}
          <div style={{ marginTop: 14 }}>
            <JobStatusSpine
              status={job.status}
              statusHistory={statusHistory}
              createdAt={(job as any).createdAt}
            />
          </div>
        </div>

        {/* Body: vitals stay put, the tab is the working surface */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, borderTop: '1px solid var(--bd)', marginTop: 12 }}>
          <JobVitalsRail
            job={job}
            crew={crew}
            crewLoading={crewQuery.isLoading}
            onManageCrew={() => setShowCrewCenter(true)}
            onOpenCustomer={() => setActiveTab('customer')}
          />

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Tabs */}
            <div
              style={{ display: 'flex', gap: 2, padding: '9px 16px 0', borderBottom: '1px solid var(--bd)', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}
            >
              {tabs.map(t => {
                const on = activeTab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 13px',
                      borderRadius: '7px 7px 0 0',
                      fontSize: 12.5,
                      fontWeight: on ? 700 : 550,
                      color: on ? 'var(--t1)' : 'var(--t3)',
                      background: on ? 'var(--bg-card)' : 'transparent',
                      borderBottom: on ? '2px solid var(--blue)' : '2px solid transparent',
                      whiteSpace: 'nowrap',
                      marginBottom: -1,
                    }}
                  >
                    {t.icon}
                    {t.label}
                    {t.badge != null && t.badge > 0 && (
                      <span style={{
                        fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 700,
                        padding: '1px 5px', borderRadius: 20,
                        background: on ? 'var(--blue-dim)' : 'var(--bg-card-2)',
                        color: on ? 'var(--blue)' : 'var(--t3)',
                      }}>{t.badge}</span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* ── Cancellation Reason Modal ───────────────────────────────── */}
            {showCancelModal && (
              <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Cancel this job?</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Select a reason — it's saved to the job record.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mb-4">
                    {["Customer request", "Parts unavailable", "Technician unavailable", "Scheduling conflict", "Weather / emergency", "Duplicate booking", "Other"].map(r => (
                      <button
                        key={r}
                        onClick={() => setCancelReason(r)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${cancelReason === r ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {cancelReason === "Other" && (
                    <input
                      autoFocus
                      className="w-full px-3 py-2 mb-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-red-400"
                      placeholder="Describe the reason…"
                      value={cancelReasonOther}
                      onChange={e => setCancelReasonOther(e.target.value)}
                    />
                  )}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setShowCancelModal(false); setCancelReason(""); setCancelReasonOther(""); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      Go back
                    </button>
                    <button
                      onClick={handleCancelWithReason}
                      disabled={!cancelReason || (cancelReason === "Other" && !cancelReasonOther.trim()) || updateStatus.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {updateStatus.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
                      Confirm Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Overview ──────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Renders nothing unless the server has GPS simulation enabled,
                    so this is invisible on a normal deployment. */}
                <GpsSimulationControl jobId={job.id} />

                {/* Anything that should change what someone does next, first and
                    together. Nothing renders when the job is simply fine. */}
                {(() => {
                  const alerts: { tone: string; text: string; action?: () => void; actionLabel?: string }[] = [];
                  if (job.status === "CANCELLED" && (job as any).cancellationReason) {
                    alerts.push({ tone: 'var(--red)', text: `Cancelled: ${(job as any).cancellationReason}` });
                  }
                  if (!crew.length && !job.assignedToName && job.status !== "CANCELLED") {
                    alerts.push({ tone: 'var(--amber)', text: 'Nobody is assigned to this job yet.', action: () => setShowCrewCenter(true), actionLabel: 'Assign' });
                  }
                  const need = (job as any).requiredTechCount ?? 0;
                  if (need > 0 && crew.length > 0 && crew.length < need) {
                    alerts.push({ tone: 'var(--amber)', text: `This job is set up for ${need} technicians and has ${crew.length}.`, action: () => setShowCrewCenter(true), actionLabel: 'Add' });
                  }
                  if (hasShortage) {
                    alerts.push({ tone: 'var(--amber)', text: (job as any).partShortageNote ? `Waiting on parts: ${(job as any).partShortageNote}` : 'Waiting on parts.' });
                  }
                  if (!job.scheduledStart && !["COMPLETED","INVOICED","PAID","CANCELLED"].includes(job.status)) {
                    alerts.push({ tone: 'var(--amber)', text: 'No date or time set.', action: () => setActiveTab('details'), actionLabel: 'Schedule' });
                  }
                  if (!alerts.length) return null;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--bd)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
                      {alerts.map((a, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', background: 'var(--bg-card)' }}>
                          <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: a.tone, flexShrink: 0 }} />
                          <AlertCircle size={14} style={{ color: a.tone, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--t1)', flex: 1 }}>{a.text}</span>
                          {a.action && (
                            <button onClick={a.action} style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>
                              {a.actionLabel}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* What was asked for */}
                <section>
                  <h3 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t3)', margin: '0 0 7px' }}>What was reported</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--t1)', margin: 0, maxWidth: '72ch', whiteSpace: 'pre-wrap' }}>
                    {job.description?.trim() || 'No description was given when this job was raised.'}
                  </p>
                </section>

                {/* Where the work stands, pulled from the tabs so the answer is
                    here rather than three clicks away. */}
                <section>
                  <h3 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t3)', margin: '0 0 9px' }}>Where it stands</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 1, background: 'var(--bd)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
                    {(() => {
                      const tasks = workOrder?.tasks ?? [];
                      const done = tasks.filter(t => t.isCompleted).length;
                      const eq = equipmentQuery.data?.length ?? 0;
                      const last = statusHistory.length
                        ? [...statusHistory].sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt))[0]
                        : null;
                      const cells: { label: string; value: string; sub?: string; onClick?: () => void }[] = [
                        {
                          label: 'Checklist',
                          value: tasks.length ? `${done} of ${tasks.length}` : 'None yet',
                          sub: tasks.length ? (done === tasks.length ? 'all done' : `${tasks.length - done} left`) : 'no work order',
                          onClick: () => setActiveTab('checklist'),
                        },
                        {
                          label: 'Equipment on site',
                          value: eq ? String(eq) : 'None',
                          sub: eq ? (eq === 1 ? 'unit on record' : 'units on record') : 'nothing recorded',
                          onClick: () => setActiveTab('equipment'),
                        },
                        {
                          label: 'Crew',
                          value: crew.length ? String(crew.length) : (job.assignedToName ? '1' : 'None'),
                          sub: crew.find(m => m.assignment?.isLead)?.technician.name ?? job.assignedToName ?? 'unassigned',
                          onClick: () => setShowCrewCenter(true),
                        },
                        {
                          label: 'Last update',
                          value: last ? new Date(last.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '—',
                          sub: last ? String(last.toStatus).replace(/_/g, ' ').toLowerCase() : 'no history',
                          onClick: () => setActiveTab('activity'),
                        },
                      ];
                      return cells.map(c => (
                        <button
                          key={c.label}
                          onClick={c.onClick}
                          style={{ all: 'unset', cursor: 'pointer', padding: '11px 13px', background: 'var(--bg-card)', display: 'block' }}
                        >
                          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t4)', marginBottom: 4 }}>{c.label}</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em', lineHeight: 1.15 }}>{c.value}</div>
                          {c.sub && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sub}</div>}
                        </button>
                      ));
                    })()}
                  </div>
                </section>

                {/* Actions that belong to the job as a whole rather than a tab */}
                <section style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {job.assignedToId && job.assignedToName && (
                    <button
                      onClick={handleChatWithTech}
                      style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--violet-dim)', background: 'var(--violet-dim)', color: 'var(--violet)', fontSize: 12.5, fontWeight: 650 }}
                    >
                      <MessageSquare size={13} /> Message {job.assignedToName.split(' ')[0]}
                    </button>
                  )}
                  {!["PAID", "CANCELLED"].includes(job.status) && (
                    <button
                      onClick={handleToggleShortage}
                      disabled={savingShortage}
                      style={{ all: 'unset', cursor: savingShortage ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8, border: `1px solid ${hasShortage ? 'var(--amber)' : 'var(--bd-md)'}`, background: hasShortage ? 'var(--amber-dim)' : 'transparent', color: hasShortage ? 'var(--amber)' : 'var(--t2)', fontSize: 12.5, fontWeight: 650, opacity: savingShortage ? 0.6 : 1 }}
                    >
                      <Package size={13} /> {hasShortage ? 'Waiting on parts' : 'Flag parts on backorder'}
                    </button>
                  )}
                </section>

                {hasShortage && !["PAID", "CANCELLED"].includes(job.status) && (
                  <input
                    className={`${inputView} !bg-amber-50 !border-amber-200`}
                    placeholder="Which part? (PO number, supplier) — optional"
                    defaultValue={(job as any).partShortageNote ?? ""}
                    onBlur={e => {
                      if (e.target.value !== ((job as any).partShortageNote ?? "")) {
                        updateFields.mutate({ id: job.id, partShortageNote: e.target.value });
                      }
                    }}
                  />
                )}
              </div>
            )}
            {/* ── Customer ──────────────────────────────────────────────── */}
            {activeTab === "customer" && (
              <div className="space-y-5">
                {customerQuery.isLoading && (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <Loader2 size={20} className="animate-spin mr-2" /> Loading customer…
                  </div>
                )}
                {!customerQuery.isLoading && !customer && (
                  <div className="text-center py-12 text-gray-400">
                    <User size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No customer data available.</p>
                  </div>
                )}
                {customer && (
                  <>
                    {/* Customer header card */}
                    <div className="rounded-xl p-5 flex items-start gap-4" style={{ background: 'var(--blue-glow)', border: '1px solid var(--bd)' }}>
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {customer.firstName?.[0] ?? "?"}{customer.lastName?.[0] ?? ""}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold" style={{ color: 'var(--t1)' }}>
                            {customer.firstName} {customer.lastName}
                          </h3>
                          {customer.type && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ background: 'var(--blue-glow)', color: 'var(--blue)', border: '1px solid var(--bd)' }}>
                              {customer.type}
                            </span>
                          )}
                        </div>
                        {(customer as any).companyName && (
                          <p className="text-sm mt-0.5" style={{ color: 'var(--t3)' }}>{(customer as any).companyName}</p>
                        )}
                        <button
                          onClick={() => {
                            onClose();
                            window.dispatchEvent(new CustomEvent("open-customer-detail", { detail: { customer, returnToJob: job } }));
                          }}
                          className="mt-2 text-xs font-semibold bg-transparent border-0 cursor-pointer underline p-0"
                          style={{ color: 'var(--blue)' }}
                        >
                          View Full Profile →
                        </button>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--t4)' }}>
                          <Mail size={11} /> Email
                        </label>
                        <div className="flex items-center gap-2">
                          <input value={customer.email ?? "—"} disabled className={inputView} />
                          {customer.email && (
                            <a href={`mailto:${customer.email}`} className="shrink-0 p-2 rounded-lg transition-colors" style={{ background: 'var(--blue-glow)', border: '1px solid var(--bd)', color: 'var(--blue)' }}>
                              <Mail size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--t4)' }}>
                          <Phone size={11} /> Phone
                        </label>
                        <div className="flex items-center gap-2">
                          <input value={customer.phone ?? "—"} disabled className={inputView} />
                          {customer.phone && (
                            <a href={`tel:${customer.phone}`} className="shrink-0 p-2 rounded-lg transition-colors" style={{ background: 'var(--green-dim)', border: '1px solid var(--bd)', color: 'var(--green)' }}>
                              <Phone size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--t4)' }}>
                          <Home size={11} /> Address
                        </label>
                        <input
                          value={[customer.address, customer.city, customer.state, customer.zipCode].filter(Boolean).join(", ") || "—"}
                          disabled
                          className={inputView}
                        />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Total Jobs", value: customer.totalJobs ?? "—" },
                        { label: "Last Service", value: customer.lastServiceDate ? new Date(customer.lastServiceDate).toLocaleDateString() : "—" },
                        { label: "Customer Since", value: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—" },
                      ].map(stat => (
                        <div key={stat.label} className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-hover)', border: '1px solid var(--bd)' }}>
                          <div className="text-lg font-bold" style={{ color: 'var(--t1)' }}>{stat.value}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: 'var(--t4)' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {customer.notes && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--t4)' }}>
                          <FileText size={11} /> Notes
                        </label>
                        <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--amber-dim)', border: '1px solid var(--bd)', color: 'var(--t2)' }}>
                          {customer.notes}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Checklist ─────────────────────────────────────────────── */}
            {activeTab === "checklist" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <CheckSquare size={16} className="text-blue-600" />
                    Work Order Checklist
                    {workOrder && (
                      <span className="text-xs text-gray-400 font-normal ml-1">
                        {workOrder.tasks.filter(t => t.isCompleted).length}/{workOrder.tasks.length} done
                      </span>
                    )}
                  </h3>
                  {workOrder && !showAddTask && (
                    <button
                      onClick={() => setShowAddTask(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Plus size={13} /> Add Task
                    </button>
                  )}
                </div>

                {workOrdersQuery.isLoading && (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 size={20} className="animate-spin mr-2" /> Loading checklist…
                  </div>
                )}

                {!workOrdersQuery.isLoading && !workOrder && (
                  <div className="text-center py-8 text-gray-400">
                    <ClipboardList size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No work order yet</p>
                    <p className="text-xs mt-1 mb-4">Create a work order to start tracking tasks for this job.</p>
                    <button
                      onClick={() => createWorkOrder.mutate({ jobId: job.id })}
                      disabled={createWorkOrder.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer mx-auto disabled:opacity-50"
                    >
                      {createWorkOrder.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Create Work Order
                    </button>
                  </div>
                )}

                {workOrder && (
                  <div className="space-y-3">
                    {/* Progress bar */}
                    {workOrder.tasks.length > 0 && (
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(workOrder.tasks.filter(t => t.isCompleted).length / workOrder.tasks.length) * 100}%`,
                            backgroundColor: workOrder.tasks.every(t => t.isCompleted) ? "#16a34a" : "#2563eb",
                          }}
                        />
                      </div>
                    )}

                    {workOrder.tasks.length === 0 && !showAddTask && (
                      <div className="text-center py-6 text-gray-400">
                        <CheckSquare size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No tasks yet — click "Add Task" to start.</p>
                      </div>
                    )}

                    {workOrder.tasks
                      .sort((a, b) => a.taskOrder - b.taskOrder)
                      .map(task => (
                        <div
                          key={task.id}
                          className={`border rounded-lg p-3 flex items-start gap-3 transition-colors ${
                            task.isCompleted ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {/* Clickable checkbox */}
                          <button
                            onClick={() => handleToggleTask(task.id, task.isCompleted)}
                            disabled={updateTask.isPending}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer bg-transparent border-0 p-0 ${
                              task.isCompleted
                                ? "bg-green-600 border-green-600 text-white"
                                : "border-gray-300 hover:border-blue-400"
                            }`}
                            style={{ border: task.isCompleted ? "2px solid #16a34a" : "2px solid #d1d5db" }}
                            title={task.isCompleted ? "Mark incomplete" : "Mark complete"}
                          >
                            {task.isCompleted && <span className="text-white text-xs font-bold leading-none">✓</span>}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-medium ${task.isCompleted ? "text-green-700 line-through" : "text-gray-800"}`}>
                                {task.taskName}
                              </p>
                              {task.isRequired && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">Required</span>
                              )}
                            </div>
                            {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                            {task.safetyNote && (
                              <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mt-1">⚠️ {task.safetyNote}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-gray-400">
                              {task.estimatedMins && <span>~{task.estimatedMins} min</span>}
                              {task.photoRequired && <span>{task.photoUrl ? "📷 Photo attached" : "📷 Photo required"}</span>}
                              {task.completedAt && <span>Done: {new Date(task.completedAt).toLocaleString()}</span>}
                            </div>
                            {task.notes && (
                              <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded p-1.5">📝 {task.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}

                    {/* Add Task form */}
                    {showAddTask && (
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50 space-y-3">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New Task</p>
                        <input
                          autoFocus
                          placeholder="Task name…"
                          value={newTaskName}
                          onChange={e => setNewTaskName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleAddTask(); if (e.key === "Escape") { setShowAddTask(false); setNewTaskName(""); } }}
                          className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-sm font-medium focus:border-blue-500 outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newTaskRequired}
                              onChange={e => setNewTaskRequired(e.target.checked)}
                              className="rounded"
                            />
                            Mark as required
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddTask}
                            disabled={!newTaskName.trim() || addTask.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {addTask.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Add Task
                          </button>
                          <button
                            onClick={() => { setShowAddTask(false); setNewTaskName(""); setNewTaskRequired(false); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Line items */}
                    {workOrder.lineItems.length > 0 && (
                      <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                          Parts & Materials ({workOrder.lineItems.length})
                        </div>
                        {workOrder.lineItems.map(item => (
                          <div key={item.id} className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium text-gray-800">{item.description}</span>
                              <span className="text-xs text-gray-400 ml-2">{item.category}</span>
                            </div>
                            <span className="font-semibold text-gray-700">
                              {item.quantity} × {formatMoney(item.unitPrice)} = {formatMoney(item.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Fields */}
                {(jobDetail as any)?.customFieldValues?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                      <FileText size={14} className="text-purple-600" /> Custom Fields
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {((jobDetail as any).customFieldValues as any[]).map((fv: any) => (
                        <div key={fv.fieldDefId ?? fv.fieldKey} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-400 uppercase">{fv.label ?? fv.fieldKey}</p>
                          <p className="text-sm text-gray-800 font-medium mt-0.5">
                            {fv.value === true ? "✓ Yes" : fv.value === false ? "✗ No" : String(fv.value ?? "—")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Equipment ─────────────────────────────────────────────── */}
            {activeTab === "equipment" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Package size={16} className="text-blue-600" /> Equipment
                    <span className="text-xs text-gray-400 font-normal">{job.customerName}</span>
                  </h3>
                  <div className="flex gap-2">
                    {!editingEquipment ? (
                      <button
                        onClick={startEditEquipment}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Edit2 size={12} /> Edit Equipment
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveEquipment}
                          disabled={savingEq}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {savingEq ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          Save
                        </button>
                        <button
                          onClick={cancelEditEquipment}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {equipmentQuery.isLoading && (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 size={20} className="animate-spin mr-2" /> Loading equipment…
                  </div>
                )}

                {/* View mode */}
                {!editingEquipment && !equipmentQuery.isLoading && (
                  <>
                    {(equipmentQuery.data ?? []).length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Package size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No equipment registered for this customer.</p>
                        <p className="text-xs mt-1 mb-4">Click "Edit Equipment" to add equipment.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(equipmentQuery.data ?? []).map(eq => (
                          <div key={eq.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-blue-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{eq.type || "—"}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                                  {eq.brand && <span>Brand: <strong className="text-gray-700">{eq.brand}</strong></span>}
                                  {eq.model && <span>Model: <strong className="text-gray-700">{eq.model}</strong></span>}
                                  {eq.serialNo && <span>Serial: <strong className="text-gray-700">{eq.serialNo}</strong></span>}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                                  {eq.installDate && <span>Installed: {new Date(eq.installDate).toLocaleDateString()}</span>}
                                  {eq.warrantyEnd && (
                                    <span className={new Date(eq.warrantyEnd) < new Date() ? "text-red-500" : "text-green-600"}>
                                      Warranty: {new Date(eq.warrantyEnd).toLocaleDateString()}
                                      {new Date(eq.warrantyEnd) < new Date() ? " (expired)" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {eq.notes && <p className="mt-2 text-xs text-gray-500 bg-white rounded p-2 border border-gray-100">{eq.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Edit mode */}
                {editingEquipment && (
                  <div className="space-y-3">
                    {eqDraft.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No equipment yet — click "Add Equipment" below.</p>
                    )}
                    {eqDraft.map((eq, idx) => (
                      <div key={eq.id ?? eq._tempId} className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                            {eq.id ? "Edit Equipment" : "New Equipment"}
                          </span>
                          <button
                            onClick={() => handleRemoveEquipment(idx)}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded cursor-pointer"
                          >
                            <Trash2 size={11} /> Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Type *</label>
                            <input
                              placeholder="e.g. HVAC Unit"
                              value={eq.type ?? ""}
                              onChange={e => handleEqChange(idx, "type", e.target.value)}
                              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Brand</label>
                            <input
                              placeholder="e.g. Carrier"
                              value={eq.brand ?? ""}
                              onChange={e => handleEqChange(idx, "brand", e.target.value)}
                              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Model</label>
                            <input
                              placeholder="Model number"
                              value={eq.model ?? ""}
                              onChange={e => handleEqChange(idx, "model", e.target.value)}
                              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Serial No.</label>
                            <input
                              placeholder="Serial number"
                              value={eq.serialNo ?? ""}
                              onChange={e => handleEqChange(idx, "serialNo", e.target.value)}
                              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Install Date</label>
                            <input
                              type="date"
                              value={eq.installDate ? eq.installDate.slice(0, 10) : ""}
                              onChange={e => handleEqChange(idx, "installDate", e.target.value)}
                              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Warranty End</label>
                            <input
                              type="date"
                              value={eq.warrantyEnd ? eq.warrantyEnd.slice(0, 10) : ""}
                              onChange={e => handleEqChange(idx, "warrantyEnd", e.target.value)}
                              className="w-full mt-1 px-2.5 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase">Notes</label>
                          <textarea
                            placeholder="Any notes about this equipment…"
                            value={eq.notes ?? ""}
                            onChange={e => handleEqChange(idx, "notes", e.target.value)}
                            rows={2}
                            className="w-full mt-1 px-2.5 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 outline-none resize-none"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleAddEquipment}
                      className="flex items-center gap-1.5 w-full justify-center py-2.5 text-sm font-medium text-blue-700 bg-white border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Plus size={15} /> Add Equipment
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Schedule & Billing ────────────────────────────────────── */}
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
                  {/* Editable: the day-planner packs technician routes from
                      this, so a dispatcher must be able to correct it when a
                      job turns out bigger or smaller than booked. */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={11} /> Expected Duration
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={DURATION_PRESETS.includes(durationDraft) ? String(durationDraft) : 'custom'}
                        onChange={(e) => {
                          if (e.target.value === 'custom') return
                          setDurationDraft(Number(e.target.value))
                        }}
                        className={inputCls}
                      >
                        {DURATION_PRESETS.map(m => (
                          <option key={m} value={String(m)}>{formatDurationLabel(m)}</option>
                        ))}
                        <option value="custom">Custom…</option>
                      </select>
                      <input
                        type="number"
                        min={5}
                        max={1440}
                        step={5}
                        value={durationDraft}
                        onChange={(e) => setDurationDraft(Number(e.target.value))}
                        className={`${inputCls} w-24`}
                        aria-label="Duration in minutes"
                      />
                      <span className="text-xs text-gray-500 shrink-0">min</span>
                      <button
                        onClick={saveDuration}
                        disabled={savingDuration || durationDraft === (job.estimatedDurationMins ?? DEFAULT_DURATION_MIN)}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
                      >
                        {savingDuration ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                    {job.estimatedDurationMins == null && (
                      <p className="text-[11px] text-gray-500">
                        No duration set — auto-scheduling assumes {formatDurationLabel(DEFAULT_DURATION_MIN)}.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign size={11} /> Estimated Amount
                    </label>
                    <input value={job.estimatedAmount != null ? formatMoney(job.estimatedAmount, { decimals: 0 }) : "—"} disabled className={inputView} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign size={11} /> Final Amount
                    </label>
                    <input value={job.finalAmount != null ? formatMoney(job.finalAmount, { decimals: 0 }) : "—"} disabled className={inputView} />
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-blue-700 mb-3">Job Summary</h4>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Job ID", value: job.id.slice(0, 12) + "…" },
                      { label: "Customer", value: job.customerName ?? "—" },
                      { label: "Technician", value: job.assignedToName ?? "Unassigned" },
                      { label: "Status", value: STATUS_MAP[job.status]?.label ?? job.status },
                      { label: "Created", value: new Date(job.createdAt).toLocaleString() },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-gray-500">{row.label}</span>
                        <span className="font-semibold text-gray-800">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Inventory / Stock ─────────────────────────────────────── */}
            {activeTab === "inventory" && (
              <InventoryTab job={job} />
            )}

            {/* ── Notes ─────────────────────────────────────────────────── */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Job Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled
                  rows={8}
                  placeholder="Job description and notes…"
                  className={`${inputView} resize-none`}
                />
              </div>
            )}

            {/* ── Activity ──────────────────────────────────────────────── */}
            {activeTab === "activity" && (
              <JobActivityTab isLoading={jobDetailQuery.isLoading} statusHistory={statusHistory} />
            )}

            {/* ── Finance ───────────────────────────────────────────────── */}
            {activeTab === "finance" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  {onCreateQuote && (
                    <button onClick={() => onCreateQuote(job)} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                      <Send size={14} /> Create Quote
                    </button>
                  )}
                  {onCreateInvoice && (
                    <button onClick={() => onCreateInvoice(job)} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                      <Receipt size={14} /> Create Invoice
                    </button>
                  )}
                </div>

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
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.status === "DRAFT" ? "bg-gray-100 text-gray-600" : q.status === "SENT" ? "bg-blue-100 text-blue-700" : q.status === "ACCEPTED" ? "bg-green-100 text-green-700" : q.status === "CONVERTED" ? "bg-cyan-100 text-cyan-700" : "bg-red-100 text-red-700"}`}>
                              {q.status}
                            </span>
                            {q.status === "DRAFT" && (
                              <button onClick={() => sendQuote.mutate(q.id)} disabled={sendQuote.isPending} className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50">
                                {sendQuote.isPending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} Send
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === "DRAFT" ? "bg-gray-100 text-gray-600" : inv.status === "SENT" ? "bg-blue-100 text-blue-700" : inv.status === "PAID" ? "bg-green-100 text-green-700" : inv.status === "PARTIALLY_PAID" ? "bg-amber-100 text-amber-700" : inv.status === "OVERDUE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                              {inv.status}
                            </span>
                            {inv.status === "DRAFT" && (
                              <button onClick={() => sendInvoice.mutate(inv.id)} disabled={sendInvoice.isPending} className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50">
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
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 rounded-b-xl shrink-0 flex items-center justify-between gap-2">
          <div className="flex gap-2 flex-wrap">
            {getQuickActions().map(action => (
              <button
                key={action.label}
                onClick={() => action.status ? quickTransition(action.status) : undefined}
                disabled={isBusy}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 border-0 ${action.css}`}
              >
                {isBusy ? <Loader2 size={14} className="animate-spin" /> : action.icon}
                {action.label}
              </button>
            ))}
            {/* J4: Cancel with reason — available when job is in a cancellable state */}
            {["PENDING","SCHEDULED","EN_ROUTE","ON_SITE","COMPLETED","INVOICED","ON_HOLD"].includes(job.status) && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-60"
              >
                <X size={14} /> Cancel Job
              </button>
            )}
            {STAFF_RESCHEDULABLE_STATUSES.includes(job.status) && (
              <button
                onClick={() => setShowReschedule(true)}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-60"
              >
                <CalendarClock size={14} /> Reschedule
              </button>
            )}
            <JobStatusOverrideMenu currentStatus={job.status} isPending={isBusy} onSelect={handleForceStatus} />
          </div>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            Close
          </button>
        </div>

        {/* Full crew editing lives in the control centre, which already handles
            candidates, conflicts, the lead and the map. No second implementation. */}
        <CrewControlCenter
          job={showCrewCenter ? job : null}
          open={showCrewCenter}
          onClose={() => setShowCrewCenter(false)}
          onSaved={() => crewQuery.refetch()}
        />

        {showReschedule && (
          <RescheduleModal
            job={{
              id: job.id, title: job.title, jobNumber: job.jobNumber,
              customerName: job.customerName, scheduledStart: job.scheduledStart,
              status: job.status, rescheduleState: job.rescheduleState,
              assignedToName: job.assignedToName,
            }}
            isOpen={showReschedule}
            onClose={() => setShowReschedule(false)}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

// ===== Inventory Tab (stock assign / transfer for this job) =====
function InventoryTab({ job }: { job: Job }) {
  const [transferItem, setTransferItem] = useState<string>("")
  const [transferQty, setTransferQty] = useState(1)
  const [showTransfer, setShowTransfer] = useState(false)
  const updateTags = useUpdateJobTags()

  const stocksCollected = (job.tags ?? []).includes('stocks-collected')

  const toggleStocksCollected = () => {
    const currentTags = job.tags ?? []
    const newTags = stocksCollected
      ? currentTags.filter(t => t !== 'stocks-collected')
      : [...currentTags, 'stocks-collected']
    updateTags.mutate({ id: job.id, tags: newTags })
  }

  const locationsQuery = useLocations()
  const locations = locationsQuery.data ?? []
  const warehouses = locations.filter(l => l.type === "WAREHOUSE")
  const vans = locations.filter(l => l.type === "VAN")

  // Find technician van from the job's assigned technician
  const techVan = vans.find(v => v.technicianId === job.assignedToId)
  const warehouse = warehouses[0]

  const vanStockQuery = useLocationStock(techVan?.id)
  const warehouseStockQuery = useLocationStock(warehouse?.id)
  const itemsQuery = useInventoryItems({ limit: 200 })
  const transfer = useTransfer()
  const consume = useConsume()
  const returnStock = useReturnStock()
  const ensureVan = useEnsureVan()
  const [returningVanItemId, setReturningVanItemId] = useState<string | null>(null)
  const [returnQtyMap, setReturnQtyMap] = useState<Record<string, number>>({})

  const vanStock = vanStockQuery.data?.data ?? []
  const warehouseStock = warehouseStockQuery.data?.data ?? []
  const allItems = itemsQuery.data?.data ?? []

  const handleTransfer = async () => {
    if (!transferItem || !warehouse?.id || !techVan?.id || transferQty < 1) return
    try {
      await transfer.mutateAsync({
        inventoryItemId: transferItem,
        fromLocationId: warehouse.id,
        toLocationId: techVan.id,
        quantity: transferQty,
        notes: `Transfer for Job ${job.jobNumber ?? job.id.slice(0, 8)}`,
      })
      setTransferItem("")
      setTransferQty(1)
      setShowTransfer(false)
    } catch {}
  }

  const handleConsume = async (inventoryItemId: string, qty: number) => {
    if (!techVan?.id) return
    try {
      await consume.mutateAsync({
        inventoryItemId,
        locationId: techVan.id,
        quantity: qty,
        referenceId: job.id,
        referenceType: "JOB",
      })
    } catch {}
  }

  const handleReturn = async (inventoryItemId: string, slId: string) => {
    if (!techVan?.id || !warehouse?.id) return
    const qty = returnQtyMap[slId] ?? 1
    try {
      await returnStock.mutateAsync({
        inventoryItemId,
        fromLocationId: techVan.id,
        toLocationId: warehouse.id,
        quantity: qty,
        notes: `Return — Job ${job.jobNumber ?? job.id.slice(0, 8)}`,
      })
      setReturningVanItemId(null)
    } catch {}
  }

  const handleEnsureVan = async () => {
    if (!job.assignedToId || !job.assignedToName) return
    await ensureVan.mutateAsync({ technicianId: job.assignedToId, technicianName: job.assignedToName })
  }

  if (!job.assignedToId) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2">🚚</div>
        <p className="text-sm text-gray-500">Assign a technician to manage inventory for this job.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Technician Van Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Truck size={16} className="text-blue-600" />
          {job.assignedToName}'s Van Stock
        </h3>
        {!techVan && (
          <button
            onClick={handleEnsureVan}
            disabled={ensureVan.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
          >
            {ensureVan.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Create Van
          </button>
        )}
        {techVan && (
          <button
            onClick={() => setShowTransfer(!showTransfer)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
          >
            <ArrowRight size={12} /> Transfer Stock
          </button>
        )}
      </div>

      {/* Stocks Collected Status */}
      <div
        onClick={toggleStocksCollected}
        className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
          stocksCollected
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}
      >
        <span className="text-sm font-semibold flex items-center gap-2">
          {stocksCollected ? <><CheckSquare size={14} /> Stocks Collected</> : <><Package size={14} /> Stocks Not Yet Collected</>}
        </span>
        <span className="text-xs opacity-70">{updateTags.isPending ? "Updating…" : "Click to toggle"}</span>
      </div>

      {/* Transfer Form */}
      {showTransfer && techVan && warehouse && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Transfer: Warehouse → {techVan.name}
          </div>
          <div className="flex gap-2">
            <select
              value={transferItem}
              onChange={e => setTransferItem(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-blue-300 bg-white text-sm"
            >
              <option value="">Select item…</option>
              {allItems.filter(i => i.isActive).map(item => {
                const whLevel = warehouseStock.find(s => s.inventoryItemId === item.id)
                const qty = invDecimal(whLevel?.quantity)
                return (
                  <option key={item.id} value={item.id} disabled={qty <= 0}>
                    {item.name} ({item.sku}) — {qty} in warehouse
                  </option>
                )
              })}
            </select>
            <input
              type="number"
              min={1}
              value={transferQty}
              onChange={e => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-3 py-2 rounded-lg border border-blue-300 bg-white text-sm text-center"
            />
            <button
              onClick={handleTransfer}
              disabled={transfer.isPending || !transferItem}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 border-0"
            >
              {transfer.isPending ? <Loader2 size={14} className="animate-spin" /> : "Transfer"}
            </button>
          </div>
        </div>
      )}

      {/* Van Stock List */}
      {techVan && vanStock.length === 0 && (
        <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">No stock in this van yet. Transfer items from warehouse.</p>
      )}
      {techVan && vanStock.length > 0 && (
        <div className="space-y-2">
          {vanStock.map(sl => {
            const qty = invDecimal(sl.quantity)
            const item = sl.inventoryItem
            const isLow = item && qty <= (item.reorderPoint ?? 0)
            const isReturning = returningVanItemId === sl.id
            const returnQty = returnQtyMap[sl.id] ?? 1
            return (
              <div key={sl.id}>
                <div className={`flex items-center justify-between p-3 rounded-lg border ${isLow ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{item?.name ?? "Unknown"}</div>
                    <div className="text-xs text-gray-500">{item?.sku} · {item?.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={`text-sm font-bold ${isLow ? "text-amber-700" : "text-gray-900"}`}>{qty}</span>
                      <span className="text-xs text-gray-400 ml-1">{item?.unit ?? "pcs"}</span>
                    </div>
                    <button
                      onClick={() => handleConsume(sl.inventoryItemId, 1)}
                      disabled={consume.isPending || qty <= 0}
                      className="px-2 py-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                      title="Consume 1 unit for this job"
                    >
                      Use 1
                    </button>
                    {warehouse && qty > 0 && (
                      <button
                        onClick={() => {
                          setReturningVanItemId(isReturning ? null : sl.id)
                          setReturnQtyMap(m => ({ ...m, [sl.id]: 1 }))
                        }}
                        className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                        title="Return excess stock to warehouse"
                      >
                        ↩ Return
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline return form */}
                {isReturning && warehouse && (
                  <div className="mt-1 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <span className="text-xs font-semibold text-blue-700 flex-1">Return to warehouse</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReturnQtyMap(m => ({ ...m, [sl.id]: Math.max(1, (m[sl.id] ?? 1) - 1) }))}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-blue-300 rounded text-blue-700 font-bold cursor-pointer"
                      >−</button>
                      <span className="text-sm font-semibold text-gray-900 w-14 text-center">{returnQty} / {qty}</span>
                      <button
                        onClick={() => setReturnQtyMap(m => ({ ...m, [sl.id]: Math.min(qty, (m[sl.id] ?? 1) + 1) }))}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-blue-300 rounded text-blue-700 font-bold cursor-pointer"
                      >+</button>
                    </div>
                    <button
                      onClick={() => handleReturn(sl.inventoryItemId, sl.id)}
                      disabled={returnStock.isPending}
                      className="px-3 py-1.5 text-[11px] font-semibold text-white bg-blue-600 border-0 rounded hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {returnStock.isPending ? <Loader2 size={12} className="animate-spin" /> : "Confirm Return"}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Warehouse stock summary */}
      {warehouse && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Package size={12} /> Warehouse Stock
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {warehouseStock.slice(0, 20).map(sl => {
              const qty = invDecimal(sl.quantity)
              const item = sl.inventoryItem
              return (
                <div key={sl.id} className="flex items-center justify-between px-3 py-2 rounded border border-gray-100 bg-white text-xs">
                  <span className="text-gray-700 font-medium">{item?.name ?? "—"} <span className="text-gray-400">({item?.sku})</span></span>
                  <span className="font-bold text-gray-900">{qty} {item?.unit ?? "pcs"}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


