/**
 * Technician availability-tier logic — extracted from the old DispatchBoard.tsx
 * so it survives that page's removal. Still imported by TechnicianDetailPanel.tsx
 * and BoardLive.tsx.
 *
 * Sources: scheduling.last_seen_at (GPS/WS pings + login stamp) + crm.lastLoginAt
 * Tiers: ONLINE < 15 min · AVAILABLE < 8 h · AWAY < 24 h · OFFLINE >= 24 h / never
 */
export type AvailabilityTier = "ONLINE" | "AVAILABLE" | "AWAY" | "OFFLINE";

export function getTechAvailability(tech: { lastSeenAt?: string; locationUpdatedAt?: string }, lastLoginAt?: string): AvailabilityTier {
  const signals = [tech.lastSeenAt, tech.locationUpdatedAt, lastLoginAt]
    .filter(Boolean).map(d => new Date(d!).getTime());
  if (!signals.length) return "OFFLINE";
  const newest = Math.max(...signals);
  const mins = (Date.now() - newest) / 60000;
  if (mins < 15)       return "ONLINE";
  if (mins < 8 * 60)   return "AVAILABLE";
  if (mins < 24 * 60)  return "AWAY";
  return "OFFLINE";
}

export const AVAIL_META: Record<AvailabilityTier, { label: string; color: string; dot: string; dim: number }> = {
  ONLINE:    { label: "Online",    color: "#10b981", dot: "#10b981", dim: 1 },
  AVAILABLE: { label: "Available", color: "#2563eb", dot: "#2563eb", dim: 1 },
  AWAY:      { label: "Away",      color: "#f59e0b", dot: "#f59e0b", dim: 0.75 },
  OFFLINE:   { label: "Offline",   color: "#9ca3af", dot: "#9ca3af", dim: 0.45 },
};
