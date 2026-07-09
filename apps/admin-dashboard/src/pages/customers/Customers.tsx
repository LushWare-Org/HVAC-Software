import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
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
  Sparkles,
  Tag,
  ChevronDown,
  X,
  Send,
} from "lucide-react";
import CustomerDetailsSidebar from "./CustomerDetailsSidebar";
import AddPersonModal from "./AddPersonModal";
import RecommendationsPanel from "../../components/RecommendationsPanel";
import CustomerRecommendationsModal from "../../components/CustomerRecommendationsModal";
import { useCustomers, useAgreements, useDeleteCustomer, useUpdateCustomer, useCustomerStatusSummary, useCustomerTags } from "../../hooks/useCustomers";
import { customerName } from "../../types/api";
import type { Customer, CustomerStatusSummary } from "../../types/api";
import { formatMoney } from '../../lib/format'

// ─── Status maps ──────────────────────────────────────────────────────────────



function fmt(n: number) {
  return formatMoney(n, { decimals: 0 });
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

function inlineRetentionPrediction(summary: CustomerStatusSummary, upsellRecommendation: { confidence: number }) {
  const pConvert = upsellRecommendation.confidence;
  const ltv = summary.signals.avgMonthlySpend * 12;
  const churnProbability = summary.churnPrediction.probability;
  const score = pConvert * ltv * (1 - churnProbability);
  let action = "no_action";

  if (pConvert > 0.75 && ltv > 1500) {
    action = "premium_contract_offer";
  } else if (churnProbability > 0.7) {
    action = "discount_retention_offer";
  } else if (summary.failurePrediction.probability >= 0.7) {
    action = "maintenance_plan_offer";
  }

  const offer =
    action === "premium_contract_offer" ? { type: "premium", discount: 0 } :
    action === "discount_retention_offer" ? { type: "discounted", discount: 20 } :
    action === "maintenance_plan_offer" ? { type: "standard", discount: 10 } :
    { type: "none", discount: 0 };

  return {
    pConvert,
    ltv,
    churnProbability,
    score,
    action,
    offer,
    recommendedChannel: "email",
    priority: score > 1500 ? "high" : score >= 500 ? "medium" : "low",
    triggerImmediately: summary.failurePrediction.probability >= 0.7,
    reason:
      action === "premium_contract_offer" ? "High conversion probability and high predicted lifetime value" :
      action === "discount_retention_offer" ? "High churn probability" :
      action === "maintenance_plan_offer" ? "High repair frequency" :
      "Customer does not meet retention targeting thresholds",
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
  const left = typeof window === "undefined" ? anchor.x + 16 : Math.min(anchor.x + 16, window.innerWidth - 400);
  const top = typeof window === "undefined" ? anchor.y + 14 : Math.max(12, Math.min(anchor.y + 14, window.innerHeight - 520));

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 80,
        top,
        left: Math.max(12, left),
        width: 360,
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
            const retentionPrediction = summary.retentionPrediction ?? inlineRetentionPrediction(summary, upsellRecommendation);

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
          <div style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card-2)" }}>
            <div style={{ fontSize: 11, color: "var(--t4)", fontWeight: 700, textTransform: "uppercase" }}>Retention suggestion</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
              <div style={{ fontSize: 13, color: "var(--t1)", fontWeight: 700 }}>
                {offerLabel(retentionPrediction.action)}
              </div>
              <div style={{ fontSize: 12, color: retentionPrediction.priority === "high" ? "var(--red)" : retentionPrediction.priority === "medium" ? "var(--amber)" : "var(--green)", fontWeight: 700 }}>
                {retentionPrediction.priority.toUpperCase()}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--t4)", fontWeight: 700, textTransform: "uppercase" }}>Convert</div>
                <div style={{ fontSize: 12, color: "var(--t1)", fontWeight: 700 }}>{pct(retentionPrediction.pConvert)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--t4)", fontWeight: 700, textTransform: "uppercase" }}>LTV</div>
                <div style={{ fontSize: 12, color: "var(--t1)", fontWeight: 700 }}>{fmt(Math.round(retentionPrediction.ltv))}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--t4)", fontWeight: 700, textTransform: "uppercase" }}>Score</div>
                <div style={{ fontSize: 12, color: "var(--t1)", fontWeight: 700 }}>{Math.round(retentionPrediction.score)}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 8, lineHeight: 1.35 }}>
              Offer: {offerLabel(retentionPrediction.offer.type)}{retentionPrediction.offer.discount > 0 ? `, ${retentionPrediction.offer.discount}% off` : ""} via {offerLabel(retentionPrediction.recommendedChannel)}
              {retentionPrediction.triggerImmediately ? " - trigger now" : ""}
            </div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 4, lineHeight: 1.35 }}>
              {retentionPrediction.reason}
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
  const [search, setSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("All Types");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("All Status");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const tagPopoverRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPortalInviteOpen, setIsPortalInviteOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<any>("contact");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [hoveredCustomer, setHoveredCustomer] = useState<{ id: string; x: number; y: number } | null>(null);
  const [recCustomer, setRecCustomer] = useState<Customer | null>(null);
  const [customerPage, setCustomerPage] = useState(1);
  const itemsPerPage = 10;

  // ── API queries ─────────────────────────────────────────────────────────────

  const customersQuery = useCustomers({
    page: customerPage, limit: itemsPerPage,
    search: search || undefined,
    type: customerTypeFilter !== "All Types" ? customerTypeFilter.toUpperCase() : undefined,
    isActive: customerStatusFilter === "Active" ? true : customerStatusFilter === "Inactive" ? false : undefined,
    tags: tagFilter.length > 0 ? tagFilter : undefined,
    sortBy,
    sortDir,
  });
  const tagsQuery = useCustomerTags();

  const navigate = useNavigate();
  const agreementsQuery = useAgreements({ page: 1, limit: 1 });

  // Close tag popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagPopoverRef.current && !tagPopoverRef.current.contains(e.target as Node)) {
        setTagPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const deleteCustomer = useDeleteCustomer();
  const updateCustomer = useUpdateCustomer();
  const hoveredSummaryQuery = useCustomerStatusSummary(hoveredCustomer?.id);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const customers: Customer[] = customersQuery.data?.data ?? [];
  const totalCustomers = customersQuery.data?.total ?? 0;
  const totalCustomerPages = Math.max(1, customersQuery.data?.totalPages ?? 1);
  const totalAgreements = agreementsQuery.data?.total ?? 0;

  const handleViewClick = (person: any, type: "customer" | "agreement" = "customer") => {
    setSelectedPerson(person);
    setSidebarTab(type === "agreement" ? "agreements" : "contact");
    setIsDetailsOpen(true);
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;
    deleteCustomer.mutate(deleteConfirm.id, { onSettled: () => setDeleteConfirm(null) });
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


  return (
    <>
      <div className="anim-fade-up">
        {/* KPIs */}
        {!isExpanded && (
          <div className="kpi-grid mb-5">
            {[
              { icon: Users, v: customersQuery.isLoading ? "—" : totalCustomers.toLocaleString(), l: "Total Customers", loading: customersQuery.isLoading, onClick: undefined },
              { icon: FileText, v: agreementsQuery.isLoading ? "—" : totalAgreements.toString(), l: "Service Agreements", loading: agreementsQuery.isLoading, onClick: () => navigate("/agreements") },
              { icon: TrendingUp, v: "—", l: "Avg. Revenue / Customer", loading: false, onClick: undefined },
            ].map((k) => (
              <div key={k.l} className="kpi-card" style={{ padding: "16px 20px", borderRadius: "var(--r-md)", cursor: k.onClick ? "pointer" : "default" }} onClick={k.onClick}>
                <div className="kpi-card-top" style={{ marginBottom: 12, alignItems: "center", justifyContent: "space-between" }}>
                  <div className="kpi-label" style={{ fontSize: 13, color: "var(--t3)", fontWeight: 500, margin: 0 }}>{k.l}</div>
                  <k.icon size={16} strokeWidth={1.5} color="var(--t3)" />
                </div>
                {k.loading ? <Skeleton h={28} /> : <div className="kpi-value" style={{ fontSize: 26, fontWeight: 700, color: "var(--t1)" }}>{k.v}</div>}
              </div>
            ))}
          </div>
        )}

        {!isExpanded && <RecommendationsPanel filterActions={['call', 'geo_target_discount']} />}

        {/* Customers */}
        <div className="card anim-fade-in">
            {customersQuery.isError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, margin: '0 0 8px' }}>
                <AlertCircle size={14} /> Failed to load customers.
                <button onClick={() => customersQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}><RefreshCw size={12} /> Retry</button>
              </div>
            )}
            <div className="card-header">
              <div className="filter-bar w-full" style={{ margin: 0, flexWrap: 'wrap', rowGap: 6 }}>
                <div className="filter-search flex-1" style={{ minWidth: 180 }}>
                  <Search size={13} color="var(--t4)" />
                  <input placeholder="Search customers…" value={search} onChange={e => { setSearch(e.target.value); setCustomerPage(1); }} />
                </div>
                <select className="select" style={{ width: 148 }} value={customerTypeFilter} onChange={e => { setCustomerTypeFilter(e.target.value); setCustomerPage(1); }}>
                  <option>All Types</option><option>Residential</option><option>Commercial</option>
                </select>
                <select className="select" style={{ width: 130 }} value={customerStatusFilter} onChange={e => { setCustomerStatusFilter(e.target.value); setCustomerPage(1); }}>
                  <option>All Status</option><option>Active</option><option>Inactive</option>
                </select>

                {/* ── Tag filter popover ─────────────────────────────────── */}
                <div ref={tagPopoverRef} style={{ position: 'relative' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px',
                      background: tagFilter.length > 0 ? 'color-mix(in srgb, var(--blue) 10%, transparent)' : undefined,
                      borderColor: tagFilter.length > 0 ? 'color-mix(in srgb, var(--blue) 30%, transparent)' : undefined,
                      color: tagFilter.length > 0 ? 'var(--blue)' : undefined,
                    }}
                    onClick={() => setTagPopoverOpen(o => !o)}
                  >
                    <Tag size={13} />
                    Tags
                    {tagFilter.length > 0 && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 18, height: 18, borderRadius: 9, fontSize: 10, fontWeight: 700,
                        background: 'var(--blue)', color: '#fff', padding: '0 4px',
                      }}>
                        {tagFilter.length}
                      </span>
                    )}
                    <ChevronDown size={11} style={{ opacity: 0.6, transform: tagPopoverOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>

                  {tagPopoverOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--bd)',
                      borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
                      zIndex: 9999, minWidth: 200, maxWidth: 260, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '10px 12px 6px', fontSize: 10, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Filter by tag
                      </div>
                      {(tagsQuery.data ?? []).length === 0 ? (
                        <div style={{ padding: '8px 12px 12px', fontSize: 12, color: 'var(--t4)' }}>
                          No tags yet — add tags to customers first.
                        </div>
                      ) : (
                        <div style={{ padding: '4px 8px 8px', display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 240, overflowY: 'auto' }}>
                          {(tagsQuery.data ?? []).map(t => {
                            const active = tagFilter.includes(t);
                            return (
                              <div
                                key={t}
                                onClick={() => {
                                  setTagFilter(prev => active ? prev.filter(x => x !== t) : [...prev, t]);
                                  setCustomerPage(1);
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                                  background: active ? 'color-mix(in srgb, var(--blue) 9%, transparent)' : 'transparent',
                                  transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'color-mix(in srgb, var(--t1) 5%, transparent)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = active ? 'color-mix(in srgb, var(--blue) 9%, transparent)' : 'transparent' }}
                              >
                                <div style={{
                                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                  border: `1.5px solid ${active ? 'var(--blue)' : 'var(--bd)'}`,
                                  background: active ? 'var(--blue)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.1s',
                                }}>
                                  {active && <X size={9} color="#fff" strokeWidth={3} />}
                                </div>
                                <span style={{ fontSize: 13, color: active ? 'var(--blue)' : 'var(--t1)', fontWeight: active ? 600 : 400 }}>{t}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {tagFilter.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--bd)', padding: '6px 8px' }}>
                          <button
                            onClick={() => { setTagFilter([]); setCustomerPage(1); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t4)', padding: '2px 4px', borderRadius: 4 }}
                          >
                            Clear all tags
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Active tag chips inline */}
                {tagFilter.map(t => (
                  <span key={t} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
                    color: 'var(--blue)', borderRadius: 20,
                    padding: '0 4px 0 10px', fontSize: 12, fontWeight: 600,
                    border: '1px solid color-mix(in srgb, var(--blue) 20%, transparent)',
                    height: 28,
                  }}>
                    {t}
                    <button
                      onClick={() => { setTagFilter(prev => prev.filter(x => x !== t)); setCustomerPage(1); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: 'color-mix(in srgb, var(--blue) 14%, transparent)',
                        border: 'none', cursor: 'pointer', color: 'var(--blue)', padding: 0,
                      }}
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}

                {/* Sort control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                  <select
                    className="select"
                    style={{ fontSize: 12, padding: '0 8px', height: 32, fontWeight: 600 }}
                    value={`${sortBy}:${sortDir}`}
                    onChange={e => {
                      const [by, dir] = e.target.value.split(':');
                      setSortBy(by);
                      setSortDir(dir as 'asc' | 'desc');
                      setCustomerPage(1);
                    }}
                  >
                    <option value="createdAt:desc">Newest first</option>
                    <option value="createdAt:asc">Oldest first</option>
                    <option value="name:asc">Name A–Z</option>
                    <option value="name:desc">Name Z–A</option>
                    <option value="city:asc">Location A–Z</option>
                    <option value="city:desc">Location Z–A</option>
                    <option value="updated:desc">Recently active</option>
                    <option value="equipment:desc">Most equipment</option>
                    <option value="type:asc">Type</option>
                    <option value="installDate:asc">Earliest install date</option>
                    <option value="installDate:desc">Latest install date</option>
                    <option value="warranty:asc">Warranty expiring soonest</option>
                    <option value="warranty:desc">Warranty expiring latest</option>
                    <option value="tag:asc">Tag A–Z</option>
                    <option value="tag:desc">Tag Z–A</option>
                  </select>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddOpen(true)}><Plus size={12} /> Add Customer</button>
                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ fontWeight: 600 }} onClick={() => setIsPortalInviteOpen(true)} title="Create a customer account and send login credentials by email"><Send size={12} /> Send Portal Invite</button>
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
                    <tr><th>Customer</th><th>Contact</th><th>Location</th><th>Status</th><th>Type</th><th>Auto Follow-up</th><th>Tags</th><th>Revenue</th><th>Since</th><th>Actions</th></tr>
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
                        <td>
                          {(() => {
                            const visibleTags = (c.tags ?? []).filter((t: string) => !t.startsWith('iot:') && t !== 'portal-signup');
                            if (visibleTags.length === 0) return <span style={{ color: 'var(--t4)', fontSize: 12 }}>—</span>;
                            const shown = visibleTags.slice(0, 2);
                            const rest = visibleTags.slice(2);
                            return (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                {shown.map((t: string) => (
                                  <span key={t} style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                    background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
                                    color: 'var(--blue)',
                                    border: '1px solid color-mix(in srgb, var(--blue) 18%, transparent)',
                                    whiteSpace: 'nowrap', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis',
                                  }} title={t}>{t}</span>
                                ))}
                                {rest.length > 0 && (
                                  <span
                                    title={rest.join(', ')}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                      background: 'var(--bg-card-2, var(--bg-card))',
                                      color: 'var(--t3)',
                                      border: '1px solid var(--bd)',
                                      cursor: 'default', whiteSpace: 'nowrap',
                                    }}
                                  >+{rest.length}</span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="font-600">{c.totalRevenue != null ? fmt(c.totalRevenue) : '—'}</td>
                        <td className="text-sm text-[var(--t3)]">{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td>
                          <div
                            className="flex items-center gap-1"
                            onMouseEnter={(e) => { e.stopPropagation(); setHoveredCustomer(null); }}
                            onMouseMove={(e) => { e.stopPropagation(); setHoveredCustomer(null); }}
                          >
                            <button className="flex items-center justify-center p-1.5 text-violet-500 hover:bg-violet-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" onClick={e => { e.stopPropagation(); setRecCustomer(c); }} title="AI Recommendations"><Sparkles size={15} /></button>
                            <button className="flex items-center justify-center p-1.5 text-[var(--blue)] hover:bg-blue-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" onClick={e => { e.stopPropagation(); handleViewClick(c, "customer"); }} title="View Details"><Edit size={15} /></button>
                            <button className="flex items-center justify-center p-1.5 text-[var(--t2)] hover:bg-gray-100 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Email" onClick={e => { e.stopPropagation(); window.location.href = `mailto:${c.email}`; }}><Mail size={15} /></button>
                            <button className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer" title="Delete" onClick={e => { e.stopPropagation(); confirmDelete(c.id, customerName(c)); }}><Trash2 size={15} /></button>
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
      <AddPersonModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} type="customer" />
      <AddPersonModal isOpen={isPortalInviteOpen} onClose={() => setIsPortalInviteOpen(false)} type="lead" />

      {recCustomer && (
        <CustomerRecommendationsModal customer={recCustomer} onClose={() => setRecCustomer(null)} />
      )}

      {/* Delete confirmation dialog */}
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
