import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X, MapPin, User, Calendar, Clock, DollarSign, FileText,
  Briefcase, Wrench, Loader2, AlertCircle, Send, Receipt,
  Star, RefreshCw, Phone, Navigation,
} from "lucide-react";
import { useJob, useUpdateJobStatus } from "../../hooks/useJobs";
import { useTechnicians, useManualAssign } from "../../hooks/useScheduling";
import type { Job, DispatchAssignment, Technician } from "../../types/api";
import { formatMoney } from '../../lib/format'

interface JobDetailPanelProps {
  jobId: string;
  assignment?: DispatchAssignment;
  technician?: Technician;
  isOpen: boolean;
  onClose: () => void;
  onCreateQuote?: (job: Job) => void;
  onCreateInvoice?: (job: Job) => void;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:     { label: "Pending",     color: "#d97706", bg: "rgba(217,119,6,0.1)",   border: "rgba(217,119,6,0.25)" },
  SCHEDULED:   { label: "Scheduled",   color: "#7c3aed", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.25)" },
  EN_ROUTE:    { label: "En Route",    color: "#2563eb", bg: "rgba(37,99,235,0.1)",   border: "rgba(37,99,235,0.25)" },
  ON_SITE:     { label: "On Site",     color: "#7c3aed", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.25)" },
  IN_PROGRESS: { label: "In Progress", color: "#2563eb", bg: "rgba(37,99,235,0.1)",   border: "rgba(37,99,235,0.25)" },
  COMPLETED:   { label: "Completed",   color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)" },
  INVOICED:    { label: "Invoiced",    color: "#0891b2", bg: "rgba(8,145,178,0.1)",   border: "rgba(8,145,178,0.25)" },
  PAID:        { label: "Paid",        color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)" },
  CANCELLED:   { label: "Cancelled",   color: "#dc2626", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.25)" },
  ON_HOLD:     { label: "On Hold",     color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.25)" },
};

const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  LOW:       { label: "Low",       color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
  NORMAL:    { label: "Normal",    color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  HIGH:      { label: "High",      color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  URGENT:    { label: "Urgent",    color: "#ea580c", bg: "rgba(234,88,12,0.1)" },
  EMERGENCY: { label: "Emergency", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
};


export default function JobDetailPanel({
  jobId, assignment, technician, isOpen, onClose, onCreateQuote, onCreateInvoice,
}: JobDetailPanelProps) {
  const { data: job, isLoading } = useJob(jobId);
  const updateJobStatus = useUpdateJobStatus();
  const { data: technicians } = useTechnicians();
  const manualAssign = useManualAssign();
  const [error, setError] = useState("");
  const [showReassign, setShowReassign] = useState(false);

  if (!isOpen) return null;

  const handleQuickTransition = (newStatus: string, note: string) => {
    setError("");
    updateJobStatus.mutate(
      { id: jobId, status: newStatus, statusNote: note },
      { onError: (err: any) => setError(err?.response?.data?.message ?? "Status change failed.") },
    );
  };

  const sm = STATUS_META[job?.status ?? "PENDING"] ?? STATUS_META.PENDING;
  const pm = job?.priority ? (PRIORITY_META[job.priority] ?? PRIORITY_META.NORMAL) : null;
  const assignedTechName = technician?.name ?? assignment?.technicianName ?? job?.assignedToName ?? "Unassigned";

  const timelineSteps = [
    { label: "Assigned", time: assignment?.assignedAt },
    { label: "En Route", time: assignment?.enRouteAt },
    { label: "On Site",  time: assignment?.onSiteAt },
    { label: "Done",     time: assignment?.completedAt },
  ];
  const STATUS_ORDER = ["ASSIGNED", "EN_ROUTE", "ON_SITE", "COMPLETED"];
  const currentStepIdx = assignment ? STATUS_ORDER.indexOf(assignment.status) : -1;

  return createPortal(
    <>
      <style>{`
        @keyframes _jdp_backdrop { from { opacity: 0; } to { opacity: 1; } }
        @keyframes _jdp_pop {
          from { opacity: 0; scale: 0.93; }
          to   { opacity: 1; scale: 1; }
        }
      `}</style>

      {/* Backdrop — portal ensures this is always on top of everything */}
      <div
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.44)",
          backdropFilter: "blur(3px)",
          zIndex: 99998,
          animation: "_jdp_backdrop 0.18s ease both",
        }}
        onClick={onClose}
      />

      {/* Floating centered modal
          inset:0 + margin:auto = always viewport-centered, no transform conflict.
          Portal guarantees position:fixed is relative to the true viewport,
          not any ancestor with a transform (e.g. anim-fade-up on DispatchBoard). */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          margin: "auto",
          width: "min(520px, 92vw)",
          maxHeight: "85vh",
          height: "fit-content",
          zIndex: 99999,
          borderRadius: 16,
          background: "var(--bg-card)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 28px 80px rgba(0,0,0,0.26), 0 8px 28px rgba(0,0,0,0.12)",
          animation: "_jdp_pop 0.22s cubic-bezier(0.34,1.45,0.64,1) both",
          border: "1px solid var(--bd)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{
          padding: "18px 22px 16px", borderBottom: "1px solid var(--bd)", flexShrink: 0,
          background: "var(--bg-card-2)",
          borderTop: `3px solid ${sm.color}`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {isLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--t4)", fontSize: 13 }}>
                  <Loader2 size={14} className="animate-spin" /> Loading job…
                </div>
              ) : job ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, border: `1px solid ${sm.border}`, padding: "2px 9px", borderRadius: 10 }}>
                      {sm.label}
                    </span>
                    {pm && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: pm.color, background: pm.bg, padding: "2px 9px", borderRadius: 10 }}>
                        {pm.label}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: "var(--t4)", fontFamily: "monospace" }}>#{jobId.slice(0, 10)}…</span>
                  </div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)", lineHeight: 1.3, margin: "0 0 5px 0" }}>
                    {job.title}
                  </h2>
                  <p style={{ fontSize: 12, color: "var(--t3)", margin: 0, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    <User size={11} />
                    {job.customerName ?? "No customer"}
                    {assignedTechName !== "Unassigned" && (
                      <><span style={{ color: "var(--bd)" }}>·</span><Wrench size={11} />{assignedTechName}</>
                    )}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 13, color: "var(--t4)" }}>Job not found</p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8, border: "1px solid var(--bd)",
                background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--t3)", flexShrink: 0, transition: "background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--t1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; (e.currentTarget as HTMLElement).style.color = "var(--t3)"; }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ───────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240, color: "var(--t4)" }}>
              <Loader2 size={26} className="animate-spin" />
            </div>
          ) : !job ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 240, color: "var(--t4)" }}>
              <AlertCircle size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Job not found</p>
            </div>
          ) : (
            <div style={{ padding: "0 22px 28px" }}>

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, color: "#dc2626", fontSize: 13, margin: "16px 0 0" }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* ── Job Details ── */}
              <div style={{ marginTop: 16 }}>
                <SectionLabel icon={Wrench} text="Job Details" />

                {/* 2×2 core facts grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <InfoCell icon={User} label="Customer"
                    value={job.customerName ?? "—"} />
                  <InfoCell icon={Wrench} label="Technician"
                    value={assignedTechName} />
                  <InfoCell icon={Calendar} label="Scheduled"
                    value={job.scheduledStart
                      ? new Date(job.scheduledStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        + " · "
                        + new Date(job.scheduledStart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                      : "—"} />
                  <InfoCell icon={DollarSign} label="Amount"
                    value={job.finalAmount != null
                      ? formatMoney(job.finalAmount, { decimals: 0 })
                      : job.estimatedAmount != null
                        ? `${formatMoney(job.estimatedAmount, { decimals: 0 })} est.`
                        : "—"} />
                </div>

                {/* Address — full width row */}
                {(job.serviceAddress ?? job.customerAddress) && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", background: "var(--bg-hover)", borderRadius: 8, marginBottom: 8 }}>
                    <MapPin size={13} color="var(--t3)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Address</div>
                      <div style={{ fontSize: 12, color: "var(--t1)", fontWeight: 500, lineHeight: 1.4 }}>
                        {job.serviceAddress ?? job.customerAddress}
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional extras: job type + scheduled end */}
                {(job.jobTypeName || job.scheduledEnd) && (
                  <div style={{ display: "grid", gridTemplateColumns: job.jobTypeName && job.scheduledEnd ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 8 }}>
                    {job.jobTypeName && <InfoCell icon={Briefcase} label="Job Type" value={job.jobTypeName} />}
                    {job.scheduledEnd && <InfoCell icon={Clock} label="End Time"
                      value={new Date(job.scheduledEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        + " · "
                        + new Date(job.scheduledEnd).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} />}
                  </div>
                )}

                {job.description && (
                  <div style={{ padding: "9px 12px", background: "var(--bg-hover)", borderRadius: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Description</div>
                    <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6 }}>{job.description}</div>
                  </div>
                )}
              </div>

              {/* ── Assignment Info ── */}
              {assignment && (
                <div style={{ marginTop: 24 }}>
                  <SectionLabel icon={Briefcase} text="Assignment" />

                  {/* Tech card */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--bg-hover)", borderRadius: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: 15,
                    }}>
                      {(technician?.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{technician?.name ?? "Unknown"}</div>
                      {technician?.phone && (
                        <div style={{ fontSize: 11, color: "var(--t3)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <Phone size={10} /> {technician.phone}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                      {assignment.score != null && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#d97706", background: "rgba(217,119,6,0.1)", padding: "2px 7px", borderRadius: 8, display: "flex", alignItems: "center", gap: 3 }}>
                          <Star size={9} /> {Number(assignment.score).toFixed(1)}
                        </span>
                      )}
                      {assignment.distanceKm != null && (
                        <span style={{ fontSize: 10, color: "var(--t3)", background: "var(--bg-card)", padding: "2px 7px", borderRadius: 8, border: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: 3 }}>
                          <MapPin size={9} /> {Number(assignment.distanceKm).toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div style={{ padding: "14px", background: "var(--bg-hover)", borderRadius: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                      {timelineSteps.map((step, i) => {
                        const isDone = i < currentStepIdx;
                        const isCurrent = i === currentStepIdx;
                        const dotColor = isCurrent ? "#2563eb" : isDone ? "#10b981" : "var(--bd)";
                        return (
                          <div key={step.label} style={{ display: "flex", alignItems: "center", flex: i < timelineSteps.length - 1 ? 1 : "none" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <div style={{
                                width: 10, height: 10, borderRadius: "50%", transition: "all 0.2s",
                                background: (isDone || isCurrent) ? dotColor : "var(--bg-card)",
                                border: `2px solid ${dotColor}`,
                              }} />
                              <div style={{ fontSize: 9, marginTop: 4, whiteSpace: "nowrap", fontWeight: (isDone || isCurrent) ? 600 : 400, color: (isDone || isCurrent) ? "var(--t2)" : "var(--t4)" }}>
                                {step.label}
                              </div>
                              {step.time && (
                                <div style={{ fontSize: 8, color: "var(--t4)", marginTop: 2 }}>
                                  {new Date(step.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              )}
                            </div>
                            {i < timelineSteps.length - 1 && (
                              <div style={{ flex: 1, height: 1.5, background: isDone ? "#10b981" : "var(--bd)", margin: "0 4px", marginBottom: 28, transition: "background 0.2s" }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reassign */}
                  {assignment.status !== "COMPLETED" && assignment.status !== "CANCELLED" && (
                    <div>
                      {!showReassign ? (
                        <button
                          onClick={() => setShowReassign(true)}
                          style={{
                            width: "100%", padding: "8px", borderRadius: 8,
                            border: "1px solid var(--bd)", background: "var(--bg-card)",
                            color: "var(--t3)", fontSize: 12, fontWeight: 500,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; }}
                        >
                          <RefreshCw size={12} /> Reassign Technician
                        </button>
                      ) : (
                        <div style={{ padding: "12px 14px", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#d97706", marginBottom: 8 }}>Select new technician:</div>
                          <select
                            style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--bd)", fontSize: 13, background: "var(--bg-card)", color: "var(--t1)", fontFamily: "inherit", outline: "none" }}
                            defaultValue=""
                            onChange={e => {
                              if (e.target.value && job) {
                                manualAssign.mutate({
                                  jobId: job.id,
                                  technicianId: e.target.value,
                                  jobLatitude: Number(job.serviceLatitude ?? 0),
                                  jobLongitude: Number(job.serviceLongitude ?? 0),
                                }, { onSuccess: () => setShowReassign(false) });
                              }
                            }}
                          >
                            <option value="" disabled>Choose technician…</option>
                            {technicians?.filter(t => t.id !== assignment.technicianId).map(t => (
                              <option key={t.id} value={t.id}>{t.name}{t.phone ? ` (${t.phone})` : ""}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setShowReassign(false)}
                            style={{ fontSize: 11, color: "var(--t4)", background: "none", border: "none", cursor: "pointer", marginTop: 6, padding: 0 }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Assign Technician (unassigned job) ── */}
              {!assignment && job && (
                <div style={{ marginTop: 24 }}>
                  <SectionLabel icon={Briefcase} text="Assign Technician" />
                  <div style={{ padding: "14px", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 10 }}>
                    <p style={{ fontSize: 13, color: "#d97706", marginBottom: 10, fontWeight: 500 }}>
                      This job has no technician assigned.
                    </p>
                    <select
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid rgba(217,119,6,0.3)", fontSize: 13, background: "var(--bg-card)", color: "var(--t1)", fontFamily: "inherit", outline: "none" }}
                      defaultValue=""
                      onChange={e => {
                        if (e.target.value) {
                          manualAssign.mutate({
                            jobId: job.id, technicianId: e.target.value,
                            jobLatitude: Number(job.serviceLatitude ?? 0),
                            jobLongitude: Number(job.serviceLongitude ?? 0),
                          });
                        }
                      }}
                    >
                      <option value="" disabled>Choose technician…</option>
                      {technicians?.map(t => (
                        <option key={t.id} value={t.id}>{t.name}{t.phone ? ` (${t.phone})` : ""}</option>
                      ))}
                    </select>
                    {manualAssign.isPending && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#d97706", marginTop: 8 }}>
                        <Loader2 size={11} className="animate-spin" /> Assigning…
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Location ── */}
              {job.serviceLatitude && job.serviceLongitude && (
                <div style={{ marginTop: 24 }}>
                  <SectionLabel icon={MapPin} text="Location" />
                  <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--bd)", marginBottom: 8 }}>
                    <iframe
                      width="100%"
                      height="140"
                      frameBorder="0"
                      scrolling="no"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(job.serviceLongitude)-0.01},${Number(job.serviceLatitude)-0.008},${Number(job.serviceLongitude)+0.01},${Number(job.serviceLatitude)+0.008}&layer=mapnik&marker=${job.serviceLatitude},${job.serviceLongitude}`}
                      style={{ display: "block" }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--t3)", display: "flex", alignItems: "center", gap: 5 }}>
                    <Navigation size={11} color="#10b981" />
                    {job.serviceAddress ?? `${job.serviceLatitude}, ${job.serviceLongitude}`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        {job && (
          <div style={{ padding: "13px 22px", borderTop: "1px solid var(--bd)", flexShrink: 0, background: "var(--bg-card-2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              {["SCHEDULED","EN_ROUTE","ON_SITE","COMPLETED","PENDING"].includes(job.status) && onCreateQuote && (
                <FooterBtn color="#10b981" bg="rgba(16,185,129,0.08)" border="rgba(16,185,129,0.25)" onClick={() => onCreateQuote(job)}>
                  <Send size={13} /> Quote
                </FooterBtn>
              )}
              {["COMPLETED","ON_SITE","INVOICED"].includes(job.status) && onCreateInvoice && (
                <FooterBtn color="#2563eb" bg="rgba(37,99,235,0.08)" border="rgba(37,99,235,0.25)" onClick={() => onCreateInvoice(job)}>
                  <Receipt size={13} /> Invoice
                </FooterBtn>
              )}
              {job.status !== "CANCELLED" && job.status !== "PAID" &&
               ["PENDING","SCHEDULED","EN_ROUTE","ON_SITE","COMPLETED","INVOICED","ON_HOLD"].includes(job.status) && (
                <FooterBtn
                  color="#dc2626" bg="rgba(220,38,38,0.08)" border="rgba(220,38,38,0.25)"
                  onClick={() => handleQuickTransition("CANCELLED", "Cancelled from dispatch")}
                  disabled={updateJobStatus.isPending}
                >
                  <X size={13} /> Cancel
                </FooterBtn>
              )}
              <div style={{ flex: 1 }} />
              <FooterBtn
                color="var(--t2)" bg="var(--bg-card)" border="var(--bd)"
                onClick={() => { window.dispatchEvent(new CustomEvent("open-job-detail", { detail: job })); onClose(); }}
              >
                <FileText size={13} /> Full Details
              </FooterBtn>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}

function InfoCell({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--bg-hover)", borderRadius: 8, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
        <Icon size={10} /> {label}
      </div>
      <div style={{ fontSize: 12, color: "var(--t1)", fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value || "—"}
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
      <Icon size={11} /> {text}
    </div>
  );
}

function FooterBtn({ color, bg, border, onClick, disabled, children }: {
  color: string; bg: string; border: string;
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8,
        border: `1px solid ${border}`, background: bg, color, fontSize: 12, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
        opacity: disabled ? 0.55 : 1, transition: "filter 0.15s",
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.filter = "brightness(0.92)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
    >
      {children}
    </button>
  );
}
