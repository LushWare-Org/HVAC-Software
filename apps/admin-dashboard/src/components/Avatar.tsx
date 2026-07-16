const GRADIENTS: [string, string][] = [
  ["#0891B2", "#0369A1"],
  ["#3B82F6", "#2563EB"],
  ["#059669", "#047857"],
  ["#D97706", "#B45309"],
  ["#DB2777", "#9D174D"],
  ["#2563EB", "#1D4ED8"],
];

function gradientForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

function initialsForName(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

/** Circular/rounded avatar: renders a profile photo when available, otherwise a deterministic gradient initials chip. Used everywhere a technician (or other user) identity is shown. */
export default function Avatar({
  name,
  avatarUrl,
  size = 24,
  radius,
  fontSize,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
  radius?: number;
  fontSize?: number;
}) {
  const label = name?.trim() || "?";
  const r = radius ?? Math.round(size * 0.3);
  const fs = fontSize ?? Math.round(size * 0.4);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        style={{
          width: size, height: size, borderRadius: r, flexShrink: 0,
          objectFit: "cover", background: "var(--bg-card-2)",
        }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }

  const [from, to] = gradientForName(label);
  return (
    <div style={{
      width: size, height: size, borderRadius: r, flexShrink: 0,
      background: `linear-gradient(135deg,${from},${to})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: fs, fontWeight: 700, color: "#fff",
    }}>
      {initialsForName(label)}
    </div>
  );
}

export { gradientForName, initialsForName };

/** Raw HTML string variant for non-React contexts (e.g. Leaflet L.divIcon). */
export function avatarHtml(name: string, avatarUrl: string | null | undefined, size: number): string {
  const label = name?.trim() || "?";
  const r = Math.round(size * 0.3);
  if (avatarUrl) {
    return `<img src="${avatarUrl}" alt="" style="width:${size}px;height:${size}px;border-radius:${r}px;object-fit:cover;display:block;" onerror="this.style.display='none'" />`;
  }
  const [from, to] = gradientForName(label);
  const fs = Math.round(size * 0.4);
  return `<div style="width:${size}px;height:${size}px;border-radius:${r}px;background:linear-gradient(135deg,${from},${to});display:flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:700;color:#fff;">${initialsForName(label)}</div>`;
}
