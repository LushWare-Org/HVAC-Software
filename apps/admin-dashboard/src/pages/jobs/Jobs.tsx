import { useState, useMemo } from "react";
import {
  Wrench, Clock, CheckCircle, FileText, Search, AlertTriangle,
  Maximize2, Minimize2, Edit2,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, Zap, ArrowUpDown, CalendarDays, Shield, Trash2,
} from "lucide-react";
import { useJobs, useJobStats, useDeleteJob } from "../../hooks/useJobs";
import type { Job } from "../../types/api";

const STATUS: Record<string, { label: string; css: string }> = {
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
  LOW: "badge-neutral", NORMAL: "badge-neutral", HIGH: "badge-amber",
  URGENT: "badge-red", EMERGENCY: "badge-red",
};

const PRIORITY_ORDER: Record<string, number> = {
  EMERGENCY: 0, URGENT: 1, HIGH: 2, NORMAL: 3, LOW: 4,
};

const ACTIVE_STATUSES = new Set(["PENDING", "SCHEDULED", "EN_ROUTE", "ON_SITE", "IN_PROGRESS", "ON_HOLD"]);

function Skeleton({ h = 14 }: { h?: number }) {
  return <div style={{ width: "100%", height: h, background: "var(--bg-hover)", borderRadius: 4 }} />;
}

function JobTable({ jobs, loading, onView, onDelete }: { jobs: Job[]; loading: boolean; onView: (j: Job) => void; onDelete: (j: Job) => void }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Job ID</th>
          <th>Customer</th>
          <th>Service</th>
          <th>Technician</th>
          <th>Scheduled</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Amount</th>
          <th className="sticky-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <tr key={i}>{Array.from({ length: 9 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
        ))}
        {!loading && jobs.length === 0 && (
          <tr><td colSpan={9}>
            <div className="empty-state">
              <div className="empty-icon"><Wrench size={22} /></div>
              <div className="empty-title">No jobs found</div>
            </div>
          </td></tr>
        )}
        {!loading && jobs.map(j => {
          const s = STATUS[j.status] ?? { label: j.status, css: "badge-neutral" };
          const amount = j.finalAmount ?? j.estimatedAmount ?? 0;
          const isUrgent = j.priority === "EMERGENCY" || j.priority === "URGENT";
          return (
            <tr
              key={j.id}
              onClick={() => onView(j)}
              className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
              style={isUrgent ? { borderLeft: "3px solid var(--red)" } : undefined}
            >
              <td><span className="td-mono td-primary">{j.id.slice(0, 8)}…</span></td>
              <td>
                <div className="cell-user"><div>
                  <div className="cell-name">{j.customerName ?? "—"}</div>
                  <div className="cell-email">{j.serviceAddress ?? j.customerAddress ?? ""}</div>
                </div></div>
              </td>
              <td>
                <div className="font-500">{j.title}</div>
                {j.description && (
                  <div className="text-xs text-4 mt-0.5 truncate" style={{ maxWidth: 160 }}>{j.description}</div>
                )}
              </td>
              <td>{j.assignedToName ?? "—"}</td>
              <td>
                {j.scheduledStart ? (
                  <>
                    <div className="text-sm font-500 text-[var(--t3)]">
                      {new Date(j.scheduledStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="text-xs text-4 mt-0.5">
                      {new Date(j.scheduledStart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </>
                ) : <span className="text-xs text-4">—</span>}
              </td>
              <td>
                <span className={`badge ${PRIORITY_CSS[j.priority ?? "NORMAL"] ?? "badge-neutral"}`}>
                  {(j.priority ?? "NORMAL").toLowerCase()}
                </span>
              </td>
              <td className="text-center"><span className={`badge ${s.css}`}>{s.label}</span></td>
              <td className="text-right td-primary font-600">${Number(amount).toLocaleString()}</td>
              <td className="sticky-actions">
                <div className="flex items-center gap-0.5 justify-center">
                  <button
                    className="flex items-center justify-center p-1.5 text-[var(--amber)] hover:bg-amber-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                    title="Edit Job"
                    onClick={e => { e.stopPropagation(); onView(j); }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                    title="Delete Job"
                    onClick={e => { e.stopPropagation(); onDelete(j); }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [pastPage, setPastPage] = useState(1);
  const [sortMode, setSortMode] = useState<'priority' | 'date'>('priority');
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const PAST_PER_PAGE = 10;

  const statsQuery = useJobStats();
  const jobsQuery = useJobs({ limit: 200, search: search || undefined });
  const deleteJob = useDeleteJob();

  const stats = statsQuery.data;
  const allJobs: Job[] = jobsQuery.data?.data ?? [];

  const { activeJobs, pastJobs } = useMemo(() => {
    let filtered = allJobs;
    if (filterStatus !== "all") filtered = filtered.filter(j => j.status === filterStatus);
    if (filterPriority !== "all") filtered = filtered.filter(j => (j.priority ?? "NORMAL") === filterPriority);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const active = filtered
      .filter(j => ACTIVE_STATUSES.has(j.status))
      .sort((a, b) => {
        if (sortMode === 'date') {
          // Date mode: latest date first (descending), unscheduled last
          const da = a.scheduledStart ? new Date(a.scheduledStart).getTime() : null;
          const db = b.scheduledStart ? new Date(b.scheduledStart).getTime() : null;
          // Unscheduled sink to the bottom
          if (da !== null && db === null) return -1;
          if (da === null && db !== null) return 1;
          if (da === null && db === null) return 0;
          return (db ?? 0) - (da ?? 0); // latest date on top
        }
        // Priority mode (default): Emergency first, then date
        const pa = PRIORITY_ORDER[a.priority ?? "NORMAL"] ?? 3;
        const pb = PRIORITY_ORDER[b.priority ?? "NORMAL"] ?? 3;
        if (pa !== pb) return pa - pb;
        const da = a.scheduledStart ? new Date(a.scheduledStart).getTime() : null;
        const db = b.scheduledStart ? new Date(b.scheduledStart).getTime() : null;
        const aToday = da ? (da >= todayStart.getTime() && da <= todayEnd.getTime()) : false;
        const bToday = db ? (db >= todayStart.getTime() && db <= todayEnd.getTime()) : false;
        if (aToday && !bToday) return -1;
        if (!aToday && bToday) return 1;
        if (da === null && db !== null) return -1;
        if (da !== null && db === null) return 1;
        return (da ?? 0) - (db ?? 0);
      });

    const past = filtered
      .filter(j => !ACTIVE_STATUSES.has(j.status))
      .sort((a, b) => {
        const da = a.scheduledStart ? new Date(a.scheduledStart).getTime() : 0;
        const db = b.scheduledStart ? new Date(b.scheduledStart).getTime() : 0;
        return db - da;
      });

    return { activeJobs: active, pastJobs: past };
  }, [allJobs, filterStatus, filterPriority, sortMode]);

  const pastPageData = pastJobs.slice((pastPage - 1) * PAST_PER_PAGE, pastPage * PAST_PER_PAGE);
  const pastTotalPages = Math.max(1, Math.ceil(pastJobs.length / PAST_PER_PAGE));

  const handleViewJob = (job: Job) => {
    window.dispatchEvent(new CustomEvent("open-job-detail", { detail: job }));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteJob.mutateAsync(deleteTarget.id);
    } finally {
      setDeleteTarget(null);
    }
  };

  const urgentCount = activeJobs.filter(j => j.priority === "EMERGENCY" || j.priority === "URGENT").length;

  return (
    <div className="anim-fade-up">
      {/* KPIs */}
      {!isExpanded && (
        <div className="kpi-grid mb-5">
          {[
            { icon: Wrench, v: stats ? (stats.pending + stats.scheduled + stats.inProgress).toString() : "—", l: "Open Jobs", loading: statsQuery.isLoading },
            { icon: AlertTriangle, v: stats ? stats.pending.toString() : "—", l: "Pending", loading: statsQuery.isLoading },
            { icon: CheckCircle, v: stats ? (stats.completedToday ?? stats.completed ?? 0).toString() : "—", l: "Completed Today", loading: statsQuery.isLoading },
            { icon: FileText, v: stats ? stats.invoiced.toString() : "—", l: "Awaiting Invoice", loading: statsQuery.isLoading },
            { icon: Clock, v: "—", l: "Avg Job Duration", loading: false },
          ].map((k) => (
            <div key={k.l} className="kpi-card" style={{ padding: "16px 20px", borderRadius: "var(--r-md)" }}>
              <div className="kpi-card-top" style={{ marginBottom: 12, alignItems: "center", justifyContent: "space-between" }}>
                <div className="kpi-label" style={{ fontSize: 13, color: "var(--t3)", fontWeight: 500, margin: 0 }}>{k.l}</div>
                <k.icon size={16} strokeWidth={1.5} color="var(--t3)" />
              </div>
              {k.loading ? <Skeleton h={28} /> : <div className="kpi-value" style={{ fontSize: 26, fontWeight: 700, color: "var(--t1)" }}>{k.v}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Urgent banner */}
      {urgentCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "var(--red-dim)", borderRadius: 8, marginBottom: 12, color: "var(--red)", fontSize: 13, fontWeight: 500 }}>
          <Zap size={14} />
          {urgentCount} urgent/emergency job{urgentCount > 1 ? "s" : ""} — shown at the top of the list
        </div>
      )}

      {/* Active / Upcoming Jobs */}
      <div className="card anim-fade-up delay-2 mb-4">
        {jobsQuery.isError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "var(--red-dim)", borderRadius: 8, color: "var(--red)", fontSize: 13, margin: "0 0 4px" }}>
            <AlertCircle size={14} /> Failed to load jobs.
            <button onClick={() => jobsQuery.refetch()} style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 4, color: "var(--red)", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--t1)" }}>Active & Upcoming Jobs</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", background: "var(--bg-hover)", padding: "2px 9px", borderRadius: 12 }}>
                {jobsQuery.isLoading ? "…" : activeJobs.length}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", background: "var(--bg-hover)", borderRadius: 8, padding: 2 }}>
                <button
                  onClick={() => setSortMode('priority')}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
                    background: sortMode === 'priority' ? "var(--card)" : "transparent",
                    color: sortMode === 'priority' ? "var(--t1)" : "var(--t3)",
                    boxShadow: sortMode === 'priority' ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <Shield size={12} /> Priority
                </button>
                <button
                  onClick={() => setSortMode('date')}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
                    background: sortMode === 'date' ? "var(--card)" : "transparent",
                    color: sortMode === 'date' ? "var(--t1)" : "var(--t3)",
                    boxShadow: sortMode === 'date' ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <CalendarDays size={12} /> Date
                </button>
              </div>
              <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: "0 12px", fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
              </button>
            </div>
          </div>

          <div className="filter-bar">
            <div className="filter-search">
              <Search size={13} color="var(--t4)" />
              <input
                placeholder="Search jobs, customers, services…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="select" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="EN_ROUTE">En Route</option>
              <option value="ON_SITE">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
            <select className="select" style={{ width: 140 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="all">All Priority</option>
              <option value="EMERGENCY">🔴 Emergency</option>
              <option value="URGENT">🟠 Urgent</option>
              <option value="HIGH">🟡 High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="card-body-flush">
          <div className="table-container jobs-table-container">
            <JobTable jobs={activeJobs} loading={jobsQuery.isLoading} onView={handleViewJob} onDelete={setDeleteTarget} />
          </div>
        </div>
      </div>

      {/* Past Jobs — collapsible */}
      <div className="card anim-fade-up delay-3">
        <div className="card-body" style={{ paddingBottom: showPast ? 0 : undefined }}>
          <button
            onClick={() => { setShowPast(s => !s); setPastPage(1); }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={15} color="var(--t3)" />
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--t2)" }}>Past Jobs</span>
              <span style={{ fontSize: 11, color: "var(--t3)" }}>Completed · Invoiced · Paid · Cancelled</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", background: "var(--bg-hover)", padding: "2px 9px", borderRadius: 12 }}>
                {jobsQuery.isLoading ? "…" : pastJobs.length}
              </span>
            </div>
            {showPast ? <ChevronUp size={16} color="var(--t3)" /> : <ChevronDown size={16} color="var(--t3)" />}
          </button>
        </div>

        {showPast && (
          <>
            <div className="card-body-flush">
              <div className="table-container jobs-table-container">
                <JobTable jobs={pastPageData} loading={jobsQuery.isLoading} onView={handleViewJob} onDelete={setDeleteTarget} />
              </div>
            </div>

            {pastTotalPages > 1 && (
              <div className="card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
                <span className="text-[13px] text-[var(--t3)]">
                  Showing {pastJobs.length > 0 ? (pastPage - 1) * PAST_PER_PAGE + 1 : 0}–{Math.min(pastPage * PAST_PER_PAGE, pastJobs.length)} of {pastJobs.length}
                </span>
                <div className="flex items-center gap-2">
                  <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPastPage(p => Math.max(1, p - 1))} disabled={pastPage === 1}><ChevronLeft size={18} /></button>
                  <span className="text-[13px] text-[var(--t2)] mx-2">Page {pastPage} of {pastTotalPages}</span>
                  <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPastPage(p => Math.min(pastTotalPages, p + 1))} disabled={pastPage === pastTotalPages}><ChevronRight size={18} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] admin-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="bg-[var(--bg-card)] rounded-[var(--r)] shadow-2xl w-full max-w-md mx-4 flex flex-col admin-modal-box" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--red-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Trash2 size={18} color="var(--red)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--t1)" }}>Delete Job</div>
                  <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 2 }}>This action cannot be undone.</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.6 }}>
                Are you sure you want to delete job <strong>{deleteTarget.title}</strong>
                {deleteTarget.customerName ? <> for <strong>{deleteTarget.customerName}</strong></> : ""}?
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--bd)" }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleteJob.isPending}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "var(--red)", color: "#fff", borderColor: "var(--red)" }}
                onClick={handleConfirmDelete}
                disabled={deleteJob.isPending}
              >
                {deleteJob.isPending ? "Deleting…" : "Delete Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
