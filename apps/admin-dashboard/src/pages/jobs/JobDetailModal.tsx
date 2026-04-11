import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, Edit2, Save, XCircle, Wrench, MapPin, User, Calendar,
  DollarSign, FileText, Clock, AlertCircle, Loader2, ArrowRight,
  Send, Receipt, Truck, Package, CheckSquare, ClipboardList,
  Plus, Trash2,
} from "lucide-react";
import {
  useUpdateJobStatus, useJob, useWorkOrdersByJob,
  useCreateWorkOrder, useUpdateWorkOrderTask, useAddWorkOrderTask,
  useUpdateJobTags,
} from "../../hooks/useJobs";
import { useInvoices, useQuotes, useSendInvoice, useSendQuote, decimalToNumber } from "../../hooks/useFinance";
import {
  useCustomerEquipment,
  useAddEquipmentItem,
  useUpdateEquipmentItem,
  useDeleteEquipmentItem,
} from "../../hooks/useEquipment";
import {
  useLocations, useLocationStock, useInventoryItems,
  useTransfer, useConsume, useReturnStock, useEnsureVan, useCheckAvailability, decimalToNumber as invDecimal,
} from "../../hooks/useInventory";
import type { Job, EquipmentRecord } from "../../types/api";

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onCreateQuote?: (job: Job) => void;
  onCreateInvoice?: (job: Job) => void;
}

type TabType = "overview" | "checklist" | "equipment" | "inventory" | "details" | "notes" | "finance" | "activity";

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

const inputView = "w-full px-3 py-2.5 rounded-lg border bg-gray-100 border-transparent text-gray-600 text-sm font-medium";
const inputEdit = "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING:     ["SCHEDULED", "ON_HOLD", "CANCELLED"],
  SCHEDULED:   ["EN_ROUTE", "ON_SITE", "ON_HOLD", "CANCELLED"],
  EN_ROUTE:    ["ON_SITE", "SCHEDULED", "ON_HOLD", "CANCELLED"],
  ON_SITE:     ["COMPLETED", "ON_HOLD", "CANCELLED"],
  COMPLETED:   ["INVOICED", "CANCELLED"],
  INVOICED:    ["PAID", "CANCELLED"],
  PAID:        [],
  CANCELLED:   ["PENDING"],
  ON_HOLD:     ["SCHEDULED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "ON_HOLD", "CANCELLED"],
};

type EqDraft = Partial<EquipmentRecord> & { _tempId?: string };

export default function JobDetailModal({ isOpen, onClose, job, onCreateQuote, onCreateInvoice }: JobDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Equipment editing state
  const [editingEquipment, setEditingEquipment] = useState(false);
  const [eqDraft, setEqDraft] = useState<EqDraft[]>([]);
  const [savingEq, setSavingEq] = useState(false);

  // Checklist add-task state
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskRequired, setNewTaskRequired] = useState(false);

  // Mutations
  const navigate = useNavigate();
  const updateStatus = useUpdateJobStatus();
  const addEqItem = useAddEquipmentItem();
  const updateEqItem = useUpdateEquipmentItem();
  const deleteEqItem = useDeleteEquipmentItem();
  const createWorkOrder = useCreateWorkOrder();
  const updateTask = useUpdateWorkOrderTask();
  const addTask = useAddWorkOrderTask();
  const sendInvoice = useSendInvoice();
  const sendQuote = useSendQuote();

  const isBusy = updateStatus.isPending;

  const jobDetailQuery = useJob(job?.id ?? "");
  const jobDetail = jobDetailQuery.data;
  const statusHistory = jobDetail?.statusHistory ?? [];

  const invoicesQuery = useInvoices({ limit: 50 });
  const quotesQuery = useQuotes({ limit: 50 });
  const jobInvoices = (invoicesQuery.data?.data ?? []).filter(inv => inv.jobId === job?.id);
  const jobQuotes = (quotesQuery.data?.data ?? []).filter(q => q.jobId === job?.id);

  const equipmentQuery = useCustomerEquipment(job?.customerId);
  const workOrdersQuery = useWorkOrdersByJob(job?.id);
  const workOrder = workOrdersQuery.data?.[0];

  useEffect(() => {
    if (job) {
      setEditStatus(job.status);
      setNotes(job.description ?? "");
      setIsEditMode(false);
      setActiveTab("overview");
      setError("");
      setEditingEquipment(false);
      setShowAddTask(false);
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

  const status = STATUS_MAP[job.status] ?? STATUS_MAP.PENDING;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview",  label: "Overview",      icon: <Wrench size={13} /> },
    { id: "checklist", label: "Checklist",      icon: <CheckSquare size={13} /> },
    { id: "equipment", label: "Equipment",      icon: <Package size={13} /> },
    { id: "inventory", label: "Inventory",      icon: <Truck size={13} /> },
    { id: "details",   label: "Schedule",       icon: <Calendar size={13} /> },
    { id: "finance",   label: "Finance",        icon: <DollarSign size={13} /> },
    { id: "activity",  label: "Activity",       icon: <Clock size={13} /> },
    { id: "notes",     label: "Notes",          icon: <FileText size={13} /> },
  ];

  const handleScheduleViaDispatch = () => {
    onClose();
    navigate(`/dispatch?job=${job.id}`);
  };

  const getQuickActions = () => {
    const actions: { label: string; status?: string; css: string; icon: React.ReactNode; onClick?: () => void }[] = [];
    const s = job.status;
    if (s === "PENDING") {
      actions.push({ label: "Schedule", css: "bg-violet-600 hover:bg-violet-700", icon: <Calendar size={14} />, onClick: handleScheduleViaDispatch });
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
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 admin-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full flex flex-col shadow-2xl admin-modal-box"
        style={{ height: 700 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between shadow-lg rounded-t-xl shrink-0">
          <div className="text-white flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-blue-200 text-xs font-semibold tracking-wider">{job.id.slice(0, 8)}…</span>
              <span className={`badge ${status.css} text-xs`} style={{ fontSize: 11 }}>{status.label}</span>
              {job.priority && (
                <span className={`badge ${PRIORITY_CSS[job.priority] ?? "badge-neutral"} text-xs`} style={{ fontSize: 11 }}>{job.priority}</span>
              )}
            </div>
            <h2 className="text-lg font-bold leading-tight truncate">{job.title}</h2>
            <p className="text-blue-100 text-xs mt-0.5 truncate">
              {job.customerName ?? "No customer"}
              {job.assignedToName && ` · Tech: ${job.assignedToName}`}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            {!isEditMode ? (
              <button onClick={() => setIsEditMode(true)} disabled={isBusy} className="flex items-center gap-1.5 text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 disabled:opacity-50">
                <Edit2 size={13} /> Edit
              </button>
            ) : (
              <>
                <button onClick={handleSave} disabled={isBusy} className="flex items-center gap-1.5 text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 disabled:opacity-60">
                  {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                </button>
                <button onClick={() => { setEditStatus(job.status); setIsEditMode(false); setError(""); }} disabled={isBusy} className="flex items-center gap-1.5 text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0">
                  <XCircle size={13} /> Cancel
                </button>
              </>
            )}
            <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-1.5 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0 ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs — scrollable to prevent overflow */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors border-b-2 cursor-pointer bg-transparent whitespace-nowrap ${
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
          <div className="p-6 space-y-6">

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* ── Overview ──────────────────────────────────────────────── */}
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
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)} disabled={isBusy} className={inputEdit}>
                        <option value={job.status}>{STATUS_MAP[job.status]?.label ?? job.status} (current)</option>
                        {(STATUS_TRANSITIONS[job.status] ?? []).map(s => (
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
                              {item.quantity} × ${Number(item.unitPrice).toFixed(2)} = ${Number(item.total).toFixed(2)}
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

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 rounded-b-xl shrink-0 flex items-center justify-between gap-2">
          <div className="flex gap-2 flex-wrap">
            {getQuickActions().map(action => (
              <button
                key={action.label}
                onClick={() => action.onClick ? action.onClick() : action.status ? quickTransition(action.status) : undefined}
                disabled={isBusy}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 border-0 ${action.css}`}
              >
                {isBusy && !action.onClick ? <Loader2 size={14} className="animate-spin" /> : action.icon}
                {action.label}
              </button>
            ))}
            {onCreateQuote && ["PENDING", "SCHEDULED", "EN_ROUTE", "ON_SITE", "COMPLETED"].includes(job.status) && (
              <button onClick={() => onCreateQuote(job)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                <Send size={14} /> Quote
              </button>
            )}
            {onCreateInvoice && ["COMPLETED", "ON_SITE", "INVOICED"].includes(job.status) && (
              <button onClick={() => onCreateInvoice(job)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                <Receipt size={14} /> Invoice
              </button>
            )}
            {job.status !== "CANCELLED" && job.status !== "PAID" && (STATUS_TRANSITIONS[job.status] ?? []).includes("CANCELLED") && (
              <button onClick={() => quickTransition("CANCELLED")} disabled={isBusy} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-60">
                <XCircle size={14} /> Cancel Job
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
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
