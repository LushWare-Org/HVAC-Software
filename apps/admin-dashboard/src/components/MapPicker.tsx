/**
 * MapPicker — Reusable Leaflet map component for picking GPS coordinates.
 * Uses OpenStreetMap tiles (no API key needed).
 *
 * Usage:
 *   <MapPicker lat={lat} lng={lng} onChange={(lat, lng) => setCoords(lat, lng)} />
 */

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
  zoom?: number;
  label?: string;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prevRef = useRef({ lat, lng });
  useEffect(() => {
    if (prevRef.current.lat !== lat || prevRef.current.lng !== lng) {
      map.setView([lat, lng], map.getZoom());
      prevRef.current = { lat, lng };
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapPicker({ lat, lng, onChange, height = "250px", zoom = 13, label }: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat: newLat, lon: newLng } = data[0];
        onChange(parseFloat(newLat), parseFloat(newLng));
      }
    } catch {
      // Silently fail — user can still click the map
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-semibold text-gray-500 uppercase">{label}</label>}
      {/* Address search bar */}
      <div className="flex gap-2">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search address or place…"
          className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer border-0 disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
      </div>
      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
        <MapContainer
          center={[lat, lng]}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} />
          <ClickHandler onChange={onChange} />
          <RecenterMap lat={lat} lng={lng} />
        </MapContainer>
      </div>
      {/* Coordinates display */}
      <div className="flex items-center gap-3 text-[10px] text-gray-400">
        <span>Lat: {lat.toFixed(6)}</span>
        <span>Lng: {lng.toFixed(6)}</span>
        <span className="italic">Click the map or search to set location</span>
      </div>
    </div>
  );
}
