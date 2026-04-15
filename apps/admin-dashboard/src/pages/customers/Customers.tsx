import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Target,
  FileText,
  Plus,
  Search,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import CustomerDetailsSidebar from "./CustomerDetailsSidebar";
import LeadDetailsSidebar from "./LeadDetailsSidebar";
import AddPersonModal from "./AddPersonModal";
import { useCustomers, useLeads, useAgreements, useDeleteCustomer, useDeleteLead, useUpdateCustomer, useCustomerStatusSummary } from "../../hooks/useCustomers";
import { customerName, leadName } from "../../types/api";
import type { Customer, CustomerStatusSummary, Lead } from "../../types/api";
import api from "../../lib/api";

// ─── Status maps ──────────────────────────────────────────────────────────────

const LEAD_STATUS: Record<string, string> = {
  NEW: "badge-neutral",
  CONTACTED: "badge-blue",
  QUALIFIED: "badge-violet",
  WON: "badge-green",
  LOST: "badge-red",
};

const AGREEMENT_STATUS: Record<string, string> = {
  ACTIVE: "badge-green",
  EXPIRING: "badge-amber",
  INACTIVE: "badge-neutral",
  EXPIRED: "badge-amber",
  CANCELLED: "badge-red",
};

function fmt(n: number) {
  return `$${n.toLocaleString()}`;
}

function Skeleton({ h = 14 }: { h?: number }) {
  return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />;
}

function FollowupToggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      aria-label={checked ? "Disable automatic follow-up" : "Enable automatic follow-up"}
      aria-pressed={checked}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: 46,
        height: 24,
        borderRadius: 8,
        border: `1px solid ${checked ? 'var(--blue)' : 'var(--bd)'}`,
        background: checked ? 'var(--blue)' : 'var(--bg-card-2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: 2,
        opacity: disabled ? 0.6 : 1,
        transition: 'background-color var(--dur), border-color var(--dur)',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 6,
          background: 'white',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform var(--dur)',
          boxShadow: 'var(--shadow-sm)',
        }}
      />
    </button>
  );
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function offerLabel(value: string) {
  return value
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function riskColor(level: CustomerStatusSummary["churnPrediction"]["level"]) {
  if (level === "High") return "var(--red)";
  if (level === "Medium") return "var(--amber)";
  return "var(--green)";
}

function inlineUpsellRecommendation(summary: CustomerStatusSummary) {
  const scores: Record<string, number> = {
    maintenance_plan: 0.25,
    replacement: 0.2,
    service: 0.2,
  };

  if (summary.signals.daysSinceLastService > 180) scores.service += 0.4;
  if (summary.failurePrediction.probability >= 0.5) scores.maintenance_plan += 0.15;
  if (summary.churnPrediction.probability >= 0.5) {
    scores.maintenance_plan += 0.1;
    scores.service += 0.1;
  }
  if (summary.signals.avgMonthlySpend >= 250) scores.maintenance_plan += 0.08;

  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const normalized = Object.fromEntries(
    Object.entries(scores).map(([offer, score]) => [offer, score / total]),
  );
  const [recommendedOffer, confidence] = Object.entries(normalized).sort(([, a], [, b]) => b - a)[0];
  const priorityScore = Math.min(
    1,
    (confidence * 0.7)
      + (summary.churnPrediction.probability * 0.15)
      + (summary.failurePrediction.probability * 0.15),
  );

  return {
    recommendedOffer,
    confidence,
    priorityScore,
    status: "live estimate",
  };
}

function CustomerHoverSummary({
  summary,
  loading,
  error,
  anchor,
}: {
  summary?: CustomerStatusSummary;
  loading: boolean;
  error: boolean;
  anchor: { x: number; y: number };
}) {
  const left = typeof window === "undefined" ? anchor.x + 16 : Math.min(anchor.x + 16, window.innerWidth - 380);
  const top = typeof window === "undefined" ? anchor.y + 14 : Math.max(12, Math.min(anchor.y + 14, window.innerHeight - 360));

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 80,
        top,
        left: Math.max(12, left),
        width: 340,
        padding: 14,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        boxShadow: "0 18px 44px rgba(15, 23, 42, 0.18)",
        color: "var(--t1)",
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t3)", marginBottom: 10 }}>
        Customer risk summary
      </div>
      {loading && (
        <div style={{ display: "grid", gap: 8 }}>
          <Skeleton h={16} />
          <Skeleton h={16} />
          <Skeleton h={16} />
          <Skeleton h={30} />
        </div>
      )}
      {!loading && error && (
        <div style={{ color: "var(--red)", fontSize: 13 }}>
          Summary unavailable right now.
        </div>
      )}
      {!loading && !error && summary && (
        <div style={{ display: "grid", gap: 10 }}>
          {(() => {
            const upsellRecommendation = summary.upsellRecommendation ?? inlineUpsellRecommendation(summary);

            return (
              <>
          <div>
            <div style={{ fontSize: 11, color: "var(--t4)", fontWeight: 700, textTransform: "uppercase" }}>Current status</div>
            <div style={{ fontSize: 13, color: "var(--t1)", marginTop: 2 }}>{summary.currentStatus}</div>
          </div>
          <div style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card-2)" }}>
            <div style={{ fontSize: 11, color: "var(--t4)", fontWeight: 700, textTransform: "uppercase" }}>Upsell recommendation</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
              <div style={{ fontSize: 13, color: "var(--t1)", fontWeight: 700 }}>
                {offerLabel(upsellRecommendation.recommendedOffer)}
              </div>
              <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 700 }}>
                {pct(upsellRecommendation.confidence)}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 4, lineHeight: 1.35 }}>
              Priority {pct(upsellRecommendation.priorityScore ?? upsellRecommendation.confidence)} - {upsellRecommendation.status === "generated" ? "live estimate" : upsellRecommendation.status}
            </div>
          </div>
              </>
            );
          })()}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--t4)", fontWeight: 700, textTransform: "uppercase" }}>Failure prediction</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: riskColor(summary.failurePrediction.level), marginTop: 2 }}>
                {summary.failurePrediction.level} ({pct(summary.failurePrediction.probability)})
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--t4)", fontWeight: 700, textTransform: "uppercase" }}>Churn prediction</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: riskColor(summary.churnPrediction.level), marginTop: 2 }}>
                {summary.churnPrediction.level} ({pct(summary.churnPrediction.probability)})
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--t4)", fontWeight: 700, textTransform: "uppercase" }}>Proposed next step</div>
            <div style={{ fontSize: 13, color: "var(--t1)", marginTop: 2, lineHeight: 1.4 }}>{summary.proposedNextStep}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--t3)" }}>
            <span>{summary.signals.daysSinceLastService} days since service</span>
            <span>{summary.signals.serviceCountLastYear} services/year</span>
            <span>{summary.predictionSource === "model" ? "AI model" : "Fallback"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const [tab, setTab] = useState<"customers" | "leads" | "agreements">("customers");
  const [search, setSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("All Types");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("All Status");
  const [isExpanded, setIsExpanded] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All Status");
  const [agreementsSearch, setAgreementsSearch] = useState("");
  const [agreementStatusFilter, setAgreementStatusFilter] = useState("All Status");
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addType, setAddType] = useState<"customer" | "lead">("customer");
  const [sidebarTab, setSidebarTab] = useState<any>("contact");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "customer" | "lead"; id: string; name: string } | null>(null);
  const [hoveredCustomer, setHoveredCustomer] = useState<{ id: string; x: number; y: number } | null>(null);
  const [customerPage, setCustomerPage] = useState(1);
  const [leadPage, setLeadPage] = useState(1);
  const [agreementPage, setAgreementPage] = useState(1);
  const itemsPerPage = 10;

  // ── API queries ─────────────────────────────────────────────────────────────

  const customersQuery = useCustomers({
    page: customerPage, limit: itemsPerPage,
    search: search || undefined,
    type: customerTypeFilter !== "All Types" ? customerTypeFilter.toUpperCase() : undefined,
    isActive: customerStatusFilter === "Active" ? true : customerStatusFilter === "Inactive" ? false : undefined,
  });

  const leadsQuery = useLeads({
    page: leadPage, limit: itemsPerPage,
    search: leadsSearch || undefined,
    status: leadStatusFilter !== "All Status" ? leadStatusFilter.replace(" ", "_").toUpperCase() : undefined,
  });

  const agreementsQuery = useAgreements({
    page: agreementPage, limit: itemsPerPage,
    search: agreementsSearch || undefined,
    status: agreementStatusFilter !== "All Status" ? agreementStatusFilter.toUpperCase() : undefined,
  });

  const deleteCustomer = useDeleteCustomer();
  const deleteLead = useDeleteLead();
  const updateCustomer = useUpdateCustomer();
  const hoveredSummaryQuery = useCustomerStatusSummary(hoveredCustomer?.id);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const customers: Customer[] = customersQuery.data?.data ?? [];
  const totalCustomers = customersQuery.data?.total ?? 0;
  const totalCustomerPages = Math.max(1, customersQuery.data?.totalPages ?? 1);
  const leads: Lead[] = leadsQuery.data?.data ?? [];
  const totalLeads = leadsQuery.data?.total ?? 0;
  const totalLeadPages = Math.max(1, leadsQuery.data?.totalPages ?? 1);
  const agreements: any[] = agreementsQuery.data?.data ?? [];
  const totalAgreements = agreementsQuery.data?.total ?? 0;
  const totalAgreementPages = Math.max(1, agreementsQuery.data?.totalPages ?? 1);

  const queryClient = useQueryClient();

  const handleViewClick = (person: any, type: "customer" | "lead" | "agreement" = "customer") => {
    if (type === "lead") {
      setSelectedPerson(person); setIsLeadDetailsOpen(true);
    } else {
      setSelectedPerson(person);
      setSidebarTab(type === "agreement" ? "agreements" : "contact");
      setIsDetailsOpen(true);
    }
  };

  const confirmDelete = (type: "customer" | "lead", id: string, name: string) => {
    setDeleteConfirm({ type, id, name });
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "customer") {
      deleteCustomer.mutate(deleteConfirm.id, { onSettled: () => setDeleteConfirm(null) });
    } else {
      deleteLead.mutate(deleteConfirm.id, { onSettled: () => setDeleteConfirm(null) });
    }
  };

  const toggleCustomerFollowup = (customer: Customer) => {
    const automaticFollowupEnabled = !(customer.automaticFollowupEnabled ?? true);
    updateCustomer.mutate(
      { id: customer.id, data: { automaticFollowupEnabled } },
      {
        onSuccess: (updated) => {
          if (selectedPerson?.id === customer.id) {
            setSelectedPerson(updated);
          }
        },
      },
    );
  };

  const handleLeadConverted = async (customerId: string) => {
    setIsLeadDetailsOpen(false);
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    try {
      const res = await api.get(`/crm/customers/${customerId}`);
      setSelectedPerson(res.data);
      setSidebarTab('contact');
      setIsDetailsOpen(true);
    } catch {
      // customers list will refresh via invalidation
    }
  };

  return (
    <>
      <div className="anim-fade-up">
        {/* KPIs */}
        {!isExpanded && (
          <div className="kpi-grid mb-5">
            {[
              { icon: Users, v: customersQuery.isLoading ? "—" : totalCustomers.toLocaleString(), l: "Total Customers", loading: customersQuery.isLoading },
              { icon: Target, v: leadsQuery.isLoading ? "—" : totalLeads.toString(), l: "Active Leads", loading: leadsQuery.isLoading },
              { icon: FileText, v: agreementsQuery.isLoading ? "—" : totalAgreements.toString(), l: "Service Agreements", loading: agreementsQuery.isLoading },
              { icon: TrendingUp, v: "—", l: "Avg. Revenue / Customer", loading: false },
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

        <div className="page-tabs">
          <button className={`tab-btn ${tab === "customers" ? "active" : ""}`} onClick={() => setTab("customers")}>
            <Users size={14} /> Customers <span className="tab-count">{totalCustomers}</span>
          </button>
          <button className={`tab-btn ${tab === "leads" ? "active" : ""}`} onClick={() => setTab("leads")}>
            <Target size={14} /> Leads <span className="tab-count">{totalLeads}</span>
          </button>
          <button className={`tab-btn ${tab === "agreements" ? "active" : ""}`} onClick={() => setTab("agreements")}>
            <FileText size={14} /> Agreements <span className="tab-count">{totalAgreements}</span>
          </button>
        </div>

        {/* Customers */}
        {tab === "customers" && (
          <div className="card anim-fade-in">
            {customersQuery.isError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, margin: '0 0 8px' }}>
                <AlertCircle size={14} /> Failed to load customers.
                <button onClick={() => customersQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}><RefreshCw size={12} /> Retry</button>
              </div>
            )}
            <div className="card-header">
              <div className="filter-bar w-full" style={{ margin: 0 }}>
                <div className="filter-search flex-1">
                  <Search size={13} color="var(--t4)" />
                  <input placeholder="Search customers…" value={search} onChange={e => { setSearch(e.target.value); setCustomerPage(1); }} />
                </div>
                <select className="select" style={{ width: 160 }} value={customerTypeFilter} onChange={e => { setCustomerTypeFilter(e.target.value); setCustomerPage(1); }}>
                  <option>All Types</option><option>Residential</option><option>Commercial</option>
                </select>
                <select className="select" style={{ width: 140 }} value={customerStatusFilter} onChange={e => { setCustomerStatusFilter(e.target.value); setCustomerPage(1); }}>
                  <option>All Status</option><option>Active</option><option>Inactive</option>
                </select>
                <button className="btn btn-primary btn-sm ml-auto" onClick={() => { setAddType("customer"); setIsAddOpen(true); }}><Plus size={12} /> Add Customer</button>
                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: "0 12px", fontWeight: 600 }} onClick={() => customersQuery.refetch()} title="Refresh"><RefreshCw size={14} /></button>
                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ marginLeft: "4px", padding: "0 12px", fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                </button>
              </div>
            </div>
            <div className="card-body-flush mt-4">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Customer</th><th>Contact</th><th>Location</th><th>Status</th><th>Type</th><th>Auto Follow-up</th><th>Jobs</th><th>Revenue</th><th>Since</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {customersQuery.isLoading && Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 10 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
                    ))}
                    {!customersQuery.isLoading && customers.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => handleViewClick(c, "customer")}
                        onMouseEnter={(e) => setHoveredCustomer({ id: c.id, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredCustomer(current => current?.id === c.id ? { id: c.id, x: e.clientX, y: e.clientY } : current)}
                        onMouseLeave={() => setHoveredCustomer(current => current?.id === c.id ? null : current)}
                        className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                      >
                        <td>
                          <div className="cell-user"><div>
                            <div className="cell-name">{customerName(c)}</div>
                            <div className="flex items-center gap-2"><Mail size={12} className="text-[var(--t4)]" /> {c.email}</div>
                          </div></div>
                        </td>
                        <td><div className="flex flex-col gap-1 text-[13px] text-[var(--t2)] mt-1"><div className="flex items-center gap-2"><Phone size={12} className="text-[var(--t4)]" /> {c.phone ?? '—'}</div></div></td>
                        <td><div className="flex items-center gap-1.5 text-sm text-[var(--t2)]"><MapPin size={13} className="text-[var(--t4)]" /> {c.city ?? '—'}{c.state ? `, ${c.state}` : ''}</div></td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {c.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td><span className={`badge ${c.type === "COMMERCIAL" ? "badge-violet" : "badge-blue"}`}>{c.type.charAt(0) + c.type.slice(1).toLowerCase()}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <FollowupToggle
                              checked={c.automaticFollowupEnabled ?? true}
                              disabled={updateCustomer.isPending}
                              onChange={() => toggleCustomerFollowup(c)}
                            />
                            <span className="text-xs font-600 text-[var(--t3)]">
                              {(c.automaticFollowupEnabled ?? true) ? "On" : "Off"}
                            </span>
                          </div>
                        </td>
                        <td className="font-600">{c.totalJobs ?? '—'}</td>
                        <td className="font-600">{c.totalRevenue != null ? fmt(c.totalRevenue) : '—'}</td>
                        <td className="text-sm text-[var(--t3)]">{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button className="flex items-center justify-center p-1.5 text-[var(--blue)] hover:bg-blue-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" onClick={e => { e.stopPropagation(); handleViewClick(c, "customer"); }} title="View Details"><Edit size={15} /></button>
                            <button className="flex items-center justify-center p-1.5 text-[var(--t2)] hover:bg-gray-100 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Email" onClick={e => { e.stopPropagation(); window.location.href = `mailto:${c.email}`; }}><Mail size={15} /></button>
                            <button className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Delete" onClick={e => { e.stopPropagation(); confirmDelete("customer", c.id, customerName(c)); }}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!customersQuery.isLoading && customers.length === 0 && (
                      <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No customers found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
              <span className="text-[13px] text-[var(--t3)]">Showing {totalCustomers > 0 ? (customerPage - 1) * itemsPerPage + 1 : 0} to {Math.min(customerPage * itemsPerPage, totalCustomers)} of {totalCustomers} customers</span>
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setCustomerPage(p => Math.max(1, p - 1))} disabled={customerPage === 1}><ChevronLeft size={18} /></button>
                <span className="text-[13px] text-[var(--t2)] mx-2">Page {customerPage} of {totalCustomerPages}</span>
                <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setCustomerPage(p => Math.min(totalCustomerPages, p + 1))} disabled={customerPage === totalCustomerPages}><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        )}

        {/* Leads */}
        {tab === "leads" && (
          <div className="anim-fade-in card">
            <div className="card-header">
              <div className="filter-bar w-full" style={{ margin: 0 }}>
                <div className="filter-search flex-1"><Search size={13} color="var(--t4)" /><input placeholder="Search leads…" value={leadsSearch} onChange={e => { setLeadsSearch(e.target.value); setLeadPage(1); }} /></div>
                <select className="select" style={{ width: 140 }} value={leadStatusFilter} onChange={e => { setLeadStatusFilter(e.target.value); setLeadPage(1); }}>
                  <option>All Status</option><option>New</option><option>Contacted</option><option>Qualified</option><option>Won</option><option>Lost</option>
                </select>
                <button className="btn btn-primary btn-sm ml-auto" onClick={() => { setAddType("lead"); setIsAddOpen(true); }}><Plus size={12} /> Add Lead</button>
                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ marginLeft: "8px", padding: "0 12px", fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                </button>
              </div>
            </div>
            <div className="card-body-flush mt-4">
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Lead</th><th>Location</th><th>Service Interest</th><th>Source</th><th>Est. Revenue</th><th>Status</th><th>Assigned To</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>
                    {leadsQuery.isLoading && Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 9 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                    {!leadsQuery.isLoading && leads.map(l => (
                      <tr key={l.id} onClick={() => handleViewClick(l, "lead")} className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group">
                        <td><div className="cell-user"><div><div className="cell-name">{leadName(l)}</div><div className="cell-email">{l.email}</div></div></div></td>
                        <td><div className="flex items-center gap-1.5 text-sm text-[var(--t2)]"><MapPin size={12} className="text-[var(--t4)]" />{l.customer?.city ?? '—'}{l.customer?.state ? `, ${l.customer.state}` : ''}</div></td>
                        <td>{l.serviceInterest ?? '—'}</td>
                        <td><span className="badge badge-neutral">{l.source ?? '—'}</span></td>
                        <td className="td-primary font-600">{l.estimatedValue != null ? fmt(l.estimatedValue) : '—'}</td>
                        <td><span className={`badge ${LEAD_STATUS[l.status] ?? 'badge-neutral'}`}>{l.status.replace(/_/g, ' ')}</span></td>
                        <td>{l.assignedToName ?? '—'}</td>
                        <td className="text-sm text-3">{new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button className="flex items-center justify-center p-1.5 text-[var(--blue)] hover:bg-blue-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" onClick={e => { e.stopPropagation(); handleViewClick(l, "lead"); }} title="View"><Edit size={15} /></button>
                            <button className="flex items-center justify-center p-1.5 text-[var(--t2)] hover:bg-gray-100 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Email" onClick={e => { e.stopPropagation(); if (l.email) window.location.href = `mailto:${l.email}`; }}><Mail size={15} /></button>
                            <button className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Delete" onClick={e => { e.stopPropagation(); confirmDelete("lead", l.id, leadName(l)); }}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!leadsQuery.isLoading && leads.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No leads found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
              <span className="text-[13px] text-[var(--t3)]">Showing {totalLeads > 0 ? (leadPage - 1) * itemsPerPage + 1 : 0} to {Math.min(leadPage * itemsPerPage, totalLeads)} of {totalLeads} leads</span>
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setLeadPage(p => Math.max(1, p - 1))} disabled={leadPage === 1}><ChevronLeft size={18} /></button>
                <span className="text-[13px] text-[var(--t2)] mx-2">Page {leadPage} of {totalLeadPages}</span>
                <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setLeadPage(p => Math.min(totalLeadPages, p + 1))} disabled={leadPage === totalLeadPages}><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        )}

        {/* Agreements */}
        {tab === "agreements" && (
          <div className="anim-fade-in card">
            <div className="card-header">
              <div className="filter-bar w-full" style={{ margin: 0 }}>
                <div className="filter-search flex-1"><Search size={13} color="var(--t4)" /><input placeholder="Search agreements…" value={agreementsSearch} onChange={e => { setAgreementsSearch(e.target.value); setAgreementPage(1); }} /></div>
                <select className="select" style={{ width: 140 }} value={agreementStatusFilter} onChange={e => { setAgreementStatusFilter(e.target.value); setAgreementPage(1); }}>
                  <option>All Status</option><option>Active</option><option>Expiring</option><option>Inactive</option>
                </select>
                <button className="btn btn-primary btn-sm ml-auto"><Plus size={12} /> New Agreement</button>
                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ marginLeft: "8px", padding: "0 12px", fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                </button>
              </div>
            </div>
            <div className="card-body-flush mt-4">
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Agreement ID</th><th>Customer</th><th>Value</th><th>Status</th><th>Next Service</th><th>Renewal Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {agreementsQuery.isLoading && Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                    {!agreementsQuery.isLoading && agreements.map(a => (
                      <tr key={a.id} className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group">
                        <td className="font-500 text-[13px]">{a.id}</td>
                        <td><div className="cell-name">{a.customerName ?? a.customerId}</div></td>
                        <td className="td-primary font-600">{a.value != null ? `${fmt(a.value)}/yr` : '—'}</td>
                        <td><span className={`badge ${AGREEMENT_STATUS[a.status?.toUpperCase()] ?? 'badge-neutral'}`}>{a.status}</span></td>
                        <td className="text-sm text-3">{a.nextServiceDate ? new Date(a.nextServiceDate).toLocaleDateString() : '—'}</td>
                        <td className="text-sm text-3">{a.renewalDate ? new Date(a.renewalDate).toLocaleDateString() : '—'}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button className="flex items-center justify-center p-1.5 text-[var(--blue)] hover:bg-blue-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="View"><Edit size={15} /></button>
                            <button className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Delete"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!agreementsQuery.isLoading && agreements.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No agreements found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
              <span className="text-[13px] text-[var(--t3)]">Showing {totalAgreements > 0 ? (agreementPage - 1) * itemsPerPage + 1 : 0} to {Math.min(agreementPage * itemsPerPage, totalAgreements)} of {totalAgreements} agreements</span>
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setAgreementPage(p => Math.max(1, p - 1))} disabled={agreementPage === 1}><ChevronLeft size={18} /></button>
                <span className="text-[13px] text-[var(--t2)] mx-2">Page {agreementPage} of {totalAgreementPages}</span>
                <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setAgreementPage(p => Math.min(totalAgreementPages, p + 1))} disabled={agreementPage === totalAgreementPages}><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {hoveredCustomer && (
        <CustomerHoverSummary
          anchor={{ x: hoveredCustomer.x, y: hoveredCustomer.y }}
          summary={hoveredSummaryQuery.data}
          loading={hoveredSummaryQuery.isLoading || hoveredSummaryQuery.isFetching}
          error={hoveredSummaryQuery.isError}
        />
      )}

      <CustomerDetailsSidebar isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} person={selectedPerson} initialTab={sidebarTab} />
      <LeadDetailsSidebar isOpen={isLeadDetailsOpen} onClose={() => setIsLeadDetailsOpen(false)} person={selectedPerson} onConverted={handleLeadConverted} />
      <AddPersonModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} type={addType} />

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-700 text-gray-900">Delete {deleteConfirm.type === "customer" ? "Customer" : "Lead"}</h3>
                <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete <span className="font-600 text-gray-900">{deleteConfirm.name}</span>?
            </p>
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 text-sm font-600 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 text-sm font-600 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                disabled={deleteCustomer.isPending || deleteLead.isPending}
                onClick={executeDelete}
              >
                {(deleteCustomer.isPending || deleteLead.isPending) ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
