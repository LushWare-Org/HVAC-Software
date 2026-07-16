/**
 * AddTechnicianModal — Register a new field technician (shared by Team page + Dispatch board).
 *
 * Flow:
 *  1. Admin fills in name, email (required), phone, skills — no location: the
 *     technician sets their own base location on first sign-in in the mobile app.
 *  2. On submit → GET /crm/auth/check-email
 *       • exists  → show error "An account already exists for this email"
 *       • doesn't → POST /crm/auth/provision-technician (CRM user, welcome email)
 *                   POST /scheduling/technicians (dispatch profile, no location)
 *  3. Success banner shown; modal closes after 1.8 s.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, UserPlus, AlertCircle, Loader2, MapPin, Plus, Trash2,
  CheckCircle2, Mail, Camera,
} from "lucide-react";
import api from "../lib/api";
import { useCheckEmail } from "../hooks/useCustomers";
import { useProvisionTechnicianAccount } from "../hooks/useScheduling";
import { useEnsureVan } from "../hooks/useInventory";

// Common trade skills for quick-add chips
const COMMON_SKILLS = [
  "HVAC", "Plumbing", "Electrical", "Carpentry", "Painting",
  "Roofing", "Landscaping", "Appliance Repair", "General Maintenance",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Overrides the header subtitle — used when opened from a specific context (e.g. a project's crew roster). */
  subtitle?: string;
  /** Fired right after the account + scheduling profile are created (before the modal auto-closes). */
  onCreated?: (info: { userId: string; name: string }) => void;
}

export default function AddTechnicianModal({ isOpen, onClose, subtitle, onCreated }: Props) {
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
  });
  const [skills,      setSkills]      = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Lock the dashboard behind the modal — without this, wheel/trackpad input
  // over the backdrop scrolls the page underneath instead of staying put.
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isOpen]);

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
    setForm({ name: "", email: "", phone: "", maxDailyJobs: 5 });
    setSkills([]);
    setCustomSkill("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setError("");
    setSuccess("");
  };

  const handlePickPhoto = (file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Photo must be a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Photo is too large — maximum size is 2 MB.");
      return;
    }
    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
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

    // Step 2: provision CRM account + scheduling profile (no location — the
    // technician sets their base location on first sign-in in the app)
    try {
      const result = await provision.mutateAsync({
        name:        form.name.trim(),
        email,
        phone:       form.phone || undefined,
        skills:      skills.length > 0 ? skills : undefined,
        maxDailyJobs: form.maxDailyJobs,
      });

      // Auto-create van inventory for the new technician
      if (result.scheduling?.id) {
        ensureVan.mutate({
          technicianId:   result.scheduling.id,
          technicianName: form.name.trim(),
        });
      }

      // Upload the optional profile photo (best-effort — the account exists either way)
      let photoNote = "";
      if (photoFile && result.crm?.userId4Scheduling) {
        try {
          const fd = new FormData();
          fd.append("file", photoFile);
          await api.post(`/crm/users/${result.crm.userId4Scheduling}/avatar`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch {
          photoNote = " (photo upload failed — the technician can add it from the app)";
        }
      }

      setSuccess(`Technician account created! Welcome email with login details sent to ${email}.${photoNote}`);
      if (result.crm?.userId4Scheduling) {
        onCreated?.({ userId: result.crm.userId4Scheduling, name: form.name.trim() });
      }
      setTimeout(handleClose, 1800);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? "Failed to create technician.";
      setError(msg);
    }
  };

  const inputCls =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white disabled:bg-gray-50";

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6 admin-modal-backdrop"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add Technician"
        className="bg-white rounded-xl max-w-2xl w-full shadow-2xl flex flex-col admin-modal-box overflow-hidden"
        style={{ height: "min(680px, calc(100vh - 48px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 rounded-t-xl flex items-center justify-between shrink-0">
          <div className="text-white">
            <h3 className="text-lg font-bold">Add Technician</h3>
            <p className="text-blue-200 text-xs mt-0.5">
              {subtitle ?? 'Register a new field technician — creates a login account automatically'}
            </p>
          </div>
          <button onClick={handleClose} className="text-blue-200 hover:text-white p-1 rounded bg-transparent border-0 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        {/* min-h-0 is required so this flex child actually shrinks and
            scrolls instead of growing past the dialog's fixed height */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">

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

          {/* Profile photo (optional) — customers see it in en-route emails */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Profile Photo (optional)</label>
            <div className="flex items-center gap-3">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-14 h-14 rounded-full object-cover border-2 border-blue-400" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                  <Camera size={20} />
                </div>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handlePickPhoto(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isLoading}
                className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium cursor-pointer border border-blue-200 hover:bg-blue-200"
              >
                {photoFile ? "Change photo" : "Choose photo"}
              </button>
              {photoFile && (
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="text-xs text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-400">
              Customers see this photo in "your technician is on the way" emails. Max 2 MB.
            </p>
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

          {/* Base location — set by the technician, not the admin */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-xs">
            <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
            <span>
              <strong className="text-gray-600">Base location:</strong> the technician sets their own
              base location (map or GPS) when they first sign in to the app. Until then they won't be
              considered by smart dispatch auto-assignment.
            </span>
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
    </div>,
    document.body,
  );
}
