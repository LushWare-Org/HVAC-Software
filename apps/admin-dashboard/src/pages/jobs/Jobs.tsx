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
} from "lucide-react";
import { TECHNICIANS } from "./technicians";

const INITIAL_JOBS = [
  {
    id: "JOB-0006",
    customer: "Clifford Johnson",
    color: "#3B82F6",
    address: "1234 Oak Lane, Dallas TX",
    service: "HVAC Maintenance",
    description: "Annual boiler service and safety check",
    type: "Maintenance",
    tech: "Mike Davis",
    status: "in_progress",
    priority: "normal",
    date: "Mar 06, 2026",
    time: "10:00 AM",
    amount: 385,
  },
  {
    id: "JOB-0005",
    customer: "Sarah Williams",
    color: "#10B981",
    address: "500 Commerce St, Plano TX",
    service: "AC Installation",
    description: "Install new 5-ton Carrier AC unit",
    type: "Installation",
    tech: "Tom Baker",
    status: "scheduled",
    priority: "high",
    date: "Mar 06, 2026",
    time: "2:00 PM",
    amount: 2400,
  },
  {
    id: "JOB-0004",
    customer: "Robert Chen",
    color: "#8B5CF6",
    address: "88 Maple Dr, Frisco TX",
    service: "Blower Motor Replacement",
    description: "Replace noisy blower motor in attic furnace",
    type: "Repair",
    tech: "Anna Smith",
    status: "completed",
    priority: "normal",
    date: "Mar 05, 2026",
    time: "11:00 AM",
    amount: 1100,
  },
  {
    id: "JOB-0003",
    customer: "Maria Garcia",
    color: "#F59E0B",
    address: "330 Birch Ave, Irving TX",
    service: "AC Not Cooling",
    description: "Customer reports AC is blowing warm air",
    type: "Emergency",
    tech: "James Lee",
    status: "pending",
    priority: "urgent",
    date: "Mar 06, 2026",
    time: "4:00 PM",
    amount: 290,
  },
  {
    id: "JOB-0002",
    customer: "David Kim",
    color: "#06B6D4",
    address: "92 Elm St, Carrollton TX",
    service: "Furnace Repair",
    description: "Diagnose and replace faulty glow plug",
    type: "Repair",
    tech: "Mike Davis",
    status: "completed",
    priority: "normal",
    date: "Mar 05, 2026",
    time: "8:30 AM",
    amount: 560,
  },
  {
    id: "JOB-0001",
    customer: "Tech Solutions",
    color: "#5A6882",
    address: "1500 N. Hwy, Richardson TX",
    service: "Commercial HVAC Service",
    description: "Quarterly preventative maintenance on 3 RTUs",
    type: "Maintenance",
    tech: "Tom Baker",
    status: "invoiced",
    priority: "normal",
    date: "Mar 04, 2026",
    time: "3:15 PM",
    amount: 4800,
  },
];

const STATUS: Record<string, { label: string; css: string }> = {
  in_progress: { label: "In Progress", css: "badge-blue" },
  scheduled: { label: "Scheduled", css: "badge-violet" },
  completed: { label: "Completed", css: "badge-green" },
  pending: { label: "Pending", css: "badge-amber" },
  invoiced: { label: "Invoiced", css: "badge-cyan" },
  cancelled: { label: "Cancelled", css: "badge-red" },
};
const TYPE_COLOR: Record<string, string> = {
  Maintenance: "badge-blue",
  Installation: "badge-cyan",
  Repair: "badge-amber",
  Emergency: "badge-red",
};
const PRIORITY_CSS: Record<string, string> = {
  normal: "badge-neutral",
  high: "badge-amber",
  urgent: "badge-red",
};

export default function Jobs() {
  const [jobs] = useState(INITIAL_JOBS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterTech, setFilterTech] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = jobs.filter((j) => {
    const matchSearch =
      j.customer.toLowerCase().includes(search.toLowerCase()) ||
      j.id.toLowerCase().includes(search.toLowerCase()) ||
      j.service.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || j.status === filterStatus;
    const matchType = filterType === "all" || j.type === filterType;
    const matchTech = filterTech === "all" || j.tech === filterTech;
    return matchSearch && matchStatus && matchType && matchTech;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedJobs = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const handleViewJob = (job: any) => {
    window.dispatchEvent(new CustomEvent("open-job-detail", { detail: job }));
  };

  return (
    <div className="anim-fade-up">
      {/* KPIs */}
      {!isExpanded && (
        <div className="kpi-grid mb-5">
          {[
            {
              icon: Wrench,
              g: "kpi-grad-blue",
              v: "12",
              l: "Open Jobs",
              sub: "7 in progress",
              delta: "+3",
              up: true,
            },
            {
              icon: AlertTriangle,
              g: "kpi-grad-amber",
              v: "4",
              l: "Pending Approval",
              sub: "Awaiting confirm",
              delta: "−1",
              up: true,
            },
            {
              icon: CheckCircle,
              g: "kpi-grad-green",
              v: "7",
              l: "Completed Today",
              sub: "$8,240 revenue",
              delta: "+2",
              up: true,
            },
            {
              icon: FileText,
              g: "kpi-grad-violet",
              v: "3",
              l: "Awaiting Invoice",
              sub: "Est. $6,800",
              delta: "New",
              up: true,
            },
            {
              icon: Clock,
              g: "kpi-grad-cyan",
              v: "2.4h",
              l: "Avg Job Duration",
              sub: "vs 2.8h last mo",
              delta: "−17%",
              up: true,
            },
          ].map((k) => (
            <div
              key={k.l}
              className="kpi-card"
              style={{ padding: "16px 20px", borderRadius: "var(--r-md)" }}
            >
              <div
                className="kpi-card-top"
                style={{
                  marginBottom: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  className="kpi-label"
                  style={{
                    fontSize: 13,
                    color: "var(--t3)",
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {k.l}
                </div>
                <k.icon size={16} strokeWidth={1.5} color="var(--t3)" />
              </div>
              <div
                className="kpi-value"
                style={{ fontSize: 26, fontWeight: 700, color: "var(--t1)" }}
              >
                {k.v}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card anim-fade-up delay-2">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filter-bar">
            <div className="filter-search">
              <Search size={13} color="var(--t4)" />
              <input
                placeholder="Search jobs, customers, services…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="select"
              style={{ width: 160 }}
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="invoiced">Invoiced</option>
            </select>
            <select
              className="select"
              style={{ width: 140 }}
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Types</option>
              <option value="Installation">Installation</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Repair">Repair</option>
              <option value="Emergency">Emergency</option>
            </select>
            <select
              className="select"
              style={{ width: 160 }}
              value={filterTech}
              onChange={(e) => {
                setFilterTech(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Technicians</option>
              {TECHNICIANS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              style={{ marginLeft: 8, padding: "0 12px", fontWeight: 600 }}
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse View" : "Expand View"}
            >
              {isExpanded ? (
                <>
                  <Minimize2 size={14} /> Collapse
                </>
              ) : (
                <>
                  <Maximize2 size={14} /> Expand
                </>
              )}
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
                  <th>Job Type</th>
                  <th>Technician</th>
                  <th>Scheduled</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th className="sticky-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state">
                        <div className="empty-icon">
                          <Wrench size={22} />
                        </div>
                        <div className="empty-title">
                          No jobs match your filters
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedJobs.map((j) => {
                  const s = STATUS[j.status];
                  return (
                    <tr key={j.id}>
                      <td>
                        <span className="td-mono td-primary">{j.id}</span>
                      </td>
                      <td>
                        <div className="cell-user">
                          <div>
                            <div className="cell-name">{j.customer}</div>
                            <div className="cell-email">{j.address}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-500">{j.service}</div>
                        <div
                          className="text-xs text-4 mt-0.5 truncate"
                          style={{ maxWidth: 160 }}
                        >
                          {j.description}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${TYPE_COLOR[j.type] ?? "badge-neutral"}`}
                        >
                          {j.type}
                        </span>
                      </td>
                      <td>{j.tech}</td>
                      <td>
                        <div className="text-sm font-500 text-[var(--t3)]">
                          {j.date}
                        </div>
                        <div className="text-xs text-4 mt-0.5">{j.time}</div>
                      </td>
                      <td>
                        <span className={`badge ${PRIORITY_CSS[j.priority]}`}>
                          {j.priority}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${s.css}`}>
                          <span style={{ background: "currentColor" }} />
                          {s.label}
                        </span>
                      </td>
                      <td className="text-right td-primary font-600">
                        ${j.amount.toLocaleString()}
                      </td>
                      <td className="sticky-actions">
                        <div className="flex items-center gap-0.5 justify-center">
                          <button
                            className="flex items-center justify-center p-1.5 text-[var(--blue)] hover:bg-blue-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                            title="View Details"
                            onClick={() => handleViewJob(j)}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="flex items-center justify-center p-1.5 text-[var(--amber)] hover:bg-amber-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                            title="Edit Job"
                            onClick={() => handleViewJob(j)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="flex items-center justify-center p-1.5 text-[var(--green)] hover:bg-green-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                            title="Call Customer"
                          >
                            <Phone size={15} />
                          </button>
                          <button
                            className="flex items-center justify-center p-1.5 text-[var(--t2)] hover:bg-gray-100 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                            title="Email Customer"
                          >
                            <Mail size={15} />
                          </button>
                          <button
                            className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                            title="Cancel Job"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div
          className="card-footer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <span className="text-[13px] text-[var(--t3)]">
            Showing {filtered.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(page * itemsPerPage, filtered.length)} of{" "}
            {filtered.length} jobs
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary btn-sm flex items-center justify-center p-1"
              style={{ width: 32, height: 32 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[13px] text-[var(--t2)] mx-2">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              className="btn btn-secondary btn-sm flex items-center justify-center p-1"
              style={{ width: 32, height: 32 }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
