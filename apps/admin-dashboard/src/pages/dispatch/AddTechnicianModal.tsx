/**
 * AddTechnicianModal — Register a new field technician.
 *
 * Flow:
 *  1. Admin fills in name, email (required), phone, skills, location.
 *  2. On submit → GET /crm/auth/check-email
 *       • exists  → show error "An account already exists for this email"
 *       • doesn't → POST /crm/auth/provision-technician (CRM user, welcome email)
 *                   POST /scheduling/technicians (dispatch profile)
 *  3. Success banner shown; modal closes after 1.8 s.
 */

import { useState } from "react";
import {
  X, UserPlus, AlertCircle, Loader2, MapPin, Plus, Trash2,
  CheckCircle2, Mail,
} from "lucide-react";
import { useCheckEmail } from "../../hooks/useCustomers";
import { useProvisionTechnicianAccount } from "../../hooks/useScheduling";
import { useEnsureVan } from "../../hooks/useInventory";
import { useAuth } from "../../contexts/AuthContext";
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
  const { user }   = useAuth();
  const checkEmail = useCheckEmail();
  const provision  = useProvisionTechnicianAccount();
  const ensureVan  = useEnsureVan();

  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name:         "",
    email:        "",
    phone:        "",
    maxDailyJobs: 5,
    lat:          6.9271,   // Default: Colombo, Sri Lanka
    lng:          79.8612,
  });
  const [skills,      setSkills]      = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  if (!isOpen) return null;

  const isLoading = checkEmail.isPending || provision.isPending;

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

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", maxDailyJobs: 5, lat: 6.9271, lng: 79.8612 });
    setSkills([]);
    setCustomSkill("");
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!form.name.trim()) { setError("Technician name is required."); return; }

    const email = form.email.trim();
    if (!email) { setError("Email address is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.lat === 0 && form.lng === 0) {
      setError("Please set the technician's base location on the map.");
      return;
    }

    // Step 1: check for duplicate email
    let emailCheck: { exists: boolean; role?: string; name?: string };
    try {
      emailCheck = await checkEmail.mutateAsync(email);
    } catch {
      setError("Could not verify email. Please try again.");
      return;
    }

    if (emailCheck.exists) {
      setError(
        `An account is already registered for ${email}` +
        (emailCheck.name ? ` (${emailCheck.name}` + (emailCheck.role ? `, ${emailCheck.role}` : '') + ')' : '') +
        ".",
      );
      return;
    }

    // Step 2: provision CRM account + scheduling profile
    try {
      const result = await provision.mutateAsync({
        companyId:   user!.companyId,
        name:        form.name.trim(),
        email,
        phone:       form.phone || undefined,
        skills:      skills.length > 0 ? skills : undefined,
        maxDailyJobs: form.maxDailyJobs,
        latitude:    form.lat,
        longitude:   form.lng,
      });

      // Auto-create van inventory for the new technician
      if (result.scheduling?.id) {
        ensureVan.mutate({
          technicianId:   result.scheduling.id,
          technicianName: form.name.trim(),
        });
      }

      setSuccess(`Technician account created! Welcome email with login details sent to ${email}.`);
      setTimeout(handleClose, 1800);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? "Failed to create technician.";
      setError(msg);
    }
  };

  const inputCls =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white disabled:bg-gray-50";

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[72px] px-4 pb-4 admin-modal-backdrop"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full shadow-2xl flex flex-col admin-modal-box"
        style={{ maxHeight: "calc(100vh - 80px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 rounded-t-xl flex items-center justify-between shrink-0">
          <div className="text-white">
            <h3 className="text-lg font-bold">Add Technician</h3>
            <p className="text-blue-200 text-xs mt-0.5">
              Register a new field technician — creates a login account automatically
            </p>
          </div>
          <button onClick={handleClose} className="text-blue-200 hover:text-white p-1 rounded bg-transparent border-0 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-500" /> <span>{success}</span>
            </div>
          )}

          {/* Info banner */}
          {!error && !success && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              <Mail size={14} className="mt-0.5 shrink-0 text-blue-500" />
              <span>
                A technician app login account will be created and a welcome email with a temporary
                password will be sent to the technician's email address.
              </span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setError(""); }}
                placeholder="John Smith"
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setError(""); }}
                placeholder="john@example.com"
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+94 77 123 4567"
                disabled={isLoading}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">Max Daily Jobs</label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.maxDailyJobs}
                onChange={(e) => setForm((p) => ({ ...p, maxDailyJobs: Number(e.target.value) }))}
                disabled={isLoading}
                className={`${inputCls} w-32`}
              />
            </div>
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
                      ? "bg-blue-100 text-blue-700 border-blue-300"
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
                className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium cursor-pointer border border-blue-200 hover:bg-blue-200"
              >
                <Plus size={14} />
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                    {s}
                    <button
                      type="button"
                      onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                      className="text-blue-400 hover:text-blue-700 bg-transparent border-0 cursor-pointer p-0"
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
              <MapPin size={10} /> GPS location is used by the smart dispatch scoring algorithm.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-2 border-t border-gray-100 shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border bg-white text-gray-600 text-sm font-medium cursor-pointer hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !!success}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading
              ? <Loader2 size={12} className="animate-spin" />
              : success
              ? <CheckCircle2 size={12} />
              : <UserPlus size={12} />}
            {checkEmail.isPending
              ? "Checking email…"
              : provision.isPending
              ? "Creating account…"
              : success
              ? "Done!"
              : "Add Technician"}
          </button>
        </div>
      </div>
    </div>
  );
}
