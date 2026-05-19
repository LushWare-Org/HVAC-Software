import { createPortal } from "react-dom";
import {
  X, MapPin, Phone, Star, Briefcase, Battery,
  Zap, Navigation, Award, Clock, CheckCircle2,
} from "lucide-react";
import type { Technician, DispatchAssignment, Job } from "../../types/api";
import { getTechAvailability, AVAIL_META } from "./DispatchBoard";

interface Props {
  technician: Technician;
  assignments: DispatchAssignment[];
  jobs: Job[];
  lastLoginAt?: string;
  onClose: () => void;
}


const ASGN_STATUS_COLOR: Record<string, string> = {
  ASSIGNED: "#2563eb",
  EN_ROUTE: "#d97706",
  ON_SITE:  "#7c3aed",
  COMPLETED:"#10b981",
};
const ASGN_STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "Assigned",
  EN_ROUTE: "En Route",
  ON_SITE:  "On Site",
  COMPLETED:"Completed",
};

function timeSince(iso?: string) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
}

function StarRating({ value, total }: { value: number; total: number }) {
  const filled = Math.round(value);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path
            d="M5.5 1L6.8 4.1H10.1L7.5 6.1L8.4 9.3L5.5 7.5L2.6 9.3L3.5 6.1L0.9 4.1H4.2L5.5 1Z"
            fill={i < filled ? "#f59e0b" : "var(--bd)"}
          />
        </svg>
      ))}
      <span style={{ fontSize: 11, color: "var(--t3)", marginLeft: 3 }}>({total})</span>
    </div>
  );
}

export default function TechnicianDetailPanel({ technician: t, assignments, jobs, lastLoginAt, onClose }: Props) {
  const avail = getTechAvailability(t, lastLoginAt);
  const availMeta = AVAIL_META[avail];
  const activeAssignments = assignments.filter(
    a => a.technicianId === t.id && ["ASSIGNED", "EN_ROUTE", "ON_SITE"].includes(a.status),
  );
  const activeJobs = activeAssignments
    .map(a => jobs.find(j => j.id === (a as any).jobId))
    .filter((j): j is Job => !!j);

  const locationAge = timeSince(t.locationUpdatedAt);
  const isLocationFresh = t.locationUpdatedAt
    ? Date.now() - new Date(t.locationUpdatedAt).getTime() < 5 * 60 * 1000
    : false;

  const workloadPct = t.maxDailyJobs > 0 ? activeAssignments.length / t.maxDailyJobs : 0;
  const workloadColor = workloadPct >= 1 ? "#ef4444" : workloadPct >= 0.7 ? "#f59e0b" : "#10b981";

  return createPortal(
    <>
      <style>{`
        @keyframes _tdp_bg  { from { opacity:0 } to { opacity:1 } }
        @keyframes _tdp_pop { from { opacity:0; scale:.92 } to { opacity:1; scale:1 } }
        ._tdp_row:hover { background: var(--bg-hover) !important; }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 99998,
          background: "rgba(0,0,0,0.46)", backdropFilter: "blur(4px)",
          animation: "_tdp_bg .18s ease both",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed", inset: 0, margin: "auto",
          width: "min(560px,94vw)", maxHeight: "88vh", height: "fit-content",
          zIndex: 99999, borderRadius: 18, overflow: "hidden",
          background: "var(--bg-card)", display: "flex", flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.12)",
          border: "1px solid var(--bd)",
          animation: "_tdp_pop .22s cubic-bezier(.34,1.45,.64,1) both",
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Dark header band ──────────────────────────────────────── */}
        <div style={{
          background: t.isActive
            ? "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)"
            : "linear-gradient(135deg,#111827 0%,#1f2937 100%)",
          padding: "22px 22px 18px", flexShrink: 0, position: "relative", overflow: "hidden",
        }}>
          {/* diagonal stripe texture */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.035,
            backgroundImage: "repeating-linear-gradient(55deg,#fff 0,#fff 1px,transparent 1px,transparent 10px)",
          }} />

          {/* Top row: avatar + identity + close */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, position: "relative" }}>
            {/* Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: "#2563eb",
              border: "2px solid rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 18,
              opacity: t.isActive ? 1 : 0.55,
            }}>
              {t.name.charAt(0).toUpperCase()}
            </div>

            {/* Name + status + phone */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 18, margin: 0, letterSpacing: "-0.3px" }}>
                  {t.name}
                </h2>
                {/* Availability badge — derived from real login + GPS signals */}
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 9px", borderRadius: 20, letterSpacing: "0.05em",
                  background: `${availMeta.color}28`,
                  color: availMeta.color,
                  border: `1px solid ${availMeta.color}55`,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%", background: availMeta.color, display: "inline-block",
                    boxShadow: avail === "ONLINE" ? `0 0 0 2px ${availMeta.color}44` : "none",
                  }} />
                  {availMeta.label.toUpperCase()}
                </span>
                {isLocationFresh && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em",
                    background: "rgba(16,185,129,0.2)", color: "#6ee7b7",
                    border: "1px solid rgba(16,185,129,0.35)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
                    GPS LIVE
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {t.phone && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                    <Phone size={11} /> {t.phone}
                  </span>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                  <Briefcase size={11} />
                  {activeAssignments.length} of {t.maxDailyJobs} jobs today
                </span>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.65)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Stats strip */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 18,
            position: "relative",
          }}>
            {[
              { icon: Star,    val: (t.rating ?? 0).toFixed(1), sub: `${t.totalRatings ?? 0} reviews`,  color: "#fbbf24" },
              { icon: Briefcase, val: `${activeAssignments.length}/${t.maxDailyJobs}`, sub: "Jobs today",
                color: activeAssignments.length >= t.maxDailyJobs ? "#f87171" : "#60a5fa" },
              { icon: Battery, val: t.batteryPct != null ? `${t.batteryPct}%` : "—", sub: "Battery",
                color: t.batteryPct == null ? "rgba(255,255,255,0.3)" : t.batteryPct < 20 ? "#f87171" : t.batteryPct < 50 ? "#fbbf24" : "#34d399" },
              { icon: Zap,     val: t.speedKmh != null ? `${Math.round(t.speedKmh)}km/h` : "—", sub: "Speed", color: "#a78bfa" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 10, padding: "10px 10px 9px", textAlign: "center",
              }}>
                <s.icon size={12} color={s.color} style={{ display: "block", margin: "0 auto 4px" }} />
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1 }}>{s.val}</div>
                <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 9, marginTop: 3, letterSpacing: "0.02em" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Workload bar */}
          <div style={{ marginTop: 14, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Workload Capacity
              </span>
              <span style={{ fontSize: 9, color: workloadColor, fontWeight: 700 }}>
                {Math.round(workloadPct * 100)}%
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 6, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 6, transition: "width .4s ease",
                width: `${Math.min(workloadPct * 100, 100)}%`,
                background: workloadColor,
                boxShadow: `0 0 8px ${workloadColor}66`,
              }} />
            </div>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

          {/* Rating row */}
          <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", gap: 10 }}>
            <StarRating value={t.rating ?? 0} total={t.totalRatings ?? 0} />
            {t.lastSeenAt && (
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--t4)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={9} /> Last seen {timeSince(t.lastSeenAt)}
              </span>
            )}
          </div>

          {/* ── Live Location Map ── */}
          {t.currentLocation && (
            <div style={{ padding: "16px 20px 0" }}>
              <SectionHead icon={MapPin} label="Live Location">
                {locationAge && (
                  <span style={{
                    fontSize: 9, color: isLocationFresh ? "#10b981" : "var(--t4)",
                    background: "var(--bg-hover)", padding: "1px 7px", borderRadius: 8, fontWeight: 600,
                    border: `1px solid ${isLocationFresh ? "rgba(16,185,129,0.25)" : "var(--bd)"}`,
                  }}>
                    {locationAge}
                  </span>
                )}
              </SectionHead>
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--bd)" }}>
                <iframe
                  width="100%"
                  height="175"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${t.currentLocation.lng - 0.013},${t.currentLocation.lat - 0.01},${t.currentLocation.lng + 0.013},${t.currentLocation.lat + 0.01}&layer=mapnik&marker=${t.currentLocation.lat},${t.currentLocation.lng}`}
                  style={{ display: "block" }}
                />
              </div>
              <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <Navigation size={10} color="#10b981" />
                {t.currentLocation.lat.toFixed(5)}, {t.currentLocation.lng.toFixed(5)}
                {t.headingDeg != null && <span style={{ color: "var(--t4)" }}>· {t.headingDeg}° heading</span>}
              </div>
            </div>
          )}

          {/* ── Active Assignments ── */}
          {activeJobs.length > 0 && (
            <div style={{ padding: "18px 20px 0" }}>
              <SectionHead icon={Briefcase} label="Active Assignments" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {activeJobs.map((job, i) => {
                  const asgn = activeAssignments.find(a => (a as any).jobId === job.id || a.technicianId === t.id) ?? activeAssignments[i];
                  const color = ASGN_STATUS_COLOR[asgn?.status ?? "ASSIGNED"] ?? "#6b7280";
                  const label = ASGN_STATUS_LABEL[asgn?.status ?? "ASSIGNED"] ?? asgn?.status ?? "—";
                  return (
                    <div key={job.id} className="_tdp_row" style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10,
                      background: "var(--bg-hover)", border: "1px solid var(--bd)",
                      transition: "background .15s",
                    }}>
                      <div style={{ width: 3, height: 34, borderRadius: 3, background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job.title}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>
                          {job.customerName ?? "—"}
                          {job.serviceAddress && <span style={{ marginLeft: 6, opacity: 0.7 }}>· {job.serviceAddress}</span>}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8, whiteSpace: "nowrap",
                        color, background: `${color}18`, border: `1px solid ${color}35`,
                      }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Skills ── */}
          {t.skills?.length > 0 && (
            <div style={{ padding: "18px 20px 0" }}>
              <SectionHead icon={Award} label="Skills & Certifications" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {t.skills.map(sk => (
                  <span key={sk} style={{
                    padding: "4px 11px", borderRadius: 20,
                    fontSize: 11, fontWeight: 600,
                    background: "rgba(99,102,241,0.08)", color: "#6366f1",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}>{sk}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Meta ── */}
          <div style={{ padding: "18px 20px 24px" }}>
            <SectionHead icon={CheckCircle2} label="Details" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <MetaCell label="Max Daily Jobs" value={String(t.maxDailyJobs)} />
              <MetaCell label="Total Ratings" value={String(t.totalRatings ?? 0)} />
              {t.createdAt && (
                <MetaCell
                  label="Member Since"
                  value={new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                />
              )}
              {t.lastSeenAt && (
                <MetaCell
                  label="Last Seen"
                  value={
                    new Date(t.lastSeenAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
                    " · " +
                    new Date(t.lastSeenAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function SectionHead({ icon: Icon, label, children }: { icon: any; label: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <Icon size={11} color="var(--t4)" />
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
      {children && <span style={{ marginLeft: 4 }}>{children}</span>}
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "9px 12px", background: "var(--bg-hover)", borderRadius: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)" }}>{value}</div>
    </div>
  );
}
