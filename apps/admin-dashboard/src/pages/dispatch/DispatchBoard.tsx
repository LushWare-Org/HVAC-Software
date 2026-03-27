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
  CheckCircle2, Clock, AlertCircle, Loader2, Navigation,
  Users, Wrench, RefreshCw, Search, X, Truck, Phone,
  Award, Activity, Target, Plus, Map, CalendarDays,
} from "lucide-react";
import {
  useTechnicians, useSmartAssign, useManualAssign,
  useUpdateAssignmentStatus, useAllTechAssignments,
  useDispatchWebSocket,
} from "../../hooks/useScheduling";
import { useJobs, useUpdateJobStatus } from "../../hooks/useJobs";
import type {
  Job, Technician, AssignResponse, ScoredTechnician,
} from "../../types/api";
import AddTechnicianModal from "./AddTechnicianModal";
import CreateJobModal from "./CreateJobModal";
import JobDetailPanel from "./JobDetailPanel";
import AddQuoteModal from "../finance/AddQuoteModal";
import AddInvoiceModal from "../finance/AddInvoiceModal";
import DispatchCalendar from "./DispatchCalendar";

// ─── Status helpers ────────────────────────────────────────────────────────────

const ASSIGN_STATUS_CSS: Record<string, string> = {
  ASSIGNED: "bg-blue-100 text-blue-700 border-blue-200",
  EN_ROUTE: "bg-amber-100 text-amber-700 border-amber-200",
  ON_SITE: "bg-purple-100 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  SUGGESTED: "bg-gray-100 text-gray-600 border-gray-200",
};

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

// ─── Assignment timeline helper ────────────────────────────────────────────────

function AssignmentTimeline({ assignment }: { assignment: any }) {
  const steps = [
    { label: "Assigned", time: assignment.assignedAt, status: "ASSIGNED" },
    { label: "En Route", time: assignment.enRouteAt, status: "EN_ROUTE" },
    { label: "On Site", time: assignment.onSiteAt, status: "ON_SITE" },
    { label: "Completed", time: assignment.completedAt, status: "COMPLETED" },
  ];
  const currentIdx = steps.findIndex((s) => s.status === assignment.status);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.label} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 ${
                  done ? (isCurrent ? "bg-blue-500 border-blue-500" : "bg-emerald-500 border-emerald-500") : "bg-white border-gray-300"
                }`}
              />
              <span className={`text-[8px] mt-0.5 ${done ? "text-gray-700 font-medium" : "text-gray-400"}`}>{step.label}</span>
              {step.time && (
                <span className="text-[7px] text-gray-400">{new Date(step.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 h-0.5 ${i < currentIdx ? "bg-emerald-400" : "bg-gray-200"} mb-4`} />
            )}
          </div>
        );
      })}
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

type ViewTab = "unassigned" | "active" | "technicians" | "calendar" | "map";

// Lazy-load map to avoid loading leaflet on initial page load
const DispatchMap = lazy(() => import("./DispatchMap"));

export default function DispatchBoard() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<ViewTab>("unassigned");
  const [search, setSearch] = useState("");
  const [showAddTech, setShowAddTech] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
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

  // Data
  const techsQuery = useTechnicians();
  const techs: Technician[] = techsQuery.data ?? [];
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
  const activeAssignments = allAssignments.filter(a => ["ASSIGNED", "EN_ROUTE", "ON_SITE"].includes(a.status));
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
  const assignedJobs = allJobs.filter(job => !!assignmentByJobId[job.id]);
  const unassignedJobs = allJobs.filter(job => !assignmentByJobId[job.id]);

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
        onError: (err: any) => setError(err?.response?.data?.error ?? "Manual assign failed."),
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
        onError: (err: any) => setError(err?.response?.data?.error ?? "Assignment failed."),
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

  const activeAssignmentsWithJob = activeAssignments
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
    });

  const filteredTechs = techs.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="anim-fade-up space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--t1)] flex items-center gap-2.5">
            <Zap size={24} className="text-amber-500" /> Dispatch Board
          </h1>
          <p className="text-sm text-[var(--t3)] mt-1">Smart technician assignment with distance, workload & rating scoring</p>
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
          { icon: CheckCircle2, label: "Completed Today", value: allAssignments.filter(a => a.status === "COMPLETED").length, color: "text-emerald-600", bg: "bg-emerald-50" },
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
      {tab === "active" && (
        <div className="card anim-fade-in">
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="filter-bar">
              <div className="filter-search"><Search size={13} color="var(--t4)" /><input placeholder="Search jobs, customer, technician…" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <button className="btn btn-secondary btn-sm flex items-center gap-1.5" onClick={() => { allAssignmentsQuery.refetch(); allJobsQuery.refetch(); }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>
          <div className="card-body-flush mt-2">
            {allAssignmentsQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-[var(--t4)]"><Loader2 size={24} className="animate-spin mr-2" /> Loading…</div>
            ) : activeAssignmentsWithJob.length === 0 ? (
              <div className="text-center py-16 text-[var(--t4)]">
                <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No active assignments</p>
                <p className="text-xs mt-1">Assign some jobs to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeAssignmentsWithJob.map(({ assignment: a, technician: tech, job }) => {
                  const next = ASSIGN_STATUS_NEXT[a.status];
                  return (
                    <div
                      key={a.id}
                      className="px-5 py-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      onClick={() => {
                        if (job) {
                          handleOpenJob(job, a);
                          return;
                        }
                        setSelectedAssignment(a);
                        setSelectedJob(({ id: (a as any).jobId, title: 'Job' }) as Job);
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          <Briefcase size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-[var(--t1)]">{job?.title ?? 'Job details unavailable'}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${ASSIGN_STATUS_CSS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {a.status.replace("_", " ")}
                            </span>
                            {(a as any).score && <ScoreBadge score={(a as any).score} />}
                            {(a as any).distanceKm != null && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <MapPin size={9} /> {Number((a as any).distanceKm).toFixed(1)} km
                              </span>
                            )}
                            {(a as any).assignedBy ? (
                              <span className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Manual</span>
                            ) : (
                              <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Auto</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[var(--t3)] mb-2 flex-wrap">
                            <span className="flex items-center gap-1 font-mono text-[10px]"><Briefcase size={10} /> {job?.id ? `${job.id.slice(0, 12)}...` : `${(a as any).jobId?.slice(0, 12)}...`}</span>
                            <span className="flex items-center gap-1"><Users size={10} /> {job?.customerName ?? 'Customer unavailable'}</span>
                            <span className="flex items-center gap-1"><Wrench size={10} /> {tech?.name ?? 'Technician unavailable'}</span>
                            {(a as any).assignedAt && (
                              <span className="flex items-center gap-1 font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                <Clock size={9} /> {timeElapsed((a as any).assignedAt)} elapsed
                              </span>
                            )}
                            {(a as any).assignedByName && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">By {(a as any).assignedByName}</span>
                            )}
                            {tech?.phone && <span className="flex items-center gap-1"><Phone size={10} /> {tech.phone}</span>}
                          </div>
                          {/* Timeline */}
                          <AssignmentTimeline assignment={a} />
                        </div>
                        {/* Action button */}
                        <div className="shrink-0">
                          {next ? (
                            <button
                              onClick={() => handleStatusTransition(a.id, next.status, (a as any).jobId)}
                              disabled={updateStatus.isPending}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors disabled:opacity-50 cursor-pointer border-0"
                            >
                              {updateStatus.isPending ? <Loader2 size={10} className="animate-spin" /> : <next.icon size={10} />}
                              {next.label}
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> Done</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Technicians ── */}
      {tab === "technicians" && (
        <div className="card anim-fade-in">
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="filter-bar">
              <div className="filter-search"><Search size={13} color="var(--t4)" /><input placeholder="Search technicians…" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <button onClick={() => setShowAddTech(true)} className="btn btn-primary btn-sm flex items-center gap-1.5 ml-auto">
                <UserPlus size={12} /> Add Technician
              </button>
            </div>
          </div>
          <div className="card-body-flush mt-2">
            {techsQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-[var(--t4)]"><Loader2 size={24} className="animate-spin mr-2" /> Loading…</div>
            ) : filteredTechs.length === 0 ? (
              <div className="text-center py-16 text-[var(--t4)]">
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No technicians registered</p>
                <p className="text-xs mt-1">Add technicians to start dispatching jobs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                {filteredTechs.map(t => {
                  const techAssignments = allAssignments.filter(a => a.technicianId === t.id && ["ASSIGNED", "EN_ROUTE", "ON_SITE"].includes(a.status));
                  const hasGPS = !!t.currentLocation;
                  const activeJobTitles = techAssignments.map(a => allJobs.find(j => j.id === (a as any).jobId)?.title).filter((v): v is string => !!v);
                  return (
                    <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                          {t.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--t1)] truncate">{t.name}</p>
                          <div className="flex items-center gap-2 text-xs text-[var(--t3)]">
                            {t.phone && <span className="flex items-center gap-0.5"><Phone size={9} /> {t.phone}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-3 h-3 rounded-full ${t.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
                            title={t.isActive ? "Active" : "Inactive"}
                          />
                          {hasGPS && (
                            <span className="text-[8px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 flex items-center gap-0.5">
                              <MapPin size={7} /> GPS
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <Briefcase size={12} className="mx-auto text-gray-400 mb-0.5" />
                          <p className="text-xs font-bold text-gray-700">{techAssignments.length}/{t.maxDailyJobs}</p>
                          <p className="text-[9px] text-gray-400">Active</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <Star size={12} className="mx-auto text-amber-400 mb-0.5" />
                          <p className="text-xs font-bold text-gray-700">{(t.rating ?? 0).toFixed(1)}</p>
                          <p className="text-[9px] text-gray-400">Rating ({t.totalRatings ?? 0})</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <Award size={12} className="mx-auto text-blue-400 mb-0.5" />
                          <p className="text-xs font-bold text-gray-700">{t.maxDailyJobs}</p>
                          <p className="text-[9px] text-gray-400">Max/Day</p>
                        </div>
                      </div>
                      {/* Skills tags */}
                      {t.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {t.skills.map((sk) => (
                            <span key={sk} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[9px] font-medium border border-purple-200">
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* GPS location */}
                      {hasGPS && (
                        <p className="text-[9px] text-gray-400 flex items-center gap-1">
                          <Navigation size={8} /> {t.currentLocation!.lat.toFixed(4)}, {t.currentLocation!.lng.toFixed(4)}
                        </p>
                      )}
                      {/* Active job titles */}
                      {activeJobTitles.length > 0 && (
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Active Jobs</p>
                          <div className="flex flex-col gap-1">
                            {activeJobTitles.map((title, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-700 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1.5">
                                <Briefcase size={9} className="text-blue-400 shrink-0" />
                                <span className="truncate">{title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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
              />
            </Suspense>
          </div>
        </div>
      )}

      <AddTechnicianModal isOpen={showAddTech} onClose={() => setShowAddTech(false)} />
      <CreateJobModal isOpen={showCreateJob} onClose={() => setShowCreateJob(false)} />

      {/* Job Detail Panel (active assignment click) */}
      {selectedJob && (
        <JobDetailPanel
          jobId={(selectedAssignment as any)?.jobId ?? selectedJob.id}
          assignment={selectedAssignment}
          technician={selectedAssignment ? techs.find(t => t.id === selectedAssignment.technicianId) : undefined}
          isOpen={!!selectedJob}
          onClose={() => { setSelectedJob(null); setSelectedAssignment(null); }}
          onCreateQuote={() => {
            setShowQuoteFromJob(true);
            setSelectedJob(null);
            setSelectedAssignment(null);
          }}
          onCreateInvoice={() => {
            setShowInvoiceFromJob(true);
            setSelectedJob(null);
            setSelectedAssignment(null);
          }}
        />
      )}

      {/* Finance modals from job context */}
      <AddQuoteModal isOpen={showQuoteFromJob} onClose={() => { setShowQuoteFromJob(false); }} />
      <AddInvoiceModal isOpen={showInvoiceFromJob} onClose={() => { setShowInvoiceFromJob(false); }} />
    </div>
  );
}
