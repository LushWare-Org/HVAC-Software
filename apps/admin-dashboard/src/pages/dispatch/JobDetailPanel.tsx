/**
 * JobDetailPanel.tsx — Slide-out panel for viewing full job details
 * from the Dispatch Board's active assignments tab.
 *
 * Shows: Job info, assignment info, status timeline, quick actions
 * (create quote, create invoice, change status), and customer context.
 */

import { useState } from "react";
import {
  X, MapPin, User, Calendar, Clock, DollarSign, FileText,
  Briefcase, Wrench, ArrowRight, Loader2, CheckCircle2,
  AlertCircle, Send, Receipt, Truck, Star,
} from "lucide-react";
import { useJob, useUpdateJobStatus } from "../../hooks/useJobs";
import type { Job, DispatchAssignment, Technician } from "../../types/api";

interface JobDetailPanelProps {
  jobId: string;
  assignment?: DispatchAssignment;
  technician?: Technician;
  isOpen: boolean;
  onClose: () => void;
  onCreateQuote?: (job: Job) => void;
  onCreateInvoice?: (job: Job) => void;
}

const STATUS_MAP: Record<string, { label: string; css: string; color: string }> = {
  PENDING:     { label: "Pending",     css: "bg-amber-100 text-amber-700 border-amber-200",   color: "amber" },
  SCHEDULED:   { label: "Scheduled",   css: "bg-violet-100 text-violet-700 border-violet-200", color: "violet" },
  EN_ROUTE:    { label: "En Route",    css: "bg-blue-100 text-blue-700 border-blue-200",       color: "blue" },
  ON_SITE:     { label: "On Site",     css: "bg-purple-100 text-purple-700 border-purple-200", color: "purple" },
  IN_PROGRESS: { label: "In Progress", css: "bg-blue-100 text-blue-700 border-blue-200",       color: "blue" },
  COMPLETED:   { label: "Completed",   css: "bg-emerald-100 text-emerald-700 border-emerald-200", color: "emerald" },
  INVOICED:    { label: "Invoiced",    css: "bg-cyan-100 text-cyan-700 border-cyan-200",       color: "cyan" },
  PAID:        { label: "Paid",        css: "bg-green-100 text-green-700 border-green-200",    color: "green" },
  CANCELLED:   { label: "Cancelled",   css: "bg-red-100 text-red-700 border-red-200",         color: "red" },
  ON_HOLD:     { label: "On Hold",     css: "bg-gray-100 text-gray-600 border-gray-200",       color: "gray" },
};

const PRIORITY_CSS: Record<string, string> = {
  LOW:       "bg-gray-100 text-gray-600",
  NORMAL:    "bg-blue-50 text-blue-600",
  HIGH:      "bg-amber-100 text-amber-700",
  URGENT:    "bg-red-100 text-red-700",
  EMERGENCY: "bg-red-100 text-red-700",
};

export default function JobDetailPanel({
  jobId,
  assignment,
  technician,
  isOpen,
  onClose,
  onCreateQuote,
  onCreateInvoice,
}: JobDetailPanelProps) {
  const { data: job, isLoading } = useJob(jobId);
  const updateJobStatus = useUpdateJobStatus();
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleQuickTransition = (newStatus: string, note: string) => {
    setError("");
    updateJobStatus.mutate(
      { id: jobId, status: newStatus, statusNote: note },
      { onError: (err: any) => setError(err?.response?.data?.message ?? "Status change failed.") },
    );
  };

  const getQuickActions = () => {
    if (!job) return [];
    const actions: { label: string; status: string; css: string; icon: any; note: string }[] = [];
    const s = job.status;
    if (s === "PENDING") {
      actions.push({ label: "Schedule", status: "SCHEDULED", css: "bg-violet-600 hover:bg-violet-700", icon: Calendar, note: "Scheduled from dispatch" });
      actions.push({ label: "Hold", status: "ON_HOLD", css: "bg-gray-500 hover:bg-gray-600", icon: AlertCircle, note: "Put on hold" });
    } else if (s === "SCHEDULED") {
      actions.push({ label: "Start En Route", status: "EN_ROUTE", css: "bg-blue-600 hover:bg-blue-700", icon: Truck, note: "Tech en route" });
      actions.push({ label: "Arrive On Site", status: "ON_SITE", css: "bg-purple-600 hover:bg-purple-700", icon: MapPin, note: "Tech arrived on site" });
      actions.push({ label: "Hold", status: "ON_HOLD", css: "bg-gray-500 hover:bg-gray-600", icon: AlertCircle, note: "Put on hold" });
    } else if (s === "EN_ROUTE") {
      actions.push({ label: "Arrive On Site", status: "ON_SITE", css: "bg-purple-600 hover:bg-purple-700", icon: MapPin, note: "Tech arrived on site" });
      actions.push({ label: "Hold", status: "ON_HOLD", css: "bg-gray-500 hover:bg-gray-600", icon: AlertCircle, note: "Put on hold" });
    } else if (s === "ON_SITE" || s === "IN_PROGRESS") {
      actions.push({ label: "Complete Job", status: "COMPLETED", css: "bg-emerald-600 hover:bg-emerald-700", icon: CheckCircle2, note: "Job completed" });
      actions.push({ label: "Hold", status: "ON_HOLD", css: "bg-gray-500 hover:bg-gray-600", icon: AlertCircle, note: "Put on hold" });
    } else if (s === "COMPLETED") {
      actions.push({ label: "Mark Invoiced", status: "INVOICED", css: "bg-cyan-600 hover:bg-cyan-700", icon: DollarSign, note: "Invoice created" });
    } else if (s === "ON_HOLD") {
      actions.push({ label: "Resume", status: "SCHEDULED", css: "bg-violet-600 hover:bg-violet-700", icon: Calendar, note: "Resumed from hold" });
    } else if (s === "CANCELLED") {
      actions.push({ label: "Reopen", status: "PENDING", css: "bg-amber-600 hover:bg-amber-700", icon: ArrowRight, note: "Reopened job" });
    }
    return actions;
  };

  const status = STATUS_MAP[job?.status ?? "PENDING"] ?? STATUS_MAP.PENDING;
  const assignedTechName = technician?.name ?? assignment?.technicianName ?? job?.assignedToName ?? "Unassigned";

  return (
    <div className="fixed inset-0 z-[99999] flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" />
      {/* Panel */}
      <div
        className="w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-200 text-xs font-mono">{jobId.slice(0, 12)}…</span>
              {job && (
                <>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${status.css}`}>
                    {status.label}
                  </span>
                  {job.priority && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PRIORITY_CSS[job.priority] ?? ""}`}>
                      {job.priority}
                    </span>
                  )}
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white p-1.5 hover:bg-white/10 rounded-lg cursor-pointer bg-transparent border-0 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-blue-200">
              <Loader2 size={16} className="animate-spin" /> Loading job details…
            </div>
          ) : job ? (
            <>
              <h2 className="text-lg font-bold text-white leading-tight">{job.title}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {job.customerName ?? "No customer"}
                {assignedTechName !== "Unassigned" && ` · Tech: ${assignedTechName}`}
              </p>
            </>
          ) : (
            <p className="text-blue-200 text-sm">Job not found</p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : job ? (
            <div className="p-6 space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Quick Status Actions */}
              {getQuickActions().length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {getQuickActions().map((action) => (
                    <button
                      key={action.status}
                      onClick={() => handleQuickTransition(action.status, action.note)}
                      disabled={updateJobStatus.isPending}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 border-0 ${action.css}`}
                    >
                      {updateJobStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : <action.icon size={14} />}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Job Details Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench size={12} /> Job Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard icon={User} label="Customer" value={job.customerName ?? "—"} />
                  <InfoCard icon={User} label="Technician" value={assignedTechName} />
                  <InfoCard icon={MapPin} label="Address" value={job.serviceAddress ?? job.customerAddress ?? "—"} full />
                  {job.jobTypeName && <InfoCard icon={Wrench} label="Job Type" value={job.jobTypeName} />}
                  <InfoCard icon={Calendar} label="Scheduled Start" value={job.scheduledStart ? new Date(job.scheduledStart).toLocaleString() : "—"} />
                  <InfoCard icon={Clock} label="Scheduled End" value={job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleString() : "—"} />
                  <InfoCard icon={DollarSign} label="Estimated" value={job.estimatedAmount != null ? `$${Number(job.estimatedAmount).toLocaleString()}` : "—"} />
                  <InfoCard icon={DollarSign} label="Final Amount" value={job.finalAmount != null ? `$${Number(job.finalAmount).toLocaleString()}` : "—"} />
                </div>
                {job.description && (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1.5">Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{job.description}</p>
                  </div>
                )}
              </div>

              {/* Assignment Details */}
              {assignment && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase size={12} /> Assignment Info
                  </h3>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                          {technician?.name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{technician?.name ?? "Unknown"}</p>
                          {technician?.phone && <p className="text-xs text-gray-500">{technician.phone}</p>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        assignment.status === "ASSIGNED" ? "bg-blue-100 text-blue-700 border-blue-200"
                        : assignment.status === "EN_ROUTE" ? "bg-amber-100 text-amber-700 border-amber-200"
                        : assignment.status === "ON_SITE" ? "bg-purple-100 text-purple-700 border-purple-200"
                        : assignment.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}>
                        {assignment.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {assignment.score != null && (
                        <div className="bg-white rounded-lg p-2 border border-blue-100">
                          <Star size={12} className="mx-auto text-amber-400 mb-0.5" />
                          <p className="text-xs font-bold text-gray-700">{assignment.score.toFixed(1)}</p>
                          <p className="text-[9px] text-gray-400">Score</p>
                        </div>
                      )}
                      {assignment.distanceKm != null && (
                        <div className="bg-white rounded-lg p-2 border border-blue-100">
                          <MapPin size={12} className="mx-auto text-blue-400 mb-0.5" />
                          <p className="text-xs font-bold text-gray-700">{Number(assignment.distanceKm).toFixed(1)} km</p>
                          <p className="text-[9px] text-gray-400">Distance</p>
                        </div>
                      )}
                      <div className="bg-white rounded-lg p-2 border border-blue-100">
                        <Clock size={12} className="mx-auto text-gray-400 mb-0.5" />
                        <p className="text-xs font-bold text-gray-700">{new Date(assignment.assignedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="text-[9px] text-gray-400">Assigned At</p>
                      </div>
                    </div>
                    {/* Timeline */}
                    <div className="flex items-center justify-between pt-2">
                      {[
                        { label: "Assigned", time: assignment.assignedAt },
                        { label: "En Route", time: assignment.enRouteAt },
                        { label: "On Site", time: assignment.onSiteAt },
                        { label: "Completed", time: assignment.completedAt },
                      ].map((step, i) => (
                        <div key={step.label} className="flex items-center gap-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full border-2 ${step.time ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"}`} />
                            <span className={`text-[8px] mt-0.5 ${step.time ? "text-gray-700 font-medium" : "text-gray-400"}`}>{step.label}</span>
                            {step.time && (
                              <span className="text-[7px] text-gray-400">{new Date(step.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            )}
                          </div>
                          {i < 3 && <div className={`w-8 h-0.5 ${step.time ? "bg-emerald-400" : "bg-gray-200"} mb-4`} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* GPS Info */}
              {(job.serviceLatitude && job.serviceLongitude) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} /> Location
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <MapPin size={14} className="text-emerald-500 shrink-0" />
                    <span>{job.serviceLatitude}, {job.serviceLongitude}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 ml-auto">GPS</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <AlertCircle size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Job not found</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {job && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 shrink-0">
            <div className="flex items-center gap-2">
              {/* Create Quote button — show for SCHEDULED, EN_ROUTE, ON_SITE, COMPLETED */}
              {["SCHEDULED", "EN_ROUTE", "ON_SITE", "COMPLETED", "PENDING"].includes(job.status) && onCreateQuote && (
                <button
                  onClick={() => onCreateQuote(job)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                >
                  <Send size={14} /> Create Quote
                </button>
              )}
              {/* Create Invoice button — show for COMPLETED, ON_SITE */}
              {["COMPLETED", "ON_SITE", "INVOICED"].includes(job.status) && onCreateInvoice && (
                <button
                  onClick={() => onCreateInvoice(job)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Receipt size={14} /> Create Invoice
                </button>
              )}
              {/* Cancel Job — show for any status where CANCELLED is a valid transition */}
              {job.status !== "CANCELLED" && job.status !== "PAID" &&
               ["PENDING","SCHEDULED","EN_ROUTE","ON_SITE","COMPLETED","INVOICED","ON_HOLD"].includes(job.status) && (
                <button
                  onClick={() => handleQuickTransition("CANCELLED", "Cancelled from dispatch")}
                  disabled={updateJobStatus.isPending}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <X size={14} /> Cancel Job
                </button>
              )}
              {/* View full details in Jobs page */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-job-detail", { detail: job }));
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ml-auto"
              >
                <FileText size={14} /> Full Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, full = false }: { icon: any; label: string; value: string; full?: boolean }) {
  return (
    <div className={`bg-gray-50 border border-gray-100 rounded-lg p-3 ${full ? "col-span-2" : ""}`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
        <Icon size={10} /> {label}
      </p>
      <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
    </div>
  );
}
