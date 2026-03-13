/**
 * AddTechnicianModal — Register a new field technician with map-based GPS location.
 */

import { useState } from "react";
import {
  X, UserPlus, AlertCircle, Loader2, MapPin, Plus, Trash2,
} from "lucide-react";
import { useCreateTechnician } from "../../hooks/useScheduling";
import MapPicker from "../../components/MapPicker";

// Common trade skills for quick-add chips
const COMMON_SKILLS = [
  "HVAC", "Plumbing", "Electrical", "Carpentry", "Painting",
  "Roofing", "Landscaping", "Appliance Repair", "General Maintenance",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTechnicianModal({ isOpen, onClose }: Props) {
  const create = useCreateTechnician();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    maxDailyJobs: 5,
    lat: 6.9271,  // Default: Colombo, Sri Lanka
    lng: 79.8612,
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const s = customSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
      setCustomSkill("");
    }
  };

  const handleSubmit = () => {
    setError("");
    if (!form.name.trim()) { setError("Technician name is required."); return; }
    if (form.lat === 0 && form.lng === 0) { setError("Please set technician location on the map."); return; }

    create.mutate(
      {
        userId: crypto.randomUUID(),
        name: form.name.trim(),
        phone: form.phone || undefined,
        skills: skills.length > 0 ? skills : undefined,
        maxDailyJobs: form.maxDailyJobs,
        latitude: form.lat,
        longitude: form.lng,
      },
      {
        onSuccess: () => {
          onClose();
          setForm({ name: "", phone: "", maxDailyJobs: 5, lat: 6.9271, lng: 79.8612 });
          setSkills([]);
          setError("");
        },
        onError: (err: any) =>
          setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to create technician."),
      }
    );
  };

  const inputCls =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 rounded-t-xl flex items-center justify-between shrink-0">
          <div className="text-white">
            <h3 className="text-lg font-bold">Add Technician</h3>
            <p className="text-purple-200 text-xs mt-0.5">Register a new field technician for dispatch</p>
          </div>
          <button onClick={onClose} className="text-purple-200 hover:text-white p-1 rounded bg-transparent border-0 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">Full Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="John Smith"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+94 77 123 4567"
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">Max Daily Jobs</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.maxDailyJobs}
              onChange={(e) => setForm((p) => ({ ...p, maxDailyJobs: Number(e.target.value) }))}
              className={`${inputCls} w-32`}
            />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Skills & Specializations</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SKILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSkill(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all ${
                    skills.includes(s)
                      ? "bg-purple-100 text-purple-700 border-purple-300"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {skills.includes(s) ? "✓ " : ""}{s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
                placeholder="Add custom skill…"
                className={`flex-1 ${inputCls}`}
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium cursor-pointer border border-purple-200 hover:bg-purple-200"
              >
                <Plus size={14} />
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                    {s}
                    <button
                      type="button"
                      onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                      className="text-purple-400 hover:text-purple-700 bg-transparent border-0 cursor-pointer p-0"
                    >
                      <Trash2 size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Map Location */}
          <div className="space-y-2">
            <MapPicker
              label="Base Location (for dispatch) *"
              lat={form.lat}
              lng={form.lng}
              onChange={(lat, lng) => setForm((p) => ({ ...p, lat, lng }))}
              height="280px"
            />
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <MapPin size={10} /> GPS location is required for the smart dispatch scoring algorithm.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-2 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border bg-white text-gray-600 text-sm font-medium cursor-pointer hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={create.isPending}
            className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center gap-1.5"
          >
            {create.isPending ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
            {create.isPending ? "Creating…" : "Add Technician"}
          </button>
        </div>
      </div>
    </div>
  );
}
