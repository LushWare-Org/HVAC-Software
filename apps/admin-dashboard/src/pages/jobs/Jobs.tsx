import { useState } from "react";
import {
  Wrench,
  Clock,
  CheckCircle,
  FileText,
  Search,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Eye,
  Edit2,
  Phone,
  Mail,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useJobs, useJobStats } from "../../hooks/useJobs";
import type { Job } from "../../types/api";

// ─── Status/priority maps ─────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; css: string }> = {
  PENDING:     { label: "Pending",     css: "badge-amber" },
  SCHEDULED:   { label: "Scheduled",   css: "badge-violet" },
  EN_ROUTE:    { label: "En Route",    css: "badge-blue" },
  ON_SITE:     { label: "In Progress", css: "badge-blue" },
  IN_PROGRESS: { label: "In Progress", css: "badge-blue" },
  COMPLETED:   { label: "Completed",   css: "badge-green" },
  INVOICED:    { label: "Invoiced",    css: "badge-cyan" },
  PAID:        { label: "Paid",        css: "badge-green" },
  CANCELLED:   { label: "Cancelled",  css: "badge-red" },
  ON_HOLD:     { label: "On Hold",     css: "badge-neutral" },
};

const PRIORITY_CSS: Record<string, string> = {
  LOW:       "badge-neutral",
  NORMAL:    "badge-neutral",
  HIGH:      "badge-amber",
  URGENT:    "badge-red",
  EMERGENCY: "badge-red",
};

function Skeleton({ h = 14 }: { h?: number }) {
  return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />;
}

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTech] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // ── API queries ─────────────────────────────────────────────────────────────
  const statsQuery = useJobStats();
  const jobsQuery = useJobs({
    page,
    limit: itemsPerPage,
    search: search || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    assignedToId: filterTech !== "all" ? filterTech : undefined,
  });

  const jobs: Job[] = jobsQuery.data?.data ?? [];
  const totalJobs = jobsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, jobsQuery.data?.totalPages ?? 1);
  const stats = statsQuery.data;

  const handleViewJob = (job: Job) => {
    window.dispatchEvent(new CustomEvent("open-job-detail", { detail: job }));
  };

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

      {/* Table */}
      <div className="card anim-fade-up delay-2">
        {jobsQuery.isError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, margin: '0 0 4px' }}>
            <AlertCircle size={14} /> Failed to load jobs.
            <button onClick={() => jobsQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}><RefreshCw size={12} /> Retry</button>
          </div>
        )}
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filter-bar">
            <div className="filter-search">
              <Search size={13} color="var(--t4)" />
              <input placeholder="Search jobs, customers, services…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="select" style={{ width: 160 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="EN_ROUTE">En Route</option>
              <option value="ON_SITE">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="INVOICED">Invoiced</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ marginLeft: 8, padding: "0 12px", fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
            </button>
          </div>
        </div>

        <div className="card-body-flush">
          <div className="table-container jobs-table-container">
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
                {jobsQuery.isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 9 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
                ))}
                {!jobsQuery.isLoading && jobs.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <div className="empty-icon"><Wrench size={22} /></div>
                        <div className="empty-title">No jobs match your filters</div>
                      </div>
                    </td>
                  </tr>
                )}
                {!jobsQuery.isLoading && jobs.map(j => {
                  const s = STATUS[j.status] ?? { label: j.status, css: 'badge-neutral' };
                  const amount = j.finalAmount ?? j.estimatedAmount ?? 0;
                  return (
                    <tr key={j.id} onClick={() => handleViewJob(j)} className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group">
                      <td><span className="td-mono td-primary">{j.id}</span></td>
                      <td>
                        <div className="cell-user"><div>
                          <div className="cell-name">{j.customerName ?? '—'}</div>
                          <div className="cell-email">{j.serviceAddress ?? j.customerAddress ?? ''}</div>
                        </div></div>
                      </td>
                      <td>
                        <div className="font-500">{j.title}</div>
                        {j.description && <div className="text-xs text-4 mt-0.5 truncate" style={{ maxWidth: 160 }}>{j.description}</div>}
                      </td>
                      <td>{j.assignedToName ?? '—'}</td>
                      <td>
                        {j.scheduledStart && (
                          <>
                            <div className="text-sm font-500 text-[var(--t3)]">{new Date(j.scheduledStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-xs text-4 mt-0.5">{new Date(j.scheduledStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        )}
                      </td>
                      <td><span className={`badge ${PRIORITY_CSS[j.priority ?? 'NORMAL'] ?? 'badge-neutral'}`}>{(j.priority ?? 'NORMAL').toLowerCase()}</span></td>
                      <td className="text-center"><span className={`badge ${s.css}`}>{s.label}</span></td>
                      <td className="text-right td-primary font-600">${amount.toLocaleString()}</td>
                      <td className="sticky-actions">
                        <div className="flex items-center gap-0.5 justify-center">
                          <button className="flex items-center justify-center p-1.5 text-[var(--blue)] hover:bg-blue-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="View Details" onClick={e => { e.stopPropagation(); handleViewJob(j); }}><Eye size={15} /></button>
                          <button className="flex items-center justify-center p-1.5 text-[var(--amber)] hover:bg-amber-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Edit Job" onClick={e => { e.stopPropagation(); handleViewJob(j); }}><Edit2 size={15} /></button>
                          <button className="flex items-center justify-center p-1.5 text-[var(--green)] hover:bg-green-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Call Customer" onClick={e => e.stopPropagation()}><Phone size={15} /></button>
                          <button className="flex items-center justify-center p-1.5 text-[var(--t2)] hover:bg-gray-100 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Email Customer" onClick={e => e.stopPropagation()}><Mail size={15} /></button>
                          <button className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Cancel Job" onClick={e => e.stopPropagation()}><XCircle size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          <span className="text-[13px] text-[var(--t3)]">Showing {totalJobs > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, totalJobs)} of {totalJobs} jobs</span>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={18} /></button>
            <span className="text-[13px] text-[var(--t2)] mx-2">Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
