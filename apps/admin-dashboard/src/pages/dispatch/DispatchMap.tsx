/**
 * DispatchMap — Leaflet map showing technician locations and pending job sites.
 * Lazy-loaded from DispatchBoard to avoid loading Leaflet on initial page load.
 */

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Technician, Job } from "../../types/api";

// Fix default marker icon (Leaflet + bundler issue)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom icons
const techIcon = new L.Icon({
  iconUrl: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%237c3aed" stroke="white" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const jobIcon = new L.Icon({
  iconUrl: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%23f59e0b" stroke="white" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

interface Props {
  technicians: Technician[];
  jobs: Job[];
}

export default function DispatchMap({ technicians, jobs }: Props) {
  // Find center — use first technician or first job with GPS, or default
  const techsWithGPS = technicians.filter((t) => t.currentLocation);
  const jobsWithGPS = jobs.filter((j) => j.serviceLatitude && j.serviceLongitude);

  let centerLat = 6.9271; // Default: Colombo
  let centerLng = 79.8612;
  if (techsWithGPS.length > 0) {
    centerLat = techsWithGPS[0].currentLocation!.lat;
    centerLng = techsWithGPS[0].currentLocation!.lng;
  } else if (jobsWithGPS.length > 0) {
    centerLat = parseFloat(jobsWithGPS[0].serviceLatitude!);
    centerLng = parseFloat(jobsWithGPS[0].serviceLongitude!);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" /> Technicians ({techsWithGPS.length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Pending Jobs ({jobsWithGPS.length})
        </span>
      </div>
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: "500px" }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Technician markers */}
          {techsWithGPS.map((t) => (
            <Marker
              key={`tech-${t.id}`}
              position={[t.currentLocation!.lat, t.currentLocation!.lng]}
              icon={techIcon}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[150px]">
                  <p className="font-bold text-sm">{t.name}</p>
                  {t.phone && <p className="text-gray-500">{t.phone}</p>}
                  <p className="text-purple-600 font-medium">
                    {t.isActive ? "Active" : "Inactive"} · Rating: {t.rating.toFixed(1)}
                  </p>
                  {t.skills?.length > 0 && (
                    <p className="text-gray-500">{t.skills.join(", ")}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          {/* Job markers */}
          {jobsWithGPS.map((j) => (
            <Marker
              key={`job-${j.id}`}
              position={[parseFloat(j.serviceLatitude!), parseFloat(j.serviceLongitude!)]}
              icon={jobIcon}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[150px]">
                  <p className="font-bold text-sm">{j.title}</p>
                  <p className="text-gray-500">{j.customerName ?? "—"}</p>
                  <p className="text-gray-500">{j.serviceAddress ?? "—"}</p>
                  <p className="text-amber-600 font-medium">{j.priority} · {j.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
