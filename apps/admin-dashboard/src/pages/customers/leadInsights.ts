import type { Lead, LeadStatusSummary } from "../../types/api";

function clampProbability(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function ageDays(date?: string) {
  if (!date) return 0;
  const parsed = new Date(date).getTime();
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor((Date.now() - parsed) / 86400000));
}

function sourceQuality(source?: string): LeadStatusSummary["signals"]["sourceQuality"] {
  const normalized = (source ?? "").toLowerCase();
  if (["referral", "google", "website", "portal"].some((s) => normalized.includes(s))) return "high";
  if (["facebook", "yelp", "walk", "walk-in"].some((s) => normalized.includes(s))) return "medium";
  return "low";
}

function level(probability: number): "Low" | "Medium" | "High" {
  if (probability >= 0.67) return "High";
  if (probability >= 0.38) return "Medium";
  return "Low";
}

function actionLabel(action: string) {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatLeadPct(value: number) {
  return `${Math.round(clampProbability(value) * 100)}%`;
}

export function leadRiskColor(levelValue: "Low" | "Medium" | "High") {
  if (levelValue === "High") return "var(--red)";
  if (levelValue === "Medium") return "var(--amber)";
  return "var(--green)";
}

export function leadConversionColor(levelValue: "Low" | "Medium" | "High") {
  if (levelValue === "High") return "var(--green)";
  if (levelValue === "Medium") return "var(--amber)";
  return "var(--red)";
}

export function computeLeadStatusSummary(lead: Lead): LeadStatusSummary {
  const daysOpen = ageDays(lead.createdAt);
  const estimatedValue = Number(lead.estimatedValue ?? 0);
  const quality = sourceQuality(lead.source);
  const hasEmail = Boolean(lead.email);
  const hasPhone = Boolean(lead.phone);
  const hasWhatsapp = Boolean(lead.whatsappNo);

  const statusBoost: Record<string, number> = {
    NEW: 0.2,
    CONTACTED: 0.36,
    QUALIFIED: 0.64,
    WON: 0.98,
    LOST: 0.03,
  };
  const sourceBoost = quality === "high" ? 0.12 : quality === "medium" ? 0.06 : 0;
  const valueBoost = estimatedValue >= 10000 ? 0.1 : estimatedValue >= 4000 ? 0.06 : estimatedValue >= 1000 ? 0.03 : 0;
  const contactBoost = hasWhatsapp || hasPhone ? 0.05 : hasEmail ? 0.03 : -0.04;
  const ageDrag = lead.status === "WON" || lead.status === "LOST" ? 0 : Math.min(0.22, daysOpen / 180);
  const conversionProbability = clampProbability((statusBoost[lead.status] ?? 0.2) + sourceBoost + valueBoost + contactBoost - ageDrag);
  const conversionLevel = level(conversionProbability);

  const baseRisk = lead.status === "LOST" ? 0.95 : lead.status === "WON" ? 0.04 : 1 - conversionProbability;
  const staleRisk = lead.status === "NEW" || lead.status === "CONTACTED" ? Math.min(0.24, daysOpen / 120) : 0;
  const riskProbability = clampProbability(baseRisk + staleRisk);
  const riskLevel = level(riskProbability);

  const channel: LeadStatusSummary["recommendedAction"]["channel"] =
    hasWhatsapp ? "whatsapp" : hasPhone ? "call" : "email";

  let action = "standard_followup";
  if (lead.status === "LOST") action = "recovery_review";
  else if (lead.status === "WON") action = "handoff_to_customer";
  else if (riskProbability >= 0.7) action = "urgent_reengagement";
  else if (lead.status === "QUALIFIED" && estimatedValue >= 4000) action = "send_proposal";
  else if (lead.status === "NEW") action = "first_contact";

  const priority: LeadStatusSummary["recommendedAction"]["priority"] =
    riskProbability >= 0.7 || (lead.status === "QUALIFIED" && estimatedValue >= 4000)
      ? "high"
      : riskProbability >= 0.42 || estimatedValue >= 2500
        ? "medium"
        : "low";

  const recommendedOffer =
    lead.status === "QUALIFIED" && estimatedValue >= 4000 ? "proposal_package" :
    riskProbability >= 0.7 ? "priority_callback" :
    lead.serviceInterest ? "service_consultation" :
    "discovery_call";
  const confidence = clampProbability((conversionProbability * 0.65) + ((1 - riskProbability) * 0.2) + (estimatedValue >= 2500 ? 0.1 : 0.04));
  const priorityScore = clampProbability((riskProbability * 0.45) + (conversionProbability * 0.35) + (estimatedValue >= 4000 ? 0.2 : 0.08));

  const reason =
    action === "recovery_review" ? "Lead is marked lost; review recovery potential before outreach." :
    action === "handoff_to_customer" ? "Lead is won and should be worked through the customer workflow." :
    action === "urgent_reengagement" ? "Lead is at elevated risk because conversion probability is low or the record is aging." :
    action === "send_proposal" ? "Qualified high-value lead is ready for a proposal." :
    action === "first_contact" ? "New lead needs initial outreach." :
    "Lead should remain on the normal follow-up cadence.";

  const proposedNextStep =
    action === "handoff_to_customer" ? "Open the converted customer record and continue customer follow-up." :
    action === "recovery_review" ? "Review loss notes, then decide whether to send one recovery message." :
    `${actionLabel(action)} via ${channel === "whatsapp" ? "WhatsApp" : channel === "call" ? "phone call" : "email"}.`;

  return {
    leadId: lead.id,
    currentStatus: lead.status.replace(/_/g, " "),
    conversionPrediction: {
      probability: conversionProbability,
      level: conversionLevel,
      summary: `${conversionLevel} conversion likelihood based on status, source, contactability, value, and lead age.`,
    },
    riskPrediction: {
      probability: riskProbability,
      level: riskLevel,
      summary: `${riskLevel} risk based on stale pipeline age and weak conversion signals.`,
    },
    recommendedAction: {
      action,
      priority,
      channel,
      reason,
      triggerImmediately: priority === "high" && lead.status !== "WON",
    },
    valueRecommendation: {
      recommendedOffer,
      confidence,
      priorityScore,
      status: "live estimate",
    },
    proposedNextStep,
    predictionSource: "fallback",
    reasoning: {
      leadConversion: {
        ruleBased: `Conversion score starts from pipeline status, then adjusts for ${quality} source quality, ${estimatedValue ? `$${estimatedValue.toLocaleString()}` : "unknown"} estimated value, available contact channels, and ${daysOpen} days open.`,
        mlResult: `Fallback model produced ${conversionLevel} conversion likelihood (${formatLeadPct(conversionProbability)}).`,
        aiExplanation: `The strongest positive signal is ${lead.status === "QUALIFIED" || lead.status === "WON" ? "advanced pipeline stage" : quality === "high" ? "source quality" : hasWhatsapp || hasPhone ? "reachable contact data" : "limited but usable lead data"}.`,
      },
      riskPrediction: {
        ruleBased: "Risk increases when a lead remains open without conversion, has weak contact channels, or has not advanced beyond early pipeline stages.",
        mlResult: `Fallback model produced ${riskLevel} risk (${formatLeadPct(riskProbability)}).`,
        aiExplanation: riskProbability >= 0.67 ? "This lead should be handled quickly before it goes stale." : "The lead can stay in normal cadence unless new negative signals appear.",
      },
      recommendation: {
        ruleBased: "Recommendation rules prioritize recovery review, converted-customer handoff, urgent re-engagement, proposal sending, first contact, then standard follow-up.",
        mlResult: `Selected ${actionLabel(action)} at ${priority} priority with ${formatLeadPct(priorityScore)} priority score.`,
        aiExplanation: `${reason} Recommended channel: ${channel === "whatsapp" ? "WhatsApp" : channel === "call" ? "phone call" : "email"}.`,
      },
      proposedNextStep: {
        ruleBased: "Next-step text translates the selected lead action into an operational instruction.",
        mlResult: `Selected next step: ${proposedNextStep}`,
        aiExplanation: "This keeps the lead moving toward either qualification, proposal, conversion, or a controlled loss/recovery path.",
      },
    },
    signals: {
      ageDays: daysOpen,
      estimatedValue,
      hasEmail,
      hasPhone,
      hasWhatsapp,
      sourceQuality: quality,
    },
  };
}
