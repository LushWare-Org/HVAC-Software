import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Users, FileText, Plus, Search, TrendingUp, Wallet, Trash2, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, RefreshCw, AlertCircle, Sparkles, X, Send,
} from "lucide-react";
import CustomerDetailsSidebar from "./CustomerDetailsSidebar";
import api from "../../lib/api";
import AddPersonModal from "./AddPersonModal";
import RecommendationsPanel from "../../components/RecommendationsPanel";
import CustomerRecommendationsModal from "../../components/CustomerRecommendationsModal";
import { useCustomers, useAgreements, useDeleteCustomer, useUpdateCustomer, useCustomerTags, useResendWelcomeEmail, useCustomerStats } from "../../hooks/useCustomers";
import { customerName } from "../../types/api";
import type { Customer } from "../../types/api";
import { formatMoney } from '../../lib/format'
import { useToast } from "../../contexts/ToastContext";
import KelvinDigest from '../../kelvin/KelvinDigest'
import { KelvinIcon } from '../../kelvin/KelvinMark'
import JobFilterMenu, { type FilterOption } from "../jobs/JobFilterMenu";
import JobFilterChips from "../jobs/JobFilterChips";
import CustomersTable from "./CustomersTable";
import "../jobs/jobsTable.css";
import "./customersTable.css";

const PAGE_SIZE = 15;

function Skeleton({ h = 14 }: { h?: number }) {
  return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />;
}

const SORTS: Array<[string, string]> = [
  ["createdAt:desc", "Newest first"], ["createdAt:asc", "Oldest first"],
  ["name:asc", "Name A–Z"], ["name:desc", "Name Z–A"],
  ["city:asc", "Location A–Z"], ["city:desc", "Location Z–A"],
  ["updated:desc", "Recently active"], ["equipment:desc", "Most equipment"], ["type:asc", "Type"],
  ["installDate:asc", "Earliest install date"], ["installDate:desc", "Latest install date"],
  ["warranty:asc", "Warranty expiring soonest"], ["warranty:desc", "Warranty expiring latest"],
  ["tag:asc", "Tag A–Z"], ["tag:desc", "Tag Z–A"],
];

const dot = (c: string) => <span className="ct-dot" style={{ background: c }} />;

export default function Customers() {
  const [search, setSearch] = useState("");
  // Active is on by default. Turning both Active and Inactive off (or on) shows everyone.
  const [statusSel, setStatusSel] = useState<string[]>(["ACTIVE"]);
  const [typeSel, setTypeSel] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPortalInviteOpen, setIsPortalInviteOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<any>("overview");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [recCustomer, setRecCustomer] = useState<Customer | null>(null);
  const [customerPage, setCustomerPage] = useState(1);

  // "Filter" on the Customer Retention Risk recommendation lands here as ?filter=retention_risk.
  const [searchParams, setSearchParams] = useSearchParams();
  const riskSegment = searchParams.get('filter') === 'retention_risk' ? 'retention_risk' : undefined;
  const clearRiskFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('filter');
    setSearchParams(next);
    setCustomerPage(1);
  };

  const oneStatus = statusSel.length === 1 ? statusSel[0] : null;
  const oneType = typeSel.length === 1 ? typeSel[0] : undefined;
  const customersQuery = useCustomers({
    page: customerPage, limit: PAGE_SIZE,
    search: search || undefined,
    type: oneType,
    isActive: oneStatus === "ACTIVE" ? true : oneStatus === "INACTIVE" ? false : "all",
    tags: tagFilter.length > 0 ? tagFilter : undefined,
    sortBy, sortDir, riskSegment,
  });
  const tagsQuery = useCustomerTags();
  const statsQuery = useCustomerStats();
  const navigate = useNavigate();
  const agreementsQuery = useAgreements({ page: 1, limit: 1 });

  useEffect(() => { setCustomerPage(1); }, [riskSegment, statusSel, typeSel, tagFilter, search]);

  const deleteCustomer = useDeleteCustomer();
  const updateCustomer = useUpdateCustomer();
  const resendWelcomeEmail = useResendWelcomeEmail();
  const { showSuccess, showError } = useToast();
  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResendWelcomeEmail = (c: Customer) => {
    setResendingId(c.id);
    resendWelcomeEmail.mutate(c.id, {
      onSuccess: (res) => showSuccess(res.message, res.created ? "Portal login created" : "Login details sent"),
      // Moving a login another customer holds needs a confirm, which lives on the customer's own page.
      onError: (err: any) => showError(err?.response?.data?.code === 'EMAIL_IN_USE'
        ? `${err.response.data.message} Open the customer to move it.`
        : err?.response?.data?.message ?? "Could not send the login."),
      onSettled: () => setResendingId(null),
    });
  };

  const customers: Customer[] = customersQuery.data?.data ?? [];
  const totalCustomers = customersQuery.data?.total ?? 0;
  const pages = Math.max(1, customersQuery.data?.totalPages ?? 1);
  const current = Math.min(customerPage, pages);
  const stats = statsQuery.data;
  const totalAgreements = agreementsQuery.data?.total ?? stats?.withAgreements ?? 0;

  const handleViewClick = (person: any, type: "customer" | "agreement" = "customer") => {
    setSelectedPerson(person);
    setSidebarTab(type === "agreement" ? "agreements" : "overview");
    setIsDetailsOpen(true);
  };

  // Opened from elsewhere with ?customer=<id> (e.g. Settings → Telegram): show that customer.
  const linkedCustomerId = searchParams.get("customer");
  useEffect(() => {
    if (!linkedCustomerId) return;
    api.get(`/crm/customers/${linkedCustomerId}`).then((r) => { if (r.data?.id) handleViewClick(r.data); }).catch(() => undefined);
    const next = new URLSearchParams(searchParams);
    next.delete("customer");
    setSearchParams(next, { replace: true });
  }, [linkedCustomerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const executeDelete = () => {
    if (!deleteConfirm) return;
    deleteCustomer.mutate(deleteConfirm.id, { onSettled: () => setDeleteConfirm(null) });
  };

  const toggleCustomerFollowup = (customer: Customer) => {
    const automaticFollowupEnabled = !(customer.automaticFollowupEnabled ?? true);
    updateCustomer.mutate(
      { id: customer.id, data: { automaticFollowupEnabled } },
      { onSuccess: (updated) => { if (selectedPerson?.id === customer.id) setSelectedPerson(updated); } },
    );
  };

  // ── Filters: chips show how many customers each would match ───────────────────
  const statusOptions: FilterOption[] = [
    { value: "ACTIVE", text: "Active", count: stats ? stats.total : undefined, node: <span className="jl" style={{ gap: 7 }}>{dot("var(--green)")}Active</span> },
    { value: "INACTIVE", text: "Inactive", count: stats ? stats.inactive : undefined, node: <span className="jl" style={{ gap: 7 }}>{dot("var(--t4)")}Inactive</span> },
  ];
  const typeOptions: FilterOption[] = [
    { value: "RESIDENTIAL", text: "Residential", count: stats?.residential, node: <>Residential</> },
    { value: "COMMERCIAL", text: "Commercial", count: stats?.commercial, node: <>Commercial</> },
  ];
  const tagOptions: FilterOption[] = useMemo(
    () => (tagsQuery.data ?? []).map(t => ({ value: t, text: t, node: <>{t}</> })),
    [tagsQuery.data],
  );
  const anyFilter = search || typeSel.length || tagFilter.length || statusSel.join() !== "ACTIVE";
  const clearAll = () => { setSearch(""); setStatusSel(["ACTIVE"]); setTypeSel([]); setTagFilter([]); };

  const kpis = [
    { icon: Users, v: (stats?.total ?? 0).toLocaleString(), l: "Customers", loading: statsQuery.isLoading, onClick: undefined as undefined | (() => void) },
    { icon: FileText, v: totalAgreements.toString(), l: "Service Agreements", loading: agreementsQuery.isLoading && !stats, onClick: () => navigate("/agreements") },
    { icon: Wallet, v: formatMoney(stats?.totalRevenue ?? 0, { decimals: 0 }), l: "Revenue Collected", loading: statsQuery.isLoading, onClick: undefined },
    { icon: TrendingUp, v: stats?.total ? formatMoney(stats.avgRevenue, { decimals: 0 }) : "—", l: "Avg. Revenue / Customer", loading: statsQuery.isLoading, onClick: undefined },
  ];

  return (
    <>
      <div className="anim-fade-up">
        {!isExpanded && (
          <div className="kpi-grid mb-5">
            {kpis.map((k) => (
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

        {!isExpanded && <RecommendationsPanel filterActions={['call', 'geo_target_discount']} />}
        <KelvinDigest page="customers" />

        <div className="card anim-fade-in" style={{ overflow: "visible" }}>
          {riskSegment && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'color-mix(in srgb, var(--amber) 10%, transparent)', borderRadius: 8, color: 'var(--amber)', fontSize: 13, margin: '0 0 8px' }}>
              <KelvinIcon fallback={<Sparkles size={14} />} />
              Showing customers from the Customer Retention Risk recommendation — active, high-value, churn probability ≥ 40%.
              <button onClick={clearRiskFilter} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <X size={12} /> Clear filter
              </button>
            </div>
          )}
          {customersQuery.isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, margin: '0 0 8px' }}>
              <AlertCircle size={14} /> Failed to load customers.
              <button onClick={() => customersQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}><RefreshCw size={12} /> Retry</button>
            </div>
          )}

          <div className="jf-bar">
            <label className="jf-search">
              <Search size={14} aria-hidden="true" />
              <input placeholder="Search name, email, phone" aria-label="Search customers" value={search} onChange={e => setSearch(e.target.value)} />
            </label>
            {tagOptions.length > 0 && <JobFilterMenu label="Tags" options={tagOptions} selected={tagFilter} onChange={setTagFilter} />}
            <select
              className="select jf-select" aria-label="Sort by" value={`${sortBy}:${sortDir}`}
              onChange={e => { const [by, dir] = e.target.value.split(':'); setSortBy(by); setSortDir(dir as 'asc' | 'desc'); setCustomerPage(1); }}
            >
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {anyFilter ? <button type="button" className="jf-clear" onClick={clearAll}>Clear all filters</button> : null}
            <span style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddOpen(true)}><Plus size={12} /> Add Customer</button>
            <button className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }} onClick={() => setIsPortalInviteOpen(true)} title="Create a customer account and send login credentials by email"><Send size={12} /> Send Portal Invite</button>
            <button className="btn btn-secondary btn-sm" aria-label="Refresh" onClick={() => { customersQuery.refetch(); statsQuery.refetch(); }} title="Refresh"><RefreshCw size={14} /></button>
            <button className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
            </button>
          </div>
          <div className="jc-wrap">
            <JobFilterChips label="Status" options={statusOptions} selected={statusSel} onChange={setStatusSel} loading={statsQuery.isLoading} />
            <JobFilterChips label="Type" options={typeOptions} selected={typeSel} onChange={setTypeSel} loading={statsQuery.isLoading} />
          </div>

          <div className="jt-wrap">
            <CustomersTable
              customers={customers} loading={customersQuery.isLoading}
              onOpen={c => handleViewClick(c, "customer")}
              onDelete={c => setDeleteConfirm({ id: c.id, name: customerName(c) })}
              onRecommend={setRecCustomer}
              onResend={handleResendWelcomeEmail} resendingId={resendingId}
              onToggleFollowup={toggleCustomerFollowup} togglePending={updateCustomer.isPending}
              empty={{ title: "No customers found", sub: anyFilter ? "Nothing matches these filters." : "Add your first customer to get started." }}
            />
          </div>

          <div className="jt-foot">
            <span style={{ fontSize: 13, color: "var(--t3)" }}>
              {totalCustomers === 0 ? "0 customers" : `Showing ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, totalCustomers)} of ${totalCustomers}`}
            </span>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} aria-label="Previous page" onClick={() => setCustomerPage(Math.max(1, current - 1))} disabled={current === 1}><ChevronLeft size={18} /></button>
                <span style={{ fontSize: 13, color: "var(--t2)", margin: "0 4px" }}>Page {current} of {pages}</span>
                <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} aria-label="Next page" onClick={() => setCustomerPage(Math.min(pages, current + 1))} disabled={current === pages}><ChevronRight size={18} /></button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerDetailsSidebar isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} person={selectedPerson} initialTab={sidebarTab} />
      <AddPersonModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} type="customer" />
      <AddPersonModal isOpen={isPortalInviteOpen} onClose={() => setIsPortalInviteOpen(false)} type="lead" />

      {recCustomer && (
        <CustomerRecommendationsModal customer={recCustomer} onClose={() => setRecCustomer(null)} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-700 text-gray-900">Delete Customer</h3>
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
                disabled={deleteCustomer.isPending}
                onClick={executeDelete}
              >
                {deleteCustomer.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
