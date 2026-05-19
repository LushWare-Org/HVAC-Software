import { useState, useMemo } from "react";
import {
  Wrench, Clock, CheckCircle, FileText, Search, AlertTriangle,
  Maximize2, Minimize2, Edit2,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
  Zap, CalendarDays, Shield, Trash2,
} from "lucide-react";
import { useJobs, useJobStats, useDeleteJob } from "../../hooks/useJobs";
import type { Job } from "../../types/api";
import RecommendationsPanel from "../../components/RecommendationsPanel";

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

const ACTIVE_STATUS_CHIPS = [
  { status: "PENDING",     label: "Pending",     color: "#d97706", bg: "rgba(217,119,6,0.08)" },
  { status: "SCHEDULED",   label: "Scheduled",   color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
  { status: "EN_ROUTE",    label: "En Route",    color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
  { status: "ON_SITE",     label: "In Progress", color: "#0284c7", bg: "rgba(2,132,199,0.08)" },
  { status: "ON_HOLD",     label: "On Hold",     color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
];

const PRIORITY_CHIPS = [
  { priority: "EMERGENCY", label: "Emergency", color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  { priority: "URGENT",    label: "Urgent",    color: "#ea580c", bg: "rgba(234,88,12,0.08)" },
  { priority: "HIGH",      label: "High",      color: "#d97706", bg: "rgba(217,119,6,0.08)" },
  { priority: "NORMAL",    label: "Normal",    color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
  { priority: "LOW",       label: "Low",       color: "#9ca3af", bg: "rgba(156,163,175,0.08)" },
];

function Skeleton({ h = 14 }: { h?: number }) {
  return <div style={{ width: "100%", height: h, background: "var(--bg-hover)", borderRadius: 4 }} />;
}

function SortArrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ display: "inline-block", marginLeft: 3, verticalAlign: "middle" }}>
      <path d="M5 2L8.5 7H1.5L5 2Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function JobTable({ jobs, loading, onView, onDelete, sortMode }: {
  jobs: Job[]; loading: boolean; onView: (j: Job) => void; onDelete: (j: Job) => void;
  sortMode?: 'priority' | 'date';
}) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Job ID</th>
          <th>Customer</th>
          <th>Service</th>
          <th>Technician</th>
          <th style={sortMode === 'date' ? { color: "var(--blue)", fontWeight: 700 } : undefined}>
            Scheduled {sortMode === 'date' && <SortArrow />}
          </th>
          <th style={sortMode === 'priority' ? { color: "var(--blue)", fontWeight: 700 } : undefined}>
            Priority {sortMode === 'priority' && <SortArrow />}
          </th>
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
  const [pastPage, setPastPage] = useState(1);
  const [pastStatusFilter, setPastStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState<'priority' | 'date'>('priority');
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const PAST_PER_PAGE = 10;

  const statsQuery = useJobStats();
  const jobsQuery = useJobs({ limit: 200, search: search || undefined });
  const deleteJob = useDeleteJob();

  const stats = statsQuery.data;
  const allJobs: Job[] = jobsQuery.data?.data ?? [];

  const { activeJobs, pastJobs, activeStatusCounts, activePriorityCounts } = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const isActiveUpcoming = (j: Job) => {
      if (!ACTIVE_STATUSES.has(j.status)) return false;
      if (!j.scheduledStart) return true;
      return new Date(j.scheduledStart).getTime() >= todayStart.getTime();
    };

    // Past jobs from ALL jobs — not affected by active-section filters
    const past = allJobs
      .filter(j => !isActiveUpcoming(j))
      .sort((a, b) => {
        const da = a.scheduledStart ? new Date(a.scheduledStart).getTime() : 0;
        const db = b.scheduledStart ? new Date(b.scheduledStart).getTime() : 0;
        return db - da;
      });

    // Base active pool for chip counts (no filters)
    const activeBase = allJobs.filter(isActiveUpcoming);
    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    for (const j of activeBase) {
      statusCounts[j.status] = (statusCounts[j.status] ?? 0) + 1;
      const p = j.priority ?? "NORMAL";
      priorityCounts[p] = (priorityCounts[p] ?? 0) + 1;
    }

    // Active jobs with filters applied
    let filtered = activeBase;
    if (filterStatus !== "all") filtered = filtered.filter(j => j.status === filterStatus);
    if (filterPriority !== "all") filtered = filtered.filter(j => (j.priority ?? "NORMAL") === filterPriority);

    const active = [...filtered].sort((a, b) => {
      if (sortMode === 'date') {
        const da = a.scheduledStart ? new Date(a.scheduledStart).getTime() : null;
        const db = b.scheduledStart ? new Date(b.scheduledStart).getTime() : null;
        if (da !== null && db === null) return -1;
        if (da === null && db !== null) return 1;
        if (da === null && db === null) return 0;
        return (da ?? 0) - (db ?? 0);
      }
      const pa = PRIORITY_ORDER[a.priority ?? "NORMAL"] ?? 3;
      const pb = PRIORITY_ORDER[b.priority ?? "NORMAL"] ?? 3;
      if (pa !== pb) return pa - pb;
      const da = a.scheduledStart ? new Date(a.scheduledStart).getTime() : null;
      const db = b.scheduledStart ? new Date(b.scheduledStart).getTime() : null;
      const aToday = da ? (da >= todayStart.getTime() && da <= todayEnd.getTime()) : false;
      const bToday = db ? (db >= todayStart.getTime() && db <= todayEnd.getTime()) : false;
      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;
      // Within same priority and same today/non-today bucket:
      // dated jobs rise above unscheduled ones
      if (da === null && db !== null) return 1;
      if (da !== null && db === null) return -1;
      if (da === null && db === null) return 0;
      return (da ?? 0) - (db ?? 0); // both non-null here: ascending (nearest first)
    });

    return { activeJobs: active, pastJobs: past, activeStatusCounts: statusCounts, activePriorityCounts: priorityCounts };
  }, [allJobs, filterStatus, filterPriority, sortMode]);

  const filteredPastJobs = pastStatusFilter === "all"
    ? pastJobs
    : pastStatusFilter === "OVERDUE"
      ? pastJobs.filter(j => ACTIVE_STATUSES.has(j.status))
      : pastJobs.filter(j => j.status === pastStatusFilter);
  const pastPageData = filteredPastJobs.slice((pastPage - 1) * PAST_PER_PAGE, pastPage * PAST_PER_PAGE);
  const pastTotalPages = Math.max(1, Math.ceil(filteredPastJobs.length / PAST_PER_PAGE));

  // Past section counts — these now sum to pastJobs.length
  const completedCount = pastJobs.filter(j => j.status === "COMPLETED").length;
  const invoicedCount  = pastJobs.filter(j => j.status === "INVOICED").length;
  const paidCount      = pastJobs.filter(j => j.status === "PAID").length;
  const cancelledCount = pastJobs.filter(j => j.status === "CANCELLED").length;
  const overdueCount   = pastJobs.filter(j => ACTIVE_STATUSES.has(j.status)).length;

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
            { icon: CheckCircle, v: stats ? (stats.completed ?? 0).toString() : "—", l: "Completed", loading: statsQuery.isLoading },
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

      {!isExpanded && <RecommendationsPanel filterActions={['discount_20', 'same_day_offer', 'increase_price']} />}

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
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--t1)" }}>Upcoming & Active Jobs</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", background: "var(--bg-hover)", padding: "2px 9px", borderRadius: 12 }}>
                {jobsQuery.isLoading ? "…" : activeJobs.length}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
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
                <div style={{ fontSize: 10, color: "var(--t4)", letterSpacing: "0.01em" }}>
                  {sortMode === 'priority'
                    ? "Emergency → Urgent → High, then nearest date"
                    : "Nearest scheduled date first · unscheduled last"}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: "0 12px", fontWeight: 600, marginBottom: 16 }} onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="filter-search" style={{ maxWidth: 320 }}>
              <Search size={13} color="var(--t4)" />
              <input
                placeholder="Search jobs, customers, services…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Status chips */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 2, whiteSpace: "nowrap" }}>Status</span>
              {ACTIVE_STATUS_CHIPS.map(chip => {
                const count = activeStatusCounts[chip.status] ?? 0;
                const isActive = filterStatus === chip.status;
                return (
                  <button
                    key={chip.status}
                    onClick={() => setFilterStatus(f => f === chip.status ? "all" : chip.status)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 20,
                      border: `1px solid ${isActive ? chip.color : "transparent"}`,
                      background: isActive ? chip.bg : "var(--bg-hover)",
                      color: isActive ? chip.color : "var(--t3)",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                      opacity: count === 0 ? 0.4 : 1,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: chip.color, flexShrink: 0 }} />
                    {chip.label}
                    <span style={{ fontWeight: 700 }}>{jobsQuery.isLoading ? "…" : count}</span>
                  </button>
                );
              })}
              {filterStatus !== "all" && (
                <button onClick={() => setFilterStatus("all")} style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid var(--bd)", background: "none", color: "var(--t4)", cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>
                  Clear
                </button>
              )}
            </div>
            {/* Priority chips */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 2, whiteSpace: "nowrap" }}>Priority</span>
              {PRIORITY_CHIPS.map(chip => {
                const count = activePriorityCounts[chip.priority] ?? 0;
                const isActive = filterPriority === chip.priority;
                return (
                  <button
                    key={chip.priority}
                    onClick={() => setFilterPriority(f => f === chip.priority ? "all" : chip.priority)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 20,
                      border: `1px solid ${isActive ? chip.color : "transparent"}`,
                      background: isActive ? chip.bg : "var(--bg-hover)",
                      color: isActive ? chip.color : "var(--t3)",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                      opacity: count === 0 ? 0.4 : 1,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: chip.color, flexShrink: 0 }} />
                    {chip.label}
                    <span style={{ fontWeight: 700 }}>{jobsQuery.isLoading ? "…" : count}</span>
                  </button>
                );
              })}
              {filterPriority !== "all" && (
                <button onClick={() => setFilterPriority("all")} style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid var(--bd)", background: "none", color: "var(--t4)", cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body-flush">
          <div className="table-container jobs-table-container">
            <JobTable jobs={activeJobs} loading={jobsQuery.isLoading} onView={handleViewJob} onDelete={setDeleteTarget} sortMode={sortMode} />
          </div>
        </div>
      </div>

      {/* Completed Jobs Section */}
      <div className="card anim-fade-up delay-3" style={{ borderTop: "3px solid var(--green, #10b981)" }}>
        {/* Section header */}
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle size={15} color="#10b981" />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--t1)" }}>Completed Jobs</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "2px 9px", borderRadius: 12, border: "1px solid rgba(16,185,129,0.2)" }}>
                  {jobsQuery.isLoading ? "…" : pastJobs.length} total
                </span>
              </div>
              {/* Funnel stats row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {[
                  { label: "Completed", count: completedCount, color: "#10b981", bg: "rgba(16,185,129,0.08)", status: "COMPLETED" },
                  { label: "Invoiced", count: invoicedCount, color: "#0891b2", bg: "rgba(8,145,178,0.08)", status: "INVOICED" },
                  { label: "Paid", count: paidCount, color: "#7c3aed", bg: "rgba(124,58,237,0.08)", status: "PAID" },
                  { label: "Cancelled", count: cancelledCount, color: "#dc2626", bg: "rgba(220,38,38,0.08)", status: "CANCELLED" },
                  ...(overdueCount > 0 ? [{ label: "Overdue", count: overdueCount, color: "#ea580c", bg: "rgba(234,88,12,0.08)", status: "OVERDUE" }] : []),
                ].map(s => (
                  <button
                    key={s.status}
                    onClick={() => { setPastStatusFilter(f => f === s.status ? "all" : s.status); setPastPage(1); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 20, border: `1px solid ${pastStatusFilter === s.status ? s.color : "transparent"}`,
                      background: pastStatusFilter === s.status ? s.bg : "var(--bg-hover)",
                      color: pastStatusFilter === s.status ? s.color : "var(--t3)",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    {s.label}
                    <span style={{ fontWeight: 700 }}>{jobsQuery.isLoading ? "…" : s.count}</span>
                  </button>
                ))}
                {pastStatusFilter !== "all" && (
                  <button
                    onClick={() => { setPastStatusFilter("all"); setPastPage(1); }}
                    style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid var(--bd)", background: "none", color: "var(--t4)", cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--t4)", textAlign: "right", marginTop: 4 }}>
              Most recent first
            </div>
          </div>
        </div>

        <div className="card-body-flush">
          {filteredPastJobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--t4)" }}>
              <CheckCircle size={32} style={{ margin: "0 auto 10px", opacity: 0.3, display: "block" }} />
              <div style={{ fontSize: 13, fontWeight: 500 }}>No {pastStatusFilter !== "all" ? pastStatusFilter.toLowerCase() : "completed"} jobs yet</div>
            </div>
          ) : (
            <div className="table-container jobs-table-container">
              <JobTable jobs={pastPageData} loading={jobsQuery.isLoading} onView={handleViewJob} onDelete={setDeleteTarget} />
            </div>
          )}
        </div>

        <div className="card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid var(--bd)" }}>
          <span style={{ fontSize: 13, color: "var(--t3)" }}>
            {filteredPastJobs.length > 0
              ? `Showing ${(pastPage - 1) * PAST_PER_PAGE + 1}–${Math.min(pastPage * PAST_PER_PAGE, filteredPastJobs.length)} of ${filteredPastJobs.length}`
              : "0 jobs"}
          </span>
          {pastTotalPages > 1 && (
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPastPage(p => Math.max(1, p - 1))} disabled={pastPage === 1}><ChevronLeft size={18} /></button>
              <span style={{ fontSize: 13, color: "var(--t2)", margin: "0 4px" }}>Page {pastPage} of {pastTotalPages}</span>
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPastPage(p => Math.min(pastTotalPages, p + 1))} disabled={pastPage === pastTotalPages}><ChevronRight size={18} /></button>
            </div>
          )}
        </div>
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
