import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Wrench, Clock, CheckCircle, FileText, AlertTriangle, Search,
  Maximize2, Minimize2, ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
  Zap, Trash2, Sparkles, X,
} from "lucide-react";
import { useJobs, useJobStats, useDeleteJob } from "../../hooks/useJobs";
import { useTechnicians } from "../../hooks/useScheduling";
import { useProjectsFull } from "../projects/projectsApi";
import type { Job } from "../../types/api";
import RecommendationsPanel from "../../components/RecommendationsPanel";
import Avatar from "../../components/Avatar";
import KelvinDigest from '../../kelvin/KelvinDigest'
import { useKelvinContext } from '../../kelvin/useKelvinContext'
import { KelvinIcon } from '../../kelvin/KelvinMark'
import { usePersistentState } from "../../lib/usePersistentState";
import JobFilterMenu, { type FilterOption } from "./JobFilterMenu";
import JobFilterChips from "./JobFilterChips";
import JobsTable, { OPEN_STATUS_SET } from "./JobsTable";
import { DONE_STATUSES, OPEN_STATUSES, PRIORITIES, PRIORITY_RANK, PriorityLabel, StatusLabel, priorityWord, statusWord } from "./jobLabels";
import "./jobsTable.css";

type Tab = "active" | "missed" | "completed";
const isTab = (v: unknown): v is Tab => v === "active" || v === "missed" || v === "completed";
const UNASSIGNED = "__none__";
const PAGE_SIZE = 15;

function Skeleton({ h = 14 }: { h?: number }) {
  return <div style={{ width: "100%", height: h, background: "var(--bg-hover)", borderRadius: 4 }} />;
}

const dayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const when = (j: Job) => (j.scheduledStart ? new Date(j.scheduledStart).getTime() : null);

export default function Jobs() {
  const navigate = useNavigate();
  const [tab, setTab] = usePersistentState<Tab>("jobs.tab", "active", isTab);
  const [search, setSearch] = useState("");
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [prioritySel, setPrioritySel] = useState<string[]>([]);
  const [techSel, setTechSel] = useState<string[]>([]);
  const [filterAgreement, setFilterAgreement] = useState(false);
  const [filterAsked, setFilterAsked] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [sortMode, setSortMode] = useState<"priority" | "date">("priority");
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [forecastDays, setForecastDays] = useState<number>(7);
  const [utilizationFilterActive, setUtilizationFilterActive] = useState(false);
  useKelvinContext({ page: "jobs", label: "Jobs", ...(statusSel.length ? { filter: statusSel.join(",") } : {}) });

  // Switching tab starts that tab's own status filter fresh (a "Paid" filter means nothing among open jobs).
  const chooseTab = (t: Tab) => { setTab(t); setStatusSel([]); setPage(1); };

  // ── Deep links ──────────────────────────────────────────────────────────────
  // /jobs?status=EN_ROUTE opens the right tab already filtered; the high-utilization
  // recommendation lands here as ?filter=high_utilization&forecastDays=N.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const status = searchParams.get("status")?.toUpperCase();
    if (status) {
      setTab(DONE_STATUSES.includes(status) ? "completed" : "active");
      setStatusSel([status]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("filter") === "high_utilization") {
      setUtilizationFilterActive(true);
      setTab("active");
      const days = Number(searchParams.get("forecastDays"));
      if (Number.isFinite(days) && days > 0) setForecastDays(days);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const clearUtilizationFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("filter");
    next.delete("forecastDays");
    setSearchParams(next);
    setUtilizationFilterActive(false);
  };

  const statsQuery = useJobStats();
  const jobsQuery = useJobs({ limit: 200, search: search || undefined });
  const deleteJob = useDeleteJob();
  const techniciansQuery = useTechnicians();
  const { projects: allProjects } = useProjectsFull();
  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of allProjects) map.set(p.id, p.name);
    return map;
  }, [allProjects]);
  // Only projects that actually have a job here get listed.
  const projectsWithJobs = useMemo(() => {
    const ids = new Set((jobsQuery.data?.data ?? []).map(j => j.projectId).filter(Boolean) as string[]);
    return [...ids].map(id => ({ id, name: projectNameById.get(id) ?? "Project" })).sort((a, b) => a.name.localeCompare(b.name));
  }, [jobsQuery.data, projectNameById]);

  const stats = statsQuery.data;
  const allJobs: Job[] = jobsQuery.data?.data ?? [];
  const technicians = techniciansQuery.data ?? [];
  const avatarByUserId = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const t of technicians) if (t.userId) map[t.userId] = t.avatarUrl;
    return map;
  }, [technicians]);

  // ── The three groups: coming up, missed, finished ───────────────────────────
  const groups = useMemo(() => {
    const today = dayStart();
    const upcoming = (j: Job) => OPEN_STATUS_SET.has(j.status) && (when(j) === null || (when(j) as number) >= today);
    const missed = allJobs
      .filter(j => OPEN_STATUS_SET.has(j.status) && !upcoming(j))
      .sort((a, b) => (when(a) ?? 0) - (when(b) ?? 0));
    const finished = allJobs
      .filter(j => !OPEN_STATUS_SET.has(j.status))
      .sort((a, b) => (when(b) ?? 0) - (when(a) ?? 0));
    return { active: allJobs.filter(upcoming), missed, finished };
  }, [allJobs]);

  const base = tab === "active" ? groups.active : tab === "missed" ? groups.missed : groups.finished;

  const matches = (j: Job, skip?: "status" | "priority" | "tech") =>
    (skip === "status" || !statusSel.length || statusSel.includes(j.status)) &&
    (skip === "priority" || !prioritySel.length || prioritySel.includes(j.priority ?? "NORMAL")) &&
    (skip === "tech" || !techSel.length || techSel.includes(j.assignedToId ?? UNASSIGNED)) &&
    (!filterProjectId || j.projectId === filterProjectId);

  const shown = useMemo(() => {
    let list = base.filter(j => matches(j));
    if (tab === "active") {
      if (filterAgreement) list = list.filter(j => j.isAgreementJob);
      if (filterAsked) list = list.filter(j => !!j.rescheduleState);
      if (utilizationFilterActive) {
        const now = Date.now();
        const end = now + forecastDays * 86_400_000;
        list = list.filter(j => { const t = when(j); return t !== null && t >= now && t < end; });
      }
      const today = dayStart();
      const todayEnd = today + 86_400_000 - 1;
      list = [...list].sort((a, b) => {
        const da = when(a), db = when(b);
        if (sortMode === "date") {
          if (da !== null && db === null) return -1;
          if (da === null && db !== null) return 1;
          return (da ?? 0) - (db ?? 0);
        }
        const pa = PRIORITY_RANK[a.priority ?? "NORMAL"] ?? 3;
        const pb = PRIORITY_RANK[b.priority ?? "NORMAL"] ?? 3;
        if (pa !== pb) return pa - pb;
        const aToday = da !== null && da >= today && da <= todayEnd;
        const bToday = db !== null && db >= today && db <= todayEnd;
        if (aToday !== bToday) return aToday ? -1 : 1;
        if (da === null && db !== null) return 1;
        if (da !== null && db === null) return -1;
        return (da ?? 0) - (db ?? 0);
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, tab, statusSel, prioritySel, techSel, filterProjectId, filterAgreement, filterAsked, utilizationFilterActive, forecastDays, sortMode]);

  useEffect(() => { setPage(1); }, [tab, statusSel, prioritySel, techSel, filterProjectId, search]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  // A shrinking list (a job moved tabs, a filter applied) must never leave you on a page that no longer exists.
  const current = Math.min(page, pages);
  const rows = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  // ── Filter menus: each option is drawn the way the table draws it, with its count in this tab ──
  const count = (pick: (j: Job) => string, skip: "status" | "priority" | "tech") => {
    const m: Record<string, number> = {};
    for (const j of base) if (matches(j, skip)) m[pick(j)] = (m[pick(j)] ?? 0) + 1;
    return m;
  };
  const statusCounts = count(j => j.status, "status");
  const priorityCounts = count(j => j.priority ?? "NORMAL", "priority");
  const techCounts = count(j => j.assignedToId ?? UNASSIGNED, "tech");
  const statusOptions: FilterOption[] = (tab === "completed" ? DONE_STATUSES : OPEN_STATUSES).map(s => ({ value: s, text: statusWord(s), node: <StatusLabel status={s} bare />, count: statusCounts[s] ?? 0 }));
  const priorityOptions: FilterOption[] = PRIORITIES.map(p => ({ value: p, text: priorityWord(p), node: <PriorityLabel priority={p} />, count: priorityCounts[p] ?? 0 }));
  const techOptions: FilterOption[] = [
    ...technicians.filter(t => t.userId).map(t => ({
      value: t.userId as string, text: t.name, count: techCounts[t.userId as string] ?? 0,
      node: <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Avatar name={t.name} avatarUrl={t.avatarUrl} size={22} radius={11} fontSize={9} />{t.name}</span>,
    })),
    { value: UNASSIGNED, text: "Unassigned", count: techCounts[UNASSIGNED] ?? 0, node: <span style={{ color: "var(--t3)" }}>Unassigned</span> },
  ];
  const anyFilter = statusSel.length || prioritySel.length || techSel.length || filterProjectId || filterAgreement || filterAsked;
  const clearAll = () => { setStatusSel([]); setPrioritySel([]); setTechSel([]); setFilterProjectId(""); setFilterAgreement(false); setFilterAsked(false); };

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

  const urgentCount = groups.active.filter(j => j.priority === "EMERGENCY" || j.priority === "URGENT").length;
  const emptyFor: Record<Tab, { title: string; sub: string }> = {
    active: { title: "No upcoming or active jobs", sub: anyFilter ? "Nothing matches these filters." : "New jobs will appear here." },
    missed: { title: "Nothing missed", sub: anyFilter ? "Nothing matches these filters." : "Every assigned job was done, moved or cancelled." },
    completed: { title: "No finished jobs yet", sub: anyFilter ? "Nothing matches these filters." : "Completed, invoiced, paid and cancelled jobs show here." },
  };

  return (
    <div className="anim-fade-up">
      {/* KPIs */}
      {!isExpanded && (
        <div className="kpi-grid mb-5">
          {[
            { icon: Wrench, v: stats ? (stats.pending + stats.scheduled + stats.inProgress).toString() : "—", l: "Open Jobs", loading: statsQuery.isLoading, onClick: () => { chooseTab("active"); } },
            { icon: AlertTriangle, v: stats ? stats.pending.toString() : "—", l: "Pending", loading: statsQuery.isLoading, onClick: () => { setTab("active"); setStatusSel(["PENDING"]); } },
            { icon: CheckCircle, v: stats ? (stats.completed ?? 0).toString() : "—", l: "Completed", loading: statsQuery.isLoading, onClick: () => { setTab("completed"); setStatusSel(["COMPLETED"]); } },
            { icon: FileText, v: stats ? stats.invoiced.toString() : "—", l: "Awaiting Invoice", loading: statsQuery.isLoading, onClick: () => navigate("/finance") },
            { icon: Clock, v: "—", l: "Avg Job Duration", loading: false, onClick: undefined },
          ].map((k) => (
            <div key={k.l} className="kpi-card" style={{ padding: "14px 16px", borderRadius: "var(--r-lg)", cursor: k.onClick ? "pointer" : "default" }} onClick={k.onClick}>
              <div className="kpi-card-top" style={{ marginBottom: 10, alignItems: "center", justifyContent: "space-between" }}>
                <div className="kpi-label" style={{ fontSize: 11.5, color: "var(--t3)", fontWeight: 500, margin: 0 }}>{k.l}</div>
                <k.icon size={15} strokeWidth={1.7} color="var(--t4)" />
              </div>
              {k.loading ? <Skeleton h={26} /> : <div className="kpi-value" style={{ fontSize: 24, fontWeight: 700, color: "var(--t1)" }}>{k.v}</div>}
            </div>
          ))}
        </div>
      )}

      {!isExpanded && (
        <RecommendationsPanel
          filterActions={['discount_20', 'same_day_offer', 'increase_price']}
          forecastDays={forecastDays}
          headerExtra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>Forecast:</span>
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setForecastDays(d)}
                  style={{
                    padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)',
                    background: forecastDays === d ? 'var(--blue)' : 'var(--bg-card)',
                    color: forecastDays === d ? '#fff' : 'var(--t2)',
                  }}
                >{d}d</button>
              ))}
            </div>
          }
        />
      )}

      {/* AI recommendation deep-link banner */}
      {utilizationFilterActive && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "color-mix(in srgb, var(--amber) 10%, transparent)", borderRadius: 8, marginBottom: 12, color: "var(--amber)", fontSize: 13, fontWeight: 500 }}>
          <KelvinIcon fallback={<Sparkles size={14} />} />
          Showing jobs from the High Utilization recommendation — scheduled in the next {forecastDays} day{forecastDays !== 1 ? 's' : ''}.
          <button onClick={clearUtilizationFilter} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, color: "var(--amber)", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            <X size={12} /> Clear filter
          </button>
        </div>
      )}

      {/* Urgent banner */}
      {urgentCount > 0 && tab === "active" && (
        <div className="jt-urgent-note">
          <Zap size={14} />
          {urgentCount} urgent/emergency job{urgentCount > 1 ? "s" : ""} — shown at the top of the list
        </div>
      )}

      <KelvinDigest page="jobs" />

      <div className="card anim-fade-up delay-2 mb-4" style={{ overflow: "visible" }}>
        {jobsQuery.isError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "var(--red-dim)", borderRadius: 8, color: "var(--red)", fontSize: 13, margin: "0 0 4px" }}>
            <AlertCircle size={14} /> Failed to load jobs.
            <button onClick={() => jobsQuery.refetch()} style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 4, color: "var(--red)", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="jt-tabs">
          <div className="jt-tablist" role="tablist" aria-label="Jobs">
            {([
              ["active", "Upcoming and active", groups.active.length, false],
              ["missed", "Missed", groups.missed.length, true],
              ["completed", "Completed", groups.finished.length, false],
            ] as Array<[Tab, string, number, boolean]>).map(([key, label, n, warn]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} className={`jt-tab${tab === key ? " is-on" : ""}`} onClick={() => chooseTab(key)}>
                {label} <span className={`jt-n${warn && n > 0 ? " is-warn" : ""}`}>{jobsQuery.isLoading ? "…" : n}</span>
              </button>
            ))}
          </div>
          <span style={{ flex: 1 }} />
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 10, gap: 6, display: "inline-flex", alignItems: "center" }} onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
          </button>
        </div>

        {tab === "missed" && groups.missed.length > 0 && (
          <p style={{ margin: 0, padding: "14px 24px 0", fontSize: 13, color: "var(--t3)" }}>
            Assigned, but their day has passed and they are still open. Open one to reschedule it, give it to someone else, mark it complete, or cancel it.
          </p>
        )}

        {/* Filters: the same bar in every tab, with the options that make sense for it */}
        <div className="jf-bar">
          <label className="jf-search">
            <Search size={14} aria-hidden="true" />
            <input placeholder="Search jobs, customers, services" aria-label="Search jobs" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
          <JobFilterMenu label="Technician" options={techOptions} selected={techSel} onChange={setTechSel} />
          {projectsWithJobs.length > 0 && (
            <select className="select jf-select" aria-label="Project" value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projectsWithJobs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {tab === "active" && (
            <>
              <button type="button" className={`jf-toggle${filterAgreement ? " is-on" : ""}`} aria-pressed={filterAgreement} onClick={() => setFilterAgreement(v => !v)} title="Only jobs created from service agreements">
                Agreement visits <b style={{ fontWeight: 600 }}>{allJobs.filter(j => j.isAgreementJob && OPEN_STATUS_SET.has(j.status)).length}</b>
              </button>
              <button type="button" className={`jf-toggle${filterAsked ? " is-on" : ""}`} aria-pressed={filterAsked} onClick={() => setFilterAsked(v => !v)} title="Customers who asked for another time and are waiting for an answer">
                Customer asked to change <b style={{ fontWeight: 600 }}>{allJobs.filter(j => !!j.rescheduleState && OPEN_STATUS_SET.has(j.status)).length}</b>
              </button>
              <span className="jf-seg" role="radiogroup" aria-label="Sort by">
                <button type="button" role="radio" aria-checked={sortMode === "priority"} className={sortMode === "priority" ? "is-on" : ""} onClick={() => setSortMode("priority")}>Most urgent first</button>
                <button type="button" role="radio" aria-checked={sortMode === "date"} className={sortMode === "date" ? "is-on" : ""} onClick={() => setSortMode("date")}>Soonest first</button>
              </span>
            </>
          )}
          {anyFilter ? <button type="button" className="jf-clear" onClick={clearAll}>Clear all filters</button> : null}
        </div>
        <div className="jc-wrap">
          <JobFilterChips label="Status" options={statusOptions} selected={statusSel} onChange={setStatusSel} loading={jobsQuery.isLoading} />
          <JobFilterChips label="Priority" options={priorityOptions} selected={prioritySel} onChange={setPrioritySel} loading={jobsQuery.isLoading} />
        </div>

        <div className="jt-wrap">
          <JobsTable jobs={rows} loading={jobsQuery.isLoading} onView={handleViewJob} onDelete={setDeleteTarget} avatarByUserId={avatarByUserId} empty={emptyFor[tab]} />
        </div>

        <div className="jt-foot">
          <span style={{ fontSize: 13, color: "var(--t3)" }}>
            {shown.length === 0 ? "0 jobs" : `Showing ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, shown.length)} of ${shown.length}`}
          </span>
          {pages > 1 && (
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} aria-label="Previous page" onClick={() => setPage(Math.max(1, current - 1))} disabled={current === 1}><ChevronLeft size={18} /></button>
              <span style={{ fontSize: 13, color: "var(--t2)", margin: "0 4px" }}>Page {current} of {pages}</span>
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} aria-label="Next page" onClick={() => setPage(Math.min(pages, current + 1))} disabled={current === pages}><ChevronRight size={18} /></button>
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
