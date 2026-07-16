/**
 * DispatchBoard.tsx — Smart Scheduling & Dispatch Board
 *
 * Full workflow:
 *  1. View unassigned (PENDING) jobs
 *  2. Smart-assign → system scores nearby techs (distance 40%, workload 35%, rating 25%)
 *     - If score ≥ 90 → auto-assigned
 *     - If score < 90 → top-3 suggestions for dispatcher to pick
 *  3. Manual-assign → dispatcher picks a tech directly
 *  4. Track assignment lifecycle: ASSIGNED → EN_ROUTE → ON_SITE → COMPLETED
 *  5. Manage technician pool
 *  6. Map overview of technicians + job sites
 */

import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Zap, UserPlus, MapPin, Star, Briefcase,
  CheckCircle2, Clock, AlertCircle, Loader2,
  Users, Wrench, RefreshCw, Search, X, Truck, Phone,
  Activity, Target, Plus, Map, CalendarDays,
} from "lucide-react";
import {
  useTechnicians, useSmartAssign, useManualAssign,
  useUpdateAssignmentStatus, useAllTechAssignments,
  useDispatchWebSocket, useTechnicianLoginMap,
} from "../../hooks/useScheduling";
import { useJobs, useUpdateJobStatus } from "../../hooks/useJobs";
import type {
  Job, Technician, AssignResponse, ScoredTechnician,
} from "../../types/api";
import AddTechnicianModal from "../../components/AddTechnicianModal";
import CreateJobModal from "./CreateJobModal";
import JobDetailPanel from "./JobDetailPanel";
import TechnicianDetailPanel from "./TechnicianDetailPanel";
import AddQuoteModal from "../finance/AddQuoteModal";
import AddInvoiceModal from "../finance/AddInvoiceModal";
import DispatchCalendar from "./DispatchCalendar";
import { formatMoney } from '../../lib/format'
import { techOnProjectMessage } from "../projects/projectsApi";
import Avatar from "../../components/Avatar";

// ─── Status helpers ────────────────────────────────────────────────────────────


const ASSIGN_STATUS_NEXT: Record<string, { label: string; status: string; icon: any }> = {
  ASSIGNED: { label: "Mark En Route", status: "EN_ROUTE", icon: Truck },
  EN_ROUTE: { label: "Arrived On Site", status: "ON_SITE", icon: MapPin },
  ON_SITE: { label: "Mark Completed", status: "COMPLETED", icon: CheckCircle2 },
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : score >= 70 ? "text-blue-600 bg-blue-50 border-blue-200"
    : score >= 50 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      <Target size={10} /> {score.toFixed(1)}
    </span>
  );
}

// ─── Suggestions Panel ─────────────────────────────────────────────────────────

function SuggestionsPanel({
  suggestions,
  onPick,
  isPending,
  onDismiss,
}: {
  suggestions: ScoredTechnician[];
  onPick: (techId: string) => void;
  isPending: boolean;
  onDismiss: () => void;
}) {
  if (!suggestions?.length) return null;
  return (
    <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
          <Users size={16} /> Top Technician Suggestions
        </h4>
        <button onClick={onDismiss} className="text-blue-400 hover:text-blue-600 p-1 rounded bg-transparent border-0 cursor-pointer">
          <X size={14} />
        </button>
      </div>
      <p className="text-xs text-blue-700">
        No technician scored above 90. Review the score breakdown and pick one below.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {suggestions.map((s, idx) => (
          <div key={s.technician.id} className="bg-white rounded-lg border border-blue-100 p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  #{idx + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{s.technician.name}</p>
                  <p className="text-[10px] text-gray-500">{s.activeJobs} active job{s.activeJobs !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <ScoreBadge score={s.score} />
            </div>
            {/* Score breakdown */}
            <div className="space-y-1.5">
              <ScoreBar label="Distance" score={s.distanceScore} weight="40%" color="bg-blue-500" />
              <ScoreBar label="Workload" score={s.workloadScore} weight="35%" color="bg-green-500" />
              <ScoreBar label="Rating" score={s.ratingScore} weight="25%" color="bg-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <MapPin size={12} className="mx-auto text-gray-400 mb-1" />
                <p className="text-xs font-bold text-gray-700">{s.distanceKm.toFixed(1)} km</p>
                <p className="text-[9px] text-gray-400">Distance</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <Briefcase size={12} className="mx-auto text-gray-400 mb-1" />
                <p className="text-xs font-bold text-gray-700">{s.activeJobs}/{s.technician.maxDailyJobs}</p>
                <p className="text-[9px] text-gray-400">Workload</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <Star size={12} className="mx-auto text-amber-400 mb-1" />
                <p className="text-xs font-bold text-gray-700">{(s.technician.rating ?? 0).toFixed(1)}</p>
                <p className="text-[9px] text-gray-400">Rating</p>
              </div>
            </div>
            {/* Skills */}
            {s.technician.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {s.technician.skills.map((sk) => (
                  <span key={sk} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-medium">{sk}</span>
                ))}
              </div>
            )}
            <button
              onClick={() => onPick(s.technician.id)}
              disabled={isPending}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer border-0 flex items-center justify-center gap-1.5"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Assign This Tech
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Score bar component ───────────────────────────────────────────────────────

function ScoreBar({ label, score, weight, color }: { label: string; score: number; weight: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-500 w-14 shrink-0">{label} <span className="text-gray-400">({weight})</span></span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-[9px] font-bold text-gray-600 w-8 text-right">{score.toFixed(0)}</span>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Main DispatchBoard Component
// ═══════════════════════════════════════════════════════════════════════════════

function timeElapsed(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

// ─── Technician availability ───────────────────────────────────────────────────
// Sources: scheduling.last_seen_at (GPS/WS pings + login stamp) + crm.lastLoginAt
// Tiers: ONLINE < 15 min · AVAILABLE < 8 h · AWAY < 24 h · OFFLINE ≥ 24 h / never
export type AvailabilityTier = "ONLINE" | "AVAILABLE" | "AWAY" | "OFFLINE";

export function getTechAvailability(tech: { lastSeenAt?: string; locationUpdatedAt?: string }, lastLoginAt?: string): AvailabilityTier {
  const signals = [tech.lastSeenAt, tech.locationUpdatedAt, lastLoginAt]
    .filter(Boolean).map(d => new Date(d!).getTime());
  if (!signals.length) return "OFFLINE";
  const newest = Math.max(...signals);
  const mins = (Date.now() - newest) / 60000;
  if (mins < 15)       return "ONLINE";
  if (mins < 8 * 60)   return "AVAILABLE";
  if (mins < 24 * 60)  return "AWAY";
  return "OFFLINE";
}

export const AVAIL_META: Record<AvailabilityTier, { label: string; color: string; dot: string; dim: number }> = {
  ONLINE:    { label: "Online",    color: "#10b981", dot: "#10b981", dim: 1 },
  AVAILABLE: { label: "Available", color: "#2563eb", dot: "#2563eb", dim: 1 },
  AWAY:      { label: "Away",      color: "#f59e0b", dot: "#f59e0b", dim: 0.75 },
  OFFLINE:   { label: "Offline",   color: "#9ca3af", dot: "#9ca3af", dim: 0.45 },
};


type ViewTab = "unassigned" | "active" | "technicians" | "completed" | "calendar" | "map";

// Lazy-load map to avoid loading leaflet on initial page load
const DispatchMap = lazy(() => import("./DispatchMap"));

export default function DispatchBoard() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("view") === "calendar" ? "calendar" : "unassigned";
  const [tab, setTab] = useState<ViewTab>(initialTab);
  const [search, setSearch] = useState("");
  const [showAddTech, setShowAddTech] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Smart assign state
  const [suggestions, setSuggestions] = useState<AssignResponse["suggestions"] | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [pendingJobLat, setPendingJobLat] = useState(0);
  const [pendingJobLng, setPendingJobLng] = useState(0);
  const [noTechsWarning, setNoTechsWarning] = useState("");

  // WebSocket
  const ws = useDispatchWebSocket();

  useEffect(() => {
    if (searchParams.get("view") === "calendar") {
      setTab("calendar");
    }
  }, [searchParams]);

  // Data
  const techsQuery = useTechnicians();
  const techs: Technician[] = techsQuery.data ?? [];
  const loginMap = useTechnicianLoginMap(); // userId → lastLoginAt from CRM
  const techIds = useMemo(() => techs.map(t => t.id), [techs]);

  const pendingJobsQuery = useJobs({ status: "PENDING", limit: 50 });
  const pendingJobs: Job[] = pendingJobsQuery.data?.data ?? [];
  const allJobsQuery = useJobs({ limit: 200 });
  const allJobs: Job[] = allJobsQuery.data?.data ?? [];

  // Open a specific job when navigated from job modal with ?job=<id>
  useEffect(() => {
    const jobId = searchParams.get("job");
    if (!jobId || allJobs.length === 0) return;
    const found = allJobs.find(j => j.id === jobId) ?? pendingJobs.find(j => j.id === jobId);
    if (found) {
      setSelectedJob(found);
    }
  }, [searchParams, allJobs, pendingJobs]);

  const allAssignmentsQuery = useAllTechAssignments(techIds);
  const allAssignments = allAssignmentsQuery.data ?? [];

  // De-duplicate by jobId: when multiple assignment rows exist for the same job
  // (e.g. after a tech reassignment where the old row wasn't yet cancelled),
  // keep only the most-recently updated one per job.
  const assignmentByJobId = useMemo(() => {
    return allAssignments.reduce<Record<string, typeof allAssignments[number]>>((acc, assignment) => {
      const current = acc[assignment.jobId];
      if (!current) {
        acc[assignment.jobId] = assignment;
        return acc;
      }
      const currentTime = new Date(current.updatedAt ?? current.assignedAt ?? 0).getTime();
      const nextTime = new Date(assignment.updatedAt ?? assignment.assignedAt ?? 0).getTime();
      if (nextTime >= currentTime) {
        acc[assignment.jobId] = assignment;
      }
      return acc;
    }, {});
  }, [allAssignments]);

  // Derive active assignments from the de-duplicated map so that a reassigned
  // job shows up exactly once (with the new tech), never twice.
  const activeAssignments = useMemo(
    () => Object.values(assignmentByJobId).filter(a => ["ASSIGNED", "EN_ROUTE", "ON_SITE"].includes(a.status)),
    [assignmentByJobId],
  );

  const TERMINAL = ['CANCELLED', 'COMPLETED', 'INVOICED', 'PAID'] as const;
  const activeJobs = allJobs.filter(job => !TERMINAL.includes(job.status as any));
  const assignedJobs = activeJobs.filter(job => !!assignmentByJobId[job.id]);
  const unassignedJobs = activeJobs.filter(job => !assignmentByJobId[job.id]);

  // Mutations
  const smartAssign = useSmartAssign();
  const manualAssign = useManualAssign();
  const updateStatus = useUpdateAssignmentStatus();
  const updateJobStatus = useUpdateJobStatus();

  // Job detail for active assignment click
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Finance modals from job context
  const [showQuoteFromJob, setShowQuoteFromJob] = useState(false);
  const [showInvoiceFromJob, setShowInvoiceFromJob] = useState(false);
  const [financeContextJob, setFinanceContextJob] = useState<Job | null>(null);

  // Auto-dismiss success messages after 4 seconds
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSmartAssign = (job: Job) => {
    setError("");
    setNoTechsWarning("");
    setSuggestions(null);
    setPendingJobId(job.id);

    const lat = job.serviceLatitude ? parseFloat(job.serviceLatitude) : 40.7128;
    const lng = job.serviceLongitude ? parseFloat(job.serviceLongitude) : -74.006;
    setPendingJobLat(lat);
    setPendingJobLng(lng);

    smartAssign.mutate(
      { jobId: job.id, jobLatitude: lat, jobLongitude: lng },
      {
        onSuccess: (res) => {
          if (res.autoAssigned) {
            // Auto-assigned! Update job status to SCHEDULED, show success
            setSuggestions(null);
            setPendingJobId(null);
            updateJobStatus.mutate({ id: job.id, status: "SCHEDULED", statusNote: "Auto-assigned via smart dispatch" });
            showSuccess(`Job auto-assigned to technician (score >= 90). Assignment created.`);
            pendingJobsQuery.refetch();
          } else if (res.suggestions && res.suggestions.length > 0) {
            // Got suggestions — show the panel
            setSuggestions(res.suggestions);
          } else {
            // NO candidates found — show clear warning
            setSuggestions(null);
            setPendingJobId(null);
            setNoTechsWarning(
              "No technicians found nearby. Make sure technicians are registered with GPS coordinates (latitude & longitude) and are within 50 km of the job location."
            );
          }
        },
        onError: (err: any) => {
          setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Smart assign failed. Is the scheduling service running?");
          setPendingJobId(null);
        },
      },
    );
  };

  const handlePickSuggestion = (techId: string) => {
    if (!pendingJobId) return;
    setError("");
    const jobId = pendingJobId;
    manualAssign.mutate(
      { jobId, technicianId: techId, jobLatitude: pendingJobLat, jobLongitude: pendingJobLng },
      {
        onSuccess: () => {
          setSuggestions(null);
          setPendingJobId(null);
          updateJobStatus.mutate({ id: jobId, status: "SCHEDULED", statusNote: "Assigned via dispatcher suggestion pick" });
          showSuccess("Technician assigned successfully!");
          pendingJobsQuery.refetch();
        },
        onError: (err: any) => setError(techOnProjectMessage(err) ?? err?.response?.data?.error ?? "Manual assign failed."),
      },
    );
  };

  const handleManualAssign = (jobId: string, techId: string) => {
    setError("");
    const job = allJobs.find(j => j.id === jobId) ?? pendingJobs.find(j => j.id === jobId);
    const lat = job?.serviceLatitude ? parseFloat(job.serviceLatitude) : 40.7128;
    const lng = job?.serviceLongitude ? parseFloat(job.serviceLongitude) : -74.006;
    manualAssign.mutate(
      { jobId, technicianId: techId, jobLatitude: lat, jobLongitude: lng },
      {
        onSuccess: () => {
          updateJobStatus.mutate({ id: jobId, status: "SCHEDULED", statusNote: "Manually assigned via dispatch board" });
          showSuccess("Job manually assigned!");
          pendingJobsQuery.refetch();
          allJobsQuery.refetch();
        },
        onError: (err: any) => setError(techOnProjectMessage(err) ?? err?.response?.data?.error ?? "Assignment failed."),
      },
    );
  };

  const handleOpenJob = (job: Job, assignment?: typeof allAssignments[number]) => {
    setSelectedJob(job);
    setSelectedAssignment(assignment ?? null);
  };

  // Map assignment status → job status
  const ASSIGNMENT_TO_JOB_STATUS: Record<string, string> = {
    EN_ROUTE: "EN_ROUTE",
    ON_SITE: "ON_SITE",
    COMPLETED: "COMPLETED",
  };

  const handleStatusTransition = (assignmentId: string, newStatus: string, jobId?: string) => {
    setError("");
    updateStatus.mutate(
      { id: assignmentId, status: newStatus },
      {
        onSuccess: () => {
          // Sync job status with assignment status
          const mappedJobStatus = ASSIGNMENT_TO_JOB_STATUS[newStatus];
          if (mappedJobStatus && jobId) {
            updateJobStatus.mutate({ id: jobId, status: mappedJobStatus, statusNote: `Assignment status changed to ${newStatus}` });
          }
        },
        onError: (err: any) => setError(err?.response?.data?.error ?? "Status update failed."),
      },
    );
  };

  // ─── Filtered data ─────────────────────────────────────────────────────────

  const filteredPendingJobs = pendingJobs
    .filter(j =>
      !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.customerName?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const nowMs = Date.now();
  const futurePendingJobs = filteredPendingJobs.filter((job) => {
    if (!job.scheduledStart) return true;
    return new Date(job.scheduledStart).getTime() >= nowMs;
  });
  const pastPendingJobs = filteredPendingJobs
    .filter((job) => !!job.scheduledStart && new Date(job.scheduledStart).getTime() < nowMs)
    .sort((a, b) => new Date(b.scheduledStart ?? 0).getTime() - new Date(a.scheduledStart ?? 0).getTime());

  // Build the active-assignments list from the de-duplicated map.
  // Using activeAssignments (already de-duped) guarantees each job appears once
  // even if the raw DB still has stale rows from a previous tech reassignment.
  const activeAssignmentsWithJob = useMemo(() => activeAssignments
    .map(a => ({
      assignment: a,
      technician: techs.find(t => t.id === a.technicianId),
      job: allJobs.find(j => j.id === (a as any).jobId),
    }))
    .filter(({ assignment, technician, job }) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [
        technician?.name,
        job?.title,
        job?.id,
        job?.customerName,
        (assignment as any).jobId,
      ].some(v => String(v ?? '').toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const aTime = new Date((a.assignment as any).assignedAt ?? 0).getTime();
      const bTime = new Date((b.assignment as any).assignedAt ?? 0).getTime();
      return bTime - aTime;
    }), [activeAssignments, techs, allJobs, search]);

  const filteredTechs = techs.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="anim-fade-up space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* The page canvas is dark navy in every theme (incl. light), so the
              on-canvas header must always use light text — var(--t1) is
              near-black in light theme and disappears. */}
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Zap size={24} className="text-amber-500" /> Dispatch Board
          </h1>
          <p className="text-sm text-slate-400 mt-1">Smart technician assignment with distance, workload & rating scoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${ws.status === "connected" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ws.status === "connecting" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            <div className={`w-2 h-2 rounded-full ${ws.status === "connected" ? "bg-emerald-500" : ws.status === "connecting" ? "bg-amber-500 animate-pulse" : "bg-red-500"}`} />
            {ws.status === "connected" ? "Live" : ws.status === "connecting" ? "Connecting…" : "Offline"}
          </div>
          <button onClick={() => setShowAddTech(true)} className="btn btn-secondary btn-sm flex items-center gap-1.5">
            <UserPlus size={14} /> Add Technician
          </button>
          <button onClick={() => setShowCreateJob(true)} className="btn btn-primary btn-sm flex items-center gap-1.5">
            <Plus size={14} /> Create Job
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Clock, label: "Unassigned Jobs", value: pendingJobs.length, color: "text-amber-600", bg: "bg-amber-50" },
          { icon: Activity, label: "Active Assignments", value: activeAssignments.length, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: Users, label: "Technicians", value: techs.length, color: "text-purple-600", bg: "bg-purple-50" },
          { icon: CheckCircle2, label: "Completed", value: allJobs.filter(j => ["COMPLETED", "INVOICED", "PAID"].includes(j.status)).length, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
              <k.icon size={20} className={k.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--t1)]">{k.value}</p>
              <p className="text-xs text-[var(--t3)]">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          <CheckCircle2 size={14} /> {successMsg}
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-600 p-1 bg-transparent border-0 cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {noTechsWarning && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <AlertCircle size={14} /> {noTechsWarning}
          <button onClick={() => setNoTechsWarning("")} className="ml-auto text-amber-400 hover:text-amber-600 p-1 bg-transparent border-0 cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 p-1 bg-transparent border-0 cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* Suggestions Panel */}
      {suggestions && pendingJobId && (
        <SuggestionsPanel
          suggestions={suggestions}
          onPick={handlePickSuggestion}
          isPending={manualAssign.isPending}
          onDismiss={() => { setSuggestions(null); setPendingJobId(null); }}
        />
      )}

      {/* Tabs */}
      <div className="page-tabs">
        <button className={`tab-btn ${tab === "unassigned" ? "active" : ""}`} onClick={() => setTab("unassigned")}>
          <Clock size={14} /> Unassigned Jobs <span className="tab-count">{pendingJobs.length}</span>
        </button>
        <button className={`tab-btn ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>
          <Activity size={14} /> Active Assignments <span className="tab-count">{activeAssignments.length}</span>
        </button>
        <button className={`tab-btn ${tab === "technicians" ? "active" : ""}`} onClick={() => setTab("technicians")}>
          <Users size={14} /> Technicians <span className="tab-count">{techs.length}</span>
        </button>
        <button className={`tab-btn ${tab === "completed" ? "active" : ""}`} onClick={() => setTab("completed")}>
          <CheckCircle2 size={14} /> Completed <span className="tab-count">{allJobs.filter(j => ["COMPLETED", "INVOICED", "PAID"].includes(j.status)).length}</span>
        </button>
        <button className={`tab-btn ${tab === "calendar" ? "active" : ""}`} onClick={() => setTab("calendar")}>
          <CalendarDays size={14} /> Calendar View
        </button>
        <button className={`tab-btn ${tab === "map" ? "active" : ""}`} onClick={() => setTab("map")}>
          <Map size={14} /> Map View
        </button>
      </div>

      {/* ── Tab: Unassigned Jobs ── */}
      {tab === "unassigned" && (
        <div className="card anim-fade-in">
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="filter-bar">
              <div className="filter-search"><Search size={13} color="var(--t4)" /><input placeholder="Search jobs…" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" onClick={() => pendingJobsQuery.refetch()}>
                  <RefreshCw size={12} /> Refresh
                </button>
                <button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={() => setShowCreateJob(true)}>
                  <Plus size={12} /> New Job
                </button>
              </div>
            </div>
          </div>
          <div className="card-body-flush mt-2">
            {pendingJobsQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-[var(--t4)]"><Loader2 size={24} className="animate-spin mr-2" /> Loading jobs…</div>
            ) : futurePendingJobs.length === 0 ? (
              <div className="text-center py-16 text-[var(--t4)]">
                <CheckCircle2 size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No upcoming jobs waiting for dispatch.</p>
                <p className="text-xs mt-1">Future jobs are clear. Review past unassigned jobs in the section below.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {futurePendingJobs.map(job => (
                  <div key={job.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-hover)] transition-colors group cursor-pointer" onClick={() => handleOpenJob(job, assignmentByJobId[job.id])}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-[var(--t1)] truncate">{job.title}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${job.priority === "EMERGENCY" || job.priority === "HIGH" ? "bg-red-100 text-red-700" : job.priority === "NORMAL" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                          {job.priority}
                        </span>
                        {job.serviceLatitude && job.serviceLongitude ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-0.5">
                            <MapPin size={8} /> GPS
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
                            No GPS
                          </span>
                        )}
                        {job.jobTypeName && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-50 text-purple-600 border border-purple-200">
                            {job.jobTypeName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--t3)]">
                        <span className="flex items-center gap-1"><Users size={11} /> {job.customerName ?? "—"}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {job.serviceAddress ?? job.customerAddress ?? "No address"}</span>
                        {job.scheduledStart && <span className="flex items-center gap-1"><Clock size={11} /> {new Date(job.scheduledStart).toLocaleDateString()} {new Date(job.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                            {job.scheduledStart && new Date(job.scheduledStart) < new Date() && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">
                                Overdue
                              </span>
                            )}
                      </div>
                    </div>

                    {/* Manual assign dropdown */}
                    <select
                      defaultValue=""
                      onClick={e => e.stopPropagation()}
                      onChange={e => { if (e.target.value) handleManualAssign(job.id, e.target.value); e.target.value = ""; }}
                      className="text-xs border rounded-lg px-2 py-1.5 bg-white text-gray-600 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                      style={{ minWidth: 150 }}
                    >
                      <option value="" disabled>Manual assign…</option>
                      {techs.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>

                    {/* Smart assign button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSmartAssign(job); }}
                      disabled={smartAssign.isPending && pendingJobId === job.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer border-0 shadow-sm"
                    >
                      {smartAssign.isPending && pendingJobId === job.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Zap size={12} />}
                      Smart Assign
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pastPendingJobs.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 px-5 py-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--t1)]">Past Unassigned Jobs</h4>
                    <p className="text-xs text-[var(--t3)] mt-1">These job windows are already in the past and are shown separately for follow-up, review, or rescheduling.</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                    {pastPendingJobs.length} overdue
                  </span>
                </div>

                <div className="space-y-3">
                  {pastPendingJobs.map((job) => {
                    const scheduled = job.scheduledStart ? new Date(job.scheduledStart) : null;
                    const overdueMs = scheduled ? Date.now() - scheduled.getTime() : 0;
                    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
                    const overdueDays = Math.floor(overdueHours / 24);
                    const overdueLabel = overdueDays > 0
                      ? `${overdueDays}d ${overdueHours % 24}h overdue`
                      : `${Math.max(overdueHours, 1)}h overdue`;

                    return (
                      <div key={job.id} className="rounded-xl border border-red-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold text-[var(--t1)] truncate">{job.title}</p>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">Past</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--t3)]">
                              <span className="flex items-center gap-1"><Users size={11} /> {job.customerName ?? '—'}</span>
                              <span className="flex items-center gap-1"><MapPin size={11} /> {job.serviceAddress ?? job.customerAddress ?? 'No address'}</span>
                              <span className="flex items-center gap-1"><Clock size={11} /> {scheduled ? `${scheduled.toLocaleDateString()} ${scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No schedule'}</span>
                              <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold">{overdueLabel}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenJob(job, assignmentByJobId[job.id])}
                            className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Active Assignments ── */}
      {tab === "active" && (() => {
        const CARD_STATUS: Record<string, { color: string; bg: string; border: string; label: string }> = {
          ASSIGNED:  { color: "#2563eb", bg: "rgba(37,99,235,0.07)",  border: "rgba(37,99,235,0.18)",  label: "Assigned" },
          EN_ROUTE:  { color: "#d97706", bg: "rgba(217,119,6,0.07)",  border: "rgba(217,119,6,0.18)",  label: "En Route" },
          ON_SITE:   { color: "#7c3aed", bg: "rgba(124,58,237,0.07)", border: "rgba(124,58,237,0.18)", label: "On Site" },
          COMPLETED: { color: "#10b981", bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.18)", label: "Completed" },
        };
        const TL_ORDER = ["ASSIGNED", "EN_ROUTE", "ON_SITE", "COMPLETED"];
        const TL_LABELS = ["Assigned", "En Route", "On Site", "Done"];

        return (
          <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Toolbar */}
            <div className="card">
              <div className="card-body" style={{ paddingBottom: 12 }}>
                <div className="filter-bar">
                  <div className="filter-search">
                    <Search size={13} color="var(--t4)" />
                    <input placeholder="Search jobs, customer, technician…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}
                    onClick={() => { allAssignmentsQuery.refetch(); allJobsQuery.refetch(); }}>
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
              </div>
            </div>

            {allAssignmentsQuery.isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "var(--t4)" }}>
                <Loader2 size={22} className="animate-spin" style={{ marginRight: 8 }} /> Loading assignments…
              </div>
            ) : activeAssignmentsWithJob.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
                <Briefcase size={34} style={{ margin: "0 auto 12px", display: "block", opacity: 0.2, color: "var(--t3)" }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t2)" }}>No active assignments</div>
                <div style={{ fontSize: 12, color: "var(--t4)", marginTop: 4 }}>Assign jobs from the Unassigned tab to get started.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 12 }}>
                {activeAssignmentsWithJob.map(({ assignment: a, technician: tech, job }) => {
                  const st = CARD_STATUS[a.status] ?? CARD_STATUS.ASSIGNED;
                  const next = ASSIGN_STATUS_NEXT[a.status];
                  const elapsed = a.assignedAt ? timeElapsed(a.assignedAt) : null;
                  const currentIdx = TL_ORDER.indexOf(a.status);

                  return (
                    <div
                      key={a.id}
                      onClick={() => {
                        if (job) { handleOpenJob(job, a); return; }
                        setSelectedAssignment(a);
                        setSelectedJob({ id: (a as any).jobId, title: "Job" } as Job);
                      }}
                      style={{
                        background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: "var(--r-md)",
                        borderLeft: `3px solid ${st.color}`, cursor: "pointer",
                        display: "flex", flexDirection: "column", overflow: "hidden",
                        transition: "box-shadow 0.15s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.09)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                    >
                      {/* Card top: tech info + status/elapsed */}
                      <div style={{ padding: "13px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <Avatar name={tech?.name} avatarUrl={tech?.avatarUrl} size={34} radius={17} fontSize={13} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", lineHeight: 1.2 }}>
                              {tech?.name ?? "Technician unavailable"}
                            </div>
                            {tech?.phone && (
                              <div style={{ fontSize: 10, color: "var(--t4)", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                                <Phone size={8} /> {tech.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                          {elapsed && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", background: "var(--bg-hover)", padding: "2px 7px", borderRadius: 8 }}>
                              {elapsed}
                            </span>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`, padding: "2px 9px", borderRadius: 10 }}>
                            {st.label}
                          </span>
                        </div>
                      </div>

                      {/* Job info */}
                      <div style={{ padding: "0 14px 11px", borderBottom: "1px solid var(--bd)" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job?.title ?? "Job details unavailable"}
                        </div>
                        {job?.customerName && (
                          <div style={{ fontSize: 11, color: "var(--t3)", display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                            <Users size={10} style={{ flexShrink: 0 }} /> {job.customerName}
                          </div>
                        )}
                        {(job?.serviceAddress ?? job?.customerAddress) && (
                          <div style={{ fontSize: 10, color: "var(--t4)", display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                            <MapPin size={9} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {job?.serviceAddress ?? job?.customerAddress}
                            </span>
                          </div>
                        )}
                        {/* Meta chips */}
                        <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
                          {a.distanceKm != null && (
                            <span style={{ fontSize: 10, color: "var(--t4)", background: "var(--bg-hover)", padding: "2px 7px", borderRadius: 8, display: "flex", alignItems: "center", gap: 3 }}>
                              <MapPin size={8} /> {Number(a.distanceKm).toFixed(1)} km
                            </span>
                          )}
                          {a.score != null && (
                            <span style={{ fontSize: 10, color: "var(--t4)", background: "var(--bg-hover)", padding: "2px 7px", borderRadius: 8, display: "flex", alignItems: "center", gap: 3 }}>
                              <Target size={8} /> {Number(a.score).toFixed(0)}
                            </span>
                          )}
                          {a.assignedBy ? (
                            <span style={{ fontSize: 10, color: "var(--t4)", background: "var(--bg-hover)", padding: "2px 7px", borderRadius: 8 }}>Manual</span>
                          ) : (
                            <span style={{ fontSize: 10, color: "#d97706", background: "rgba(217,119,6,0.08)", padding: "2px 7px", borderRadius: 8 }}>
                              <Zap size={8} style={{ display: "inline", marginRight: 2, verticalAlign: "middle" }} />Auto
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Timeline */}
                      <div style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start" }}>
                          {TL_LABELS.map((label, i) => {
                            const isDone = i < currentIdx;
                            const isCurrent = i === currentIdx;
                            const dotColor = isCurrent ? st.color : isDone ? "#10b981" : "var(--bd)";
                            const timeVal = [a.assignedAt, a.enRouteAt, a.onSiteAt, a.completedAt][i];
                            return (
                              <div key={label} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: (isDone || isCurrent) ? dotColor : "var(--bg-hover)", border: `2px solid ${dotColor}`, transition: "all 0.2s" }} />
                                  <span style={{ fontSize: 8, color: (isDone || isCurrent) ? "var(--t2)" : "var(--t4)", fontWeight: (isDone || isCurrent) ? 600 : 400, marginTop: 3, whiteSpace: "nowrap" }}>{label}</span>
                                  {timeVal && (
                                    <span style={{ fontSize: 7, color: "var(--t4)", marginTop: 1 }}>
                                      {new Date(timeVal).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  )}
                                </div>
                                {i < 3 && (
                                  <div style={{ flex: 1, height: 1.5, background: isDone ? "#10b981" : "var(--bd)", margin: "0 3px", marginBottom: isDone || isCurrent ? 20 : 20, transition: "background 0.2s" }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action button */}
                      <div style={{ padding: "0 14px 13px" }} onClick={e => e.stopPropagation()}>
                        {next ? (
                          <button
                            onClick={() => handleStatusTransition(a.id, next.status, (a as any).jobId)}
                            disabled={updateStatus.isPending}
                            style={{
                              width: "100%", padding: "8px", borderRadius: "var(--r)", border: "none",
                              background: st.color, color: "#fff", fontSize: 12, fontWeight: 700,
                              cursor: updateStatus.isPending ? "not-allowed" : "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                              fontFamily: "inherit", opacity: updateStatus.isPending ? 0.6 : 1,
                              transition: "filter 0.15s",
                            }}
                            onMouseEnter={e => { if (!updateStatus.isPending) (e.currentTarget as HTMLElement).style.filter = "brightness(0.88)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
                          >
                            {updateStatus.isPending ? <Loader2 size={11} className="animate-spin" /> : <next.icon size={11} />}
                            {next.label}
                          </button>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", fontSize: 12, fontWeight: 600, color: "#10b981" }}>
                            <CheckCircle2 size={13} /> Completed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Tab: Technicians ── */}
      {tab === "technicians" && (() => {
        // Compute availability for every tech using both scheduling + CRM login signals
        const withAvail = filteredTechs.map(t => ({
          t,
          avail: getTechAvailability(t, loginMap[t.userId]),
        }));

        const allGroups: Array<{ tier: AvailabilityTier; items: typeof withAvail }> = [
          { tier: "ONLINE" as AvailabilityTier,    items: withAvail.filter(x => x.avail === "ONLINE") },
          { tier: "AVAILABLE" as AvailabilityTier, items: withAvail.filter(x => x.avail === "AVAILABLE") },
          { tier: "AWAY" as AvailabilityTier,      items: withAvail.filter(x => x.avail === "AWAY") },
          { tier: "OFFLINE" as AvailabilityTier,   items: withAvail.filter(x => x.avail === "OFFLINE") },
        ];
        const groups = allGroups.filter(g => g.items.length > 0);

        const dispatchable = withAvail.filter(x => x.avail === "ONLINE" || x.avail === "AVAILABLE").length;

        const TechCard = ({ t: tech, avail }: { t: Technician; avail: AvailabilityTier }) => {
          const meta = AVAIL_META[avail];
          const techActiveAsgns = allAssignments.filter(
            a => a.technicianId === tech.id && ["ASSIGNED", "EN_ROUTE", "ON_SITE"].includes(a.status),
          );
          const workloadPct = tech.maxDailyJobs > 0 ? techActiveAsgns.length / tech.maxDailyJobs : 0;
          const workloadColor = workloadPct >= 1 ? "#ef4444" : workloadPct >= 0.7 ? "#f59e0b" : "#3b82f6";
          const visibleSkills = (tech.skills ?? []).slice(0, 3);
          const extraSkills = (tech.skills ?? []).length - visibleSkills.length;

          // Last-active timestamp for display
          const signals = [tech.lastSeenAt, tech.locationUpdatedAt, loginMap[tech.userId]]
            .filter(Boolean).map(d => new Date(d!).getTime());
          const newestSignal = signals.length ? new Date(Math.max(...signals)) : null;
          const lastActiveLabel = newestSignal
            ? (() => {
                const mins = (Date.now() - newestSignal.getTime()) / 60000;
                if (mins < 1) return "Just now";
                if (mins < 60) return `${Math.floor(mins)}m ago`;
                if (mins < 24 * 60) return `${Math.floor(mins / 60)}h ago`;
                return newestSignal.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              })()
            : "Never";

          return (
            <div
              onClick={() => setSelectedTech(tech)}
              style={{
                background: "var(--bg-card)", borderRadius: 12, cursor: "pointer",
                border: "1px solid var(--bd)",
                borderLeft: `3px solid ${meta.color}`,
                padding: "14px 14px 12px",
                transition: "transform .15s, box-shadow .15s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex", flexDirection: "column", gap: 10,
                opacity: meta.dim,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = "0 5px 18px rgba(0,0,0,0.09)";
                el.style.opacity = "1";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                el.style.opacity = String(meta.dim);
              }}
            >
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Avatar with availability dot */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar name={tech.name} avatarUrl={tech.avatarUrl} size={32} radius={16} fontSize={13} />
                  {/* Availability dot */}
                  <div style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 9, height: 9, borderRadius: "50%",
                    background: meta.color,
                    border: "2px solid var(--bg-card)",
                    boxShadow: avail === "ONLINE" ? `0 0 0 2px ${meta.color}44` : "none",
                  }} />
                </div>

                {/* Name + phone */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                    {tech.name}
                    {!tech.currentLocation && (
                      <span
                        title="No base location yet — the technician sets it on first sign-in. Excluded from smart auto-assignment until then."
                        style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 20, background: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3 }}
                      >
                        <MapPin size={8} /> No location
                      </span>
                    )}
                  </div>
                  {tech.phone && (
                    <div style={{ fontSize: 10, color: "var(--t3)", display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                      <Phone size={8} /> {tech.phone}
                    </div>
                  )}
                </div>

                {/* Last active */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: meta.color }}>{meta.label}</div>
                  <div style={{ fontSize: 9, color: "var(--t4)", marginTop: 1 }}>{lastActiveLabel}</div>
                </div>
              </div>

              {/* Workload + rating */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: "var(--t4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Workload</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: workloadColor }}>{techActiveAsgns.length}/{tech.maxDailyJobs}</span>
                  </div>
                  <div style={{ display: "flex", gap: 2.5 }}>
                    {Array.from({ length: Math.min(tech.maxDailyJobs, 8) }, (_, i) => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < techActiveAsgns.length ? workloadColor : "var(--bd)" }} />
                    ))}
                  </div>
                </div>
                <div style={{ width: 1, height: 24, background: "var(--bd)", flexShrink: 0 }} />
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Star size={10} color="#f59e0b" fill="#f59e0b" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)" }}>{(tech.rating ?? 0).toFixed(1)}</span>
                  </div>
                  <div style={{ fontSize: 9, color: "var(--t4)" }}>{tech.totalRatings ?? 0} rev</div>
                </div>
              </div>

              {/* Skills */}
              {visibleSkills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {visibleSkills.map(sk => (
                    <span key={sk} style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: "rgba(99,102,241,0.07)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.18)" }}>{sk}</span>
                  ))}
                  {extraSkills > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: "var(--bg-hover)", color: "var(--t4)", border: "1px solid var(--bd)" }}>+{extraSkills}</span>
                  )}
                </div>
              )}

              {/* Active jobs */}
              {techActiveAsgns.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 7, background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.14)" }}>
                  <Briefcase size={9} color="#2563eb" />
                  <span style={{ fontSize: 10, color: "#2563eb", fontWeight: 600 }}>
                    {techActiveAsgns.length} active job{techActiveAsgns.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          );
        };

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Filter + summary bar */}
            <div className="card">
              <div className="card-body" style={{ paddingBottom: 12 }}>
                <div className="filter-bar">
                  <div className="filter-search">
                    <Search size={13} color="var(--t4)" />
                    <input placeholder="Search technicians…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
                    {/* Availability summary pills */}
                    {(["ONLINE","AVAILABLE","AWAY","OFFLINE"] as AvailabilityTier[]).map(tier => {
                      const count = withAvail.filter(x => x.avail === tier).length;
                      if (!count) return null;
                      const m = AVAIL_META[tier];
                      return (
                        <span key={tier} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--t2)", fontWeight: 500 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, display: "inline-block" }} />
                          <span style={{ color: m.color, fontWeight: 700 }}>{count}</span> {m.label}
                        </span>
                      );
                    })}
                    <div style={{ width: 1, height: 16, background: "var(--bd)" }} />
                    <span style={{ fontSize: 11, color: "var(--t3)" }}>
                      <span style={{ fontWeight: 700, color: "var(--t1)" }}>{dispatchable}</span> dispatchable
                    </span>
                    <button onClick={() => setShowAddTech(true)} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <UserPlus size={12} /> Add Technician
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {techsQuery.isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0", color: "var(--t4)" }}>
                <Loader2 size={22} className="animate-spin" style={{ marginRight: 8 }} /> Loading…
              </div>
            ) : filteredTechs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "var(--t4)" }}>
                <Users size={30} style={{ margin: "0 auto 10px", opacity: 0.28 }} />
                <p style={{ fontSize: 13, fontWeight: 600 }}>No technicians found</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {groups.map(({ tier, items }) => {
                  const m = AVAIL_META[tier];
                  return (
                    <div key={tier}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, display: "inline-block",
                          boxShadow: tier === "ONLINE" ? `0 0 0 3px ${m.color}33` : "none" }} />
                        {m.label} — {items.length}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 10 }}>
                        {items.map(({ t, avail }) => <TechCard key={t.id} t={t} avail={avail} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Tab: Completed Jobs ── */}
      {tab === "completed" && (() => {
        const completedJobs = allJobs
          .filter(j => ["COMPLETED", "INVOICED", "PAID"].includes(j.status))
          .sort((a, b) => {
            const da = a.completedAt ?? a.updatedAt ?? a.createdAt
            const db = b.completedAt ?? b.updatedAt ?? b.createdAt
            return new Date(db).getTime() - new Date(da).getTime()
          })
        const byStatus = {
          COMPLETED: completedJobs.filter(j => j.status === "COMPLETED").length,
          INVOICED:  completedJobs.filter(j => j.status === "INVOICED").length,
          PAID:      completedJobs.filter(j => j.status === "PAID").length,
        }
        return (
          <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Funnel summary strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Completed", count: byStatus.COMPLETED, color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
                { label: "Invoiced", count: byStatus.INVOICED, color: "#0891b2", bg: "rgba(8,145,178,0.08)", border: "rgba(8,145,178,0.2)" },
                { label: "Paid", count: byStatus.PAID, color: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)" },
              ].map(s => (
                <div key={s.label} style={{ padding: "14px 18px", borderRadius: "var(--r-md)", background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.count}</div>
                    <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Jobs grid */}
            {completedJobs.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "48px 20px" }}>
                <CheckCircle2 size={36} style={{ margin: "0 auto 12px", display: "block", color: "#10b981", opacity: 0.4 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t2)" }}>No completed jobs yet</div>
                <div style={{ fontSize: 12, color: "var(--t4)", marginTop: 4 }}>Completed, invoiced, and paid jobs will appear here.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {completedJobs.map(job => {
                  const assignment = assignmentByJobId[job.id]
                  const statusColor = job.status === "PAID" ? "#7c3aed" : job.status === "INVOICED" ? "#0891b2" : "#10b981"
                  const statusBg    = job.status === "PAID" ? "rgba(124,58,237,0.08)" : job.status === "INVOICED" ? "rgba(8,145,178,0.08)" : "rgba(16,185,129,0.08)"
                  const doneAt = job.completedAt ?? job.updatedAt
                  return (
                    <div
                      key={job.id}
                      onClick={() => handleOpenJob(job, assignment)}
                      style={{
                        background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: "var(--r-md)",
                        padding: "16px", cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s",
                        borderLeft: `3px solid ${statusColor}`,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLElement).style.borderColor = statusColor; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "var(--bd)"; (e.currentTarget as HTMLElement).style.borderLeftColor = statusColor; }}
                    >
                      {/* Top row: title + status badge */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</div>
                          <div style={{ fontSize: 11, color: "var(--t4)", marginTop: 2 }}>#{job.id.slice(0, 8)}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusBg, padding: "3px 9px", borderRadius: 12, flexShrink: 0, border: `1px solid ${statusColor}22` }}>
                          {job.status}
                        </span>
                      </div>
                      {/* Details */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t3)" }}>
                          <Users size={11} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.customerName ?? "—"}</span>
                        </div>
                        {(assignment?.technicianName ?? job.assignedToName) && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t3)" }}>
                            <Wrench size={11} style={{ flexShrink: 0 }} />
                            <span>{assignment?.technicianName ?? job.assignedToName}</span>
                          </div>
                        )}
                        {job.serviceAddress && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t3)" }}>
                            <MapPin size={11} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.serviceAddress}</span>
                          </div>
                        )}
                        {doneAt && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t4)" }}>
                            <CheckCircle2 size={11} style={{ flexShrink: 0 }} />
                            <span>{new Date(doneAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {new Date(doneAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        )}
                      </div>
                      {/* Amount */}
                      {(job.finalAmount ?? job.estimatedAmount) ? (
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, color: "var(--t4)" }}>Amount</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>{formatMoney(job.finalAmount ?? job.estimatedAmount, { decimals: 0 })}</span>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {tab === "calendar" && (
        <div className="anim-fade-in">
          <DispatchCalendar
            jobs={allJobs}
            technicians={techs}
            assignmentByJobId={assignmentByJobId}
            onAssign={handleManualAssign}
            onSmartAssign={handleSmartAssign}
            onPickSuggestion={handlePickSuggestion}
            onDismissSuggestions={() => {
              setSuggestions(null);
              setPendingJobId(null);
            }}
            isAssigning={manualAssign.isPending}
            smartAssigningJobId={smartAssign.isPending ? pendingJobId : pendingJobId}
              smartSuggestions={suggestions ?? null}
            onOpenJob={handleOpenJob}
          />
        </div>
      )}

      {/* ── Tab: Map View ── */}
      {tab === "map" && (
        <div className="card anim-fade-in">
          <div className="card-body">
            <Suspense fallback={
              <div className="flex items-center justify-center py-16 text-[var(--t4)]">
                <Loader2 size={24} className="animate-spin mr-2" /> Loading map…
              </div>
            }>
              <DispatchMap
                technicians={techs}
                assignedJobs={assignedJobs}
                unassignedJobs={unassignedJobs}
                assignmentByJobId={assignmentByJobId}
                loginMap={loginMap}
                onOpenJob={handleOpenJob}
                onSmartAssign={handleSmartAssign}
                onAssign={handleManualAssign}
                isAssigning={manualAssign.isPending}
                smartAssigningJobId={smartAssign.isPending ? pendingJobId : null}
              />
            </Suspense>
          </div>
        </div>
      )}

      <AddTechnicianModal isOpen={showAddTech} onClose={() => setShowAddTech(false)} />
      <CreateJobModal isOpen={showCreateJob} onClose={() => setShowCreateJob(false)} />

      {selectedTech && (
        <TechnicianDetailPanel
          technician={selectedTech}
          assignments={allAssignments}
          jobs={allJobs}
          lastLoginAt={loginMap[selectedTech.userId]}
          onClose={() => setSelectedTech(null)}
        />
      )}

      {/* Job Detail Panel (active assignment click) */}
      {selectedJob && (
        <JobDetailPanel
          jobId={(selectedAssignment as any)?.jobId ?? selectedJob.id}
          assignment={selectedAssignment}
          technician={selectedAssignment ? techs.find(t => t.id === selectedAssignment.technicianId) : undefined}
          isOpen={!!selectedJob}
          onClose={() => { setSelectedJob(null); setSelectedAssignment(null); }}
          onCreateQuote={(j) => {
            setFinanceContextJob(j ?? selectedJob);
            setShowQuoteFromJob(true);
            setSelectedJob(null);
            setSelectedAssignment(null);
          }}
          onCreateInvoice={(j) => {
            setFinanceContextJob(j ?? selectedJob);
            setShowInvoiceFromJob(true);
            setSelectedJob(null);
            setSelectedAssignment(null);
          }}
        />
      )}

      {/* Finance modals from job context */}
      <AddQuoteModal
        isOpen={showQuoteFromJob}
        onClose={() => { setShowQuoteFromJob(false); setFinanceContextJob(null); }}
        prefilledJob={financeContextJob}
        onBack={financeContextJob ? () => {
          setShowQuoteFromJob(false);
          setSelectedJob(financeContextJob as Job);
        } : undefined}
      />
      <AddInvoiceModal
        isOpen={showInvoiceFromJob}
        onClose={() => { setShowInvoiceFromJob(false); setFinanceContextJob(null); }}
        prefilledJob={financeContextJob}
        onBack={financeContextJob ? () => {
          setShowInvoiceFromJob(false);
          setSelectedJob(financeContextJob as Job);
        } : undefined}
      />
    </div>
  );
}
