import { X, Sparkles, Phone, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { computeLeadStatusSummary, formatLeadPct, leadRiskColor } from "../pages/customers/leadInsights";
import { leadName } from "../types/api";
import type { Lead } from "../types/api";
import { formatMoney } from '../lib/format'

type Priority = "low" | "medium" | "high";

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; border: string; label: string }> = {
  high: { color: "var(--red)", bg: "rgba(239,68,68,0.10)", border: "#ef4444", label: "HIGH" },
  medium: { color: "var(--amber)", bg: "rgba(245,158,11,0.10)", border: "#f59e0b", label: "MEDIUM" },
  low: { color: "var(--green)", bg: "rgba(16,185,129,0.10)", border: "#10b981", label: "LOW" },
};

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 4, padding: "2px 6px" }}>
      {cfg.label}
    </span>
  );
}

function Detail({ label: title, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 13, gap: 12 }}>
      <span style={{ color: "var(--t3)" }}>{title}</span>
      <span style={{ color: "var(--t1)", fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Section({
  icon,
  title,
  priority,
  children,
}: {
  icon: ReactNode;
  title: string;
  priority: Priority;
  children: ReactNode;
}) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <div style={{ borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden", borderTop: `3px solid ${cfg.border}`, background: "var(--bg-card)", minHeight: 300, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 16px 10px", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
          <span style={{ color: cfg.color }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--t1)", lineHeight: 1.25 }}>{title}</span>
        </div>
        <PriorityBadge priority={priority} />
      </div>
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>{children}</div>
    </div>
  );
}

export default function LeadRecommendationsModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const summary = computeLeadStatusSummary(lead);
  const channelLabel = summary.recommendedAction.channel === "whatsapp" ? "WhatsApp" : summary.recommendedAction.channel === "call" ? "Phone call" : "Email";

  return (
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-card)", borderRadius: 14, width: "100%", maxWidth: 980, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}
      >
        <div style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={18} style={{ color: "#fff" }} />
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>AI Lead Recommendations</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 1 }}>{leadName(lead)}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", display: "flex", color: "#fff" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, alignItems: "stretch" }}>
            <Section icon={<Phone size={15} />} title="Follow-up Recommendation" priority={summary.recommendedAction.priority}>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, flex: 1 }}>
                <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 10, lineHeight: 1.5 }}>{summary.proposedNextStep}</p>
                <Detail label="Action" value={label(summary.recommendedAction.action)} />
                <Detail label="Channel" value={channelLabel} />
                <Detail label="Risk" value={`${summary.riskPrediction.level} (${formatLeadPct(summary.riskPrediction.probability)})`} />
                <Detail label="Status" value={summary.currentStatus} />
              </div>
              {summary.recommendedAction.triggerImmediately && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--amber)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Zap size={12} /> Immediate outreach recommended
                </div>
              )}
            </Section>

            <Section icon={<ShieldCheck size={15} />} title="Risk Prediction" priority={summary.riskPrediction.level === "High" ? "high" : summary.riskPrediction.level === "Medium" ? "medium" : "low"}>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, flex: 1 }}>
                <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 10, lineHeight: 1.5 }}>{summary.riskPrediction.summary}</p>
                <Detail label="Risk level" value={<span style={{ color: leadRiskColor(summary.riskPrediction.level) }}>{summary.riskPrediction.level}</span>} />
                <Detail label="Risk probability" value={formatLeadPct(summary.riskPrediction.probability)} />
                <Detail label="Days open" value={summary.signals.ageDays} />
                <Detail label="Source quality" value={summary.signals.sourceQuality} />
              </div>
            </Section>

            <Section icon={<TrendingUp size={15} />} title="Value Recommendation" priority={summary.valueRecommendation.priorityScore >= 0.7 ? "high" : summary.valueRecommendation.priorityScore >= 0.4 ? "medium" : "low"}>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, flex: 1 }}>
                <Detail label="Recommended offer" value={label(summary.valueRecommendation.recommendedOffer)} />
                <Detail label="Confidence" value={formatLeadPct(summary.valueRecommendation.confidence)} />
                <Detail label="Priority score" value={summary.valueRecommendation.priorityScore.toFixed(3)} />
                <Detail label="Estimated value" value={formatMoney(summary.signals.estimatedValue, { decimals: 0 })} />
                <Detail label="Status" value={summary.valueRecommendation.status} />
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
